import { useEffect, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { startReadSMS } from '@maniac-tech/react-native-expo-read-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseBankSms } from '../utils/sms-parser.js';
import { getDB } from '../services/database.js'; // Import your local SQLite engine

export const useSmsSync = () => {
  const [isListening, setIsListening] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    const requestPermissionsAndListen = async () => {
      if (Platform.OS !== 'android') {
        console.warn('SMS Sync is only supported on Android devices.');
        return;
      }

      try {
        // 1. Ask Android for runtime permission
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_SMS,
          PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        ]);

        if (
          granted['android.permission.READ_SMS'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.RECEIVE_SMS'] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          setPermissionGranted(true);
          setIsListening(true);

          // 2. Attach the Expo native background listener
          startReadSMS(
            async (status, sms, error) => {
              if (status === 'success') {
                const sender = sms.address || sms.originatingAddress;
                const body = sms.body || sms.message;

                // 3. Pass raw text into our 3-Layer Filter
                const parsedData = parseBankSms(body, sender);

                if (parsedData) {
                  try {
                    const db = await getDB();
                    
                    // ==========================================
                    // PHASE 1: LOCAL SQLITE STORAGE (Fast & Offline)
                    // ==========================================
                    
                    // Dynamically generate a local account ID based on the bank mask (e.g., "bank_4321")
                    const localAccountId = parsedData.accountMask ? `bank_${parsedData.accountMask}` : 'bank_unknown';
                    const localAccountName = parsedData.accountMask ? `Bank Acc (**${parsedData.accountMask})` : 'Unknown Bank Acc';
                    
                    // Ensure the bank account exists in local SQLite (INSERT OR IGNORE safely skips if it already exists)
                    await db.runAsync(
                      `INSERT OR IGNORE INTO Accounts (id, name, type, balance) VALUES (?, ?, ?, ?)`,
                      [localAccountId, localAccountName, 'BANK', 0]
                    );

                    // Check if this specific SMS hash already exists locally to prevent duplicates
                    const existingTx = await db.getFirstAsync(
                      'SELECT id FROM Transactions WHERE id = ?', 
                      [parsedData.smsIdentifier]
                    );
                    
                    if (!existingTx) {
                      const isoDate = new Date().toISOString();
                      
                      // Your frontend UI logic expects expenses to be negative numbers
                      const localAmount = parsedData.type === 'EXPENSE' 
                        ? -Math.abs(parsedData.amount) 
                        : Math.abs(parsedData.amount);

                      await db.runAsync(
                        `INSERT INTO Transactions (id, accountId, title, amount, category, date, isBankTransaction, type, rawBankData) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                          parsedData.smsIdentifier, // Using our unique hash as the Primary Key
                          localAccountId, 
                          parsedData.merchant, 
                          localAmount, 
                          'Uncategorized', 
                          isoDate, 
                          1, // Flag as Bank Transaction
                          parsedData.type,
                          parsedData.rawSmsBody
                        ]
                      );
                      console.log('✅ LOCAL SYNC: Saved to SQLite ->', parsedData.smsIdentifier);
                    } else {
                      console.log('⚠️ LOCAL SYNC: Duplicate SMS ignored ->', parsedData.smsIdentifier);
                    }

                    // ==========================================
                    // PHASE 2: CLOUD SYNC (If Authenticated)
                    // ==========================================
                    
                    const token = await AsyncStorage.getItem('accessToken');
                    
                    if (token) {
                      // Note: Change 10.0.2.2 to your local IP address if running on a physical Android phone via Wi-Fi
                      const backendUrl = 'http://10.0.2.2:5000/api/v1/transactions/sync-sms';
                      
                      const response = await fetch(backendUrl, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(parsedData)
                      });

                      const result = await response.json();
                      if (result.success || result.message?.includes('already synced')) {
                        console.log('☁️ CLOUD SYNC: Successfully reached MongoDB ->', parsedData.smsIdentifier);
                      } else {
                        console.error('❌ CLOUD SYNC Failed:', result.message);
                      }
                    }

                  } catch (processingError) {
                    console.error('Error during SMS processing pipeline:', processingError.message);
                  }
                }
              }
            },
            (error) => {
              console.error('SMS Listener Error:', error);
            }
          );
        } else {
          setPermissionGranted(false);
          console.warn('SMS permissions were denied by the user.');
        }
      } catch (error) {
        console.error('Error setting up SMS listener:', error);
      }
    };

    requestPermissionsAndListen();
  }, []);

  return { isListening, permissionGranted };
};
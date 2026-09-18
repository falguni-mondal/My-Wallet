import { useState, useEffect, useCallback } from 'react';
import { Alert, Vibration } from 'react-native'; 
import { format, subDays, subMonths, subYears } from 'date-fns';
import { getDB } from '../services/database';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const DEFAULT_ACCOUNT_ID = 'cash_wallet_1';

export const useTransactions = (selectedAccountId = 'ALL') => {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]); 
  const [limits, setLimits] = useState([]); 
  const [globalBalance, setGlobalBalance] = useState(0); 
  const [isLoading, setIsLoading] = useState(true);

  // Initialize the audio player at the hook level. 
  const alarmPlayer = useAudioPlayer(require('../assets/alarm.mp3'));

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const db = await getDB(); 
      
      let fetchedAccounts = await db.getAllAsync('SELECT * FROM Accounts');
      if (fetchedAccounts.length === 0) {
        await db.runAsync('INSERT INTO Accounts (id, name, type, balance) VALUES (?, ?, ?, ?)', [DEFAULT_ACCOUNT_ID, 'In Hand', 'MANUAL', 0]);
        fetchedAccounts = await db.getAllAsync('SELECT * FROM Accounts');
      }
      setAccounts(fetchedAccounts);

      const fetchedLimits = await db.getAllAsync('SELECT * FROM Limits');
      setLimits(fetchedLimits);

      let txResult;
      if (selectedAccountId === 'ALL') {
        txResult = await db.getAllAsync('SELECT * FROM Transactions ORDER BY date DESC');
      } else {
        txResult = await db.getAllAsync('SELECT * FROM Transactions WHERE accountId = ? ORDER BY date DESC', [selectedAccountId]);
      }
      
      const formattedTransactions = txResult.map(tx => ({
        id: tx.id,
        accountId: tx.accountId,
        title: tx.title,
        amount: tx.amount,
        category: tx.category,
        createdAt: tx.date,
        date: format(new Date(tx.date), 'MMM dd'),
        isBankTransaction: Boolean(tx.isBankTransaction),
        type: tx.type || (tx.amount < 0 ? 'EXPENSE' : 'INCOME'), 
        linkedTransactionId: tx.linkedTransactionId,
        synced: false 
      }));
      
      setTransactions(formattedTransactions);

      let sumResult;
      if (selectedAccountId === 'ALL') {
        sumResult = await db.getAllAsync('SELECT SUM(amount) as total FROM Transactions');
      } else {
        sumResult = await db.getAllAsync('SELECT SUM(amount) as total FROM Transactions WHERE accountId = ?', [selectedAccountId]);
      }
      setGlobalBalance(sumResult[0]?.total || 0);

    } catch (error) {
      console.error('Failed to load transactions', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccountId]); 

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // ==========================================
  // THE MIGRATION ENGINE (Guest to Authenticated)
  // ==========================================
  const syncOfflineData = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      const db = await getDB();
      const localTxs = await db.getAllAsync('SELECT * FROM Transactions');
      
      let syncedCount = 0;
      
      // Sweep local SQLite and push everything to MongoDB using the endpoint we already built
      for (const tx of localTxs) {
        try {
          await api.transactions.syncSms({
            amount: Math.abs(tx.amount),
            type: tx.type || (tx.amount < 0 ? 'EXPENSE' : 'INCOME'),
            merchant: tx.title,
            accountMask: null, 
            smsIdentifier: `manual_${tx.id}`, // Ensures the backend doesn't duplicate this
            rawSmsBody: 'Offline Data Migration',
            transactionDate: tx.date
          });
          syncedCount++;
        } catch(e) {
          // Silently ignore duplicates caught by the backend idempotency index
        } 
      }
      Alert.alert("Cloud Sync Complete ☁️", `${syncedCount} offline transactions securely backed up to MongoDB.`);
    } catch(error) {
      console.error('Migration failed:', error);
    }
  };

  const addTransaction = async (newTransaction) => {
    try {
      const db = await getDB();
      const isoDate = new Date().toISOString(); 
      const targetAccountId = selectedAccountId !== 'ALL' ? selectedAccountId : DEFAULT_ACCOUNT_ID;
      
      // ==========================================
      // THE PROACTIVE BUDGETING ENGINE (Local)
      // ==========================================
      const isExpense = newTransaction.type === 'EXPENSE' || (newTransaction.amount < 0 && newTransaction.type !== 'TRANSFER');
      
      if (isExpense) {
        const expenseAmount = Math.abs(newTransaction.amount);
        const today = new Date();

        const applicableLimits = await db.getAllAsync(
          'SELECT * FROM Limits WHERE accountId = ? OR accountId = ?', 
          [targetAccountId, 'ALL']
        );

        for (const limit of applicableLimits) {
          let startDate;
          if (limit.timeframeType === 'DAYS') startDate = subDays(today, limit.timeframeValue);
          else if (limit.timeframeType === 'MONTHS') startDate = subMonths(today, limit.timeframeValue);
          else if (limit.timeframeType === 'YEARS') startDate = subYears(today, limit.timeframeValue);
          else startDate = subMonths(today, 1);

          const startDateIso = startDate.toISOString();

          let sumQuery = `SELECT SUM(amount) as total FROM Transactions WHERE type != 'TRANSFER' AND amount < 0 AND (category != 'Base Expense' OR category IS NULL) AND date >= ?`;
          let sumParams = [startDateIso];

          if (limit.accountId !== 'ALL') {
            sumQuery += ` AND accountId = ?`;
            sumParams.push(limit.accountId);
          }

          const sumResult = await db.getAllAsync(sumQuery, sumParams);
          const currentSpent = Math.abs(sumResult[0]?.total || 0);
          const thresholdAmount = limit.limitAmount * (limit.thresholdPercentage / 100);
          
          if ((currentSpent + expenseAmount) >= thresholdAmount) {
            // 🔥 ORCHESTRATED ALARM ENGINE 🔥
            const fireWarning = async () => {
              let minTimeMet = false;
              let popupClosed = false;
              let hapticInterval;

              const stopAlarms = () => {
                clearInterval(hapticInterval);
                Vibration.cancel();
                alarmPlayer.pause(); 
              };

              await new Promise(resolve => setTimeout(resolve, 500));
              
              alarmPlayer.seekTo(0);
              alarmPlayer.play();

              Vibration.vibrate([0, 400, 100], true); 
              hapticInterval = setInterval(() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              }, 150);

              setTimeout(() => {
                minTimeMet = true;
                if (popupClosed) stopAlarms();
              }, 3000);
              
              const accountName = limit.accountId === 'ALL' ? 'All Accounts' : 'this account';
              const duration = `${limit.timeframeValue}-${limit.timeframeType.toLowerCase()}`;
              
              Alert.alert(
                "Budget Warning ⚠️",
                `This expense pushes your ${duration} spending to ₹${currentSpent + expenseAmount}.\n\nThis exceeds your warning threshold of ₹${thresholdAmount} (${limit.thresholdPercentage}% of your ₹${limit.limitAmount} limit for ${accountName}).`,
                [{ 
                  text: "Understood", 
                  onPress: () => {
                    popupClosed = true;
                    if (minTimeMet) stopAlarms();
                  } 
                }],
                { cancelable: false } 
              );
            };

            fireWarning();
            break; 
          }
        }
      }
      // ==========================================

      // 1. SAVE TO LOCAL SQLITE FIRST
      if (newTransaction.type === 'TRANSFER') {
        const id1 = newTransaction.id; 
        const id2 = newTransaction.id + '_linked'; 

        await db.runAsync(
          'INSERT INTO Transactions (id, accountId, title, amount, category, date, isBankTransaction, type, linkedTransactionId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [id1, newTransaction.sourceAccountId, newTransaction.title, -Math.abs(newTransaction.amount), 'Transfer', isoDate, 0, 'TRANSFER', id2]
        );

        await db.runAsync(
          'INSERT INTO Transactions (id, accountId, title, amount, category, date, isBankTransaction, type, linkedTransactionId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [id2, newTransaction.targetAccountId, newTransaction.title, Math.abs(newTransaction.amount), 'Transfer', isoDate, 0, 'TRANSFER', id1]
        );
      } else {
        await db.runAsync(
          'INSERT INTO Transactions (id, accountId, title, amount, category, date, isBankTransaction, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            newTransaction.id, 
            targetAccountId, 
            newTransaction.title, 
            newTransaction.amount, 
            newTransaction.category || null, 
            isoDate, 
            0, 
            newTransaction.type || 'EXPENSE'
          ]
        );
      }
      
      // Update UI Instantly
      await loadTransactions();

      // 2. GHOST SYNC TO MONGODB (If Authenticated)
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        try {
          if (newTransaction.type === 'TRANSFER') {
            await api.transactions.syncSms({
              amount: Math.abs(newTransaction.amount),
              type: 'EXPENSE',
              merchant: newTransaction.title + ' (Transfer Out)',
              smsIdentifier: `manual_${newTransaction.id}_out`,
              transactionDate: isoDate
            });
            await api.transactions.syncSms({
              amount: Math.abs(newTransaction.amount),
              type: 'INCOME',
              merchant: newTransaction.title + ' (Transfer In)',
              smsIdentifier: `manual_${newTransaction.id}_in`,
              transactionDate: isoDate
            });
          } else {
            await api.transactions.syncSms({
              amount: Math.abs(newTransaction.amount),
              type: newTransaction.type || (newTransaction.amount < 0 ? 'EXPENSE' : 'INCOME'),
              merchant: newTransaction.title,
              smsIdentifier: `manual_${newTransaction.id}`,
              transactionDate: isoDate
            });
          }
        } catch (cloudError) {
          console.log('Background cloud sync failed. Saved locally.', cloudError.message);
        }
      }

    } catch (error) {
      console.error('Failed to save transaction', error);
    }
  };

  const updateTransaction = async (updatedTransaction) => {
    try {
      const db = await getDB();
      await db.runAsync(
        'UPDATE Transactions SET title = ?, amount = ?, category = ? WHERE id = ?',
        [
          updatedTransaction.title, 
          updatedTransaction.amount, 
          updatedTransaction.category || null, 
          updatedTransaction.id
        ]
      );
      await loadTransactions();

      // Ghost Sync to MongoDB
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        try {
          await api.transactions.update(updatedTransaction.id, {
            merchant: updatedTransaction.title,
            amount: Math.abs(updatedTransaction.amount),
            category: updatedTransaction.category
          });
        } catch (e) {
          console.log('Background update failed or endpoint not yet built.', e.message);
        }
      }
    } catch (error) {
      console.error('Failed to update transaction', error);
    }
  };

  const deleteTransaction = async (id) => {
    try {
      const db = await getDB();
      const tx = await db.getFirstAsync('SELECT linkedTransactionId FROM Transactions WHERE id = ?', [id]);
      await db.runAsync('DELETE FROM Transactions WHERE id = ?', [id]);
      
      if (tx && tx.linkedTransactionId) {
        await db.runAsync('DELETE FROM Transactions WHERE id = ?', [tx.linkedTransactionId]);
      }
      await loadTransactions();

      // Ghost Sync to MongoDB
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        try {
          await api.transactions.delete(id);
        } catch (e) {
          console.log('Background delete failed or endpoint not yet built.', e.message);
        }
      }
    } catch (error) {
      console.error('Failed to delete transaction', error);
    }
  };

  const addLimit = async (newLimit) => {
    try {
      const db = await getDB();
      await db.runAsync(
        'INSERT INTO Limits (id, accountId, limitAmount, timeframeType, timeframeValue, thresholdPercentage) VALUES (?, ?, ?, ?, ?, ?)',
        [
          newLimit.id, 
          newLimit.accountId, 
          newLimit.limitAmount, 
          newLimit.timeframeType, 
          newLimit.timeframeValue, 
          newLimit.thresholdPercentage
        ]
      );
      await loadTransactions();
    } catch (error) {
      console.error('Failed to save limit', error);
    }
  };

  const deleteLimit = async (id) => {
    try {
      const db = await getDB();
      await db.runAsync('DELETE FROM Limits WHERE id = ?', [id]);
      await loadTransactions();
    } catch (error) {
      console.error('Failed to delete limit', error);
    }
  };

  return { 
    transactions, 
    accounts, 
    limits, 
    globalBalance, 
    isLoading, 
    addTransaction, 
    updateTransaction, 
    deleteTransaction,
    addLimit, 
    deleteLimit,
    syncOfflineData // Exported so ProfileScreen can trigger it
  };
};
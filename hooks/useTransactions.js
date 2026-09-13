import { useState, useEffect, useCallback } from 'react';
import { Alert, Vibration } from 'react-native'; 
import { format, subDays, subMonths, subYears } from 'date-fns';
import { getDB } from '../services/database';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';

const DEFAULT_ACCOUNT_ID = 'cash_wallet_1';

export const useTransactions = (selectedAccountId = 'ALL') => {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]); 
  const [limits, setLimits] = useState([]); 
  const [globalBalance, setGlobalBalance] = useState(0); 
  const [isLoading, setIsLoading] = useState(true);

  // Initialize the audio player at the hook level. 
  // (Assuming your assets folder is one level up in the root directory)
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

  const addTransaction = async (newTransaction) => {
    try {
      const db = await getDB();
      const isoDate = new Date().toISOString(); 
      const targetAccountId = selectedAccountId !== 'ALL' ? selectedAccountId : DEFAULT_ACCOUNT_ID;
      
      // ==========================================
      // THE PROACTIVE BUDGETING ENGINE
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

              // Function to kill the alarm entirely
              const stopAlarms = () => {
                clearInterval(hapticInterval);
                Vibration.cancel();
                alarmPlayer.pause(); // <-- Stop audio when user acknowledges
              };

              // 1. Wait for UI to settle (prevents success haptic from canceling this out)
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // 2. Start Audio Alarm
              alarmPlayer.seekTo(0);
              alarmPlayer.play();

              // 3. Start aggressive hardware looping
              Vibration.vibrate([0, 400, 100], true); 
              hapticInterval = setInterval(() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              }, 150);

              // 4. Start the 3-second minimum enforcement clock
              setTimeout(() => {
                minTimeMet = true;
                // If the user already closed the popup, stop it now.
                if (popupClosed) stopAlarms();
              }, 3000);
              
              // 5. Show the visual alert
              const accountName = limit.accountId === 'ALL' ? 'All Accounts' : 'this account';
              const duration = `${limit.timeframeValue}-${limit.timeframeType.toLowerCase()}`;
              
              Alert.alert(
                "Budget Warning ⚠️",
                `This expense pushes your ${duration} spending to ₹${currentSpent + expenseAmount}.\n\nThis exceeds your warning threshold of ₹${thresholdAmount} (${limit.thresholdPercentage}% of your ₹${limit.limitAmount} limit for ${accountName}).`,
                [{ 
                  text: "Understood", 
                  onPress: () => {
                    popupClosed = true;
                    // If 3 seconds have passed, kill it. If not, the setTimeout above will kill it later.
                    if (minTimeMet) stopAlarms();
                  } 
                }],
                // Prevent tapping outside the box to bypass the button press
                { cancelable: false } 
              );
            };

            // Execute the sequence asynchronously
            fireWarning();
            break; 
          }
        }
      }
      // ==========================================

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
      
      await loadTransactions();
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
    deleteLimit 
  };
};
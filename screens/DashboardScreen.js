import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { 
  startOfMonth, subMonths, startOfYear, 
  differenceInDays, parseISO, max 
} from 'date-fns';
import * as Haptics from 'expo-haptics';

import AccountSwitcher from '../components/dashboard/AccountSwitcher';
import BalanceCard from '../components/dashboard/BalanceCard';
import TransactionList from '../components/dashboard/TransactionList';
import AddTransactionModal from '../components/dashboard/AddTransactionModal';
import TimeframeModal, { TIMEFRAMES } from '../components/dashboard/TimeframeModal';
import { useTransactions } from '../hooks/useTransactions';

export default function DashboardScreen() {
  const [activeAccountId, setActiveAccountId] = useState('ALL');

  const { 
    transactions, 
    accounts,
    globalBalance, 
    isLoading, 
    addTransaction, 
    updateTransaction, 
    deleteTransaction
  } = useTransactions(activeAccountId);
  
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  const [activeTimeframe, setActiveTimeframe] = useState(TIMEFRAMES[0]);
  const [isTimeframeModalVisible, setIsTimeframeModalVisible] = useState(false);

  // ==========================================
  // MATHEMATICAL ENGINE (Transfer logic preserved)
  // ==========================================
  const { totalSpent, dailyAverage } = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return { totalSpent: 0, dailyAverage: 0 };
    }

    const today = new Date();
    
    const oldestTransaction = transactions.reduce((oldest, current) => {
      const currentDt = current.createdAt ? parseISO(current.createdAt) : today;
      const oldestDt = oldest.createdAt ? parseISO(oldest.createdAt) : today;
      return currentDt < oldestDt ? current : oldest;
    }, transactions[0]);
    
    const userStartDate = oldestTransaction.createdAt ? parseISO(oldestTransaction.createdAt) : today;
    
    let timeframeStartDate = startOfMonth(today); 
    switch (activeTimeframe.id) {
      case 'THIS_MONTH': timeframeStartDate = startOfMonth(today); break;
      case 'LAST_2_MONTHS': timeframeStartDate = startOfMonth(subMonths(today, 1)); break;
      case 'LAST_3_MONTHS': timeframeStartDate = startOfMonth(subMonths(today, 2)); break;
      case 'LAST_6_MONTHS': timeframeStartDate = startOfMonth(subMonths(today, 5)); break;
      case 'THIS_YEAR': timeframeStartDate = startOfYear(today); break;
      case 'ALL_TIME': timeframeStartDate = userStartDate; break;
    }

    const effectiveStartDate = max([userStartDate, timeframeStartDate]);
    let daysPassed = differenceInDays(today, effectiveStartDate) + 1;
    if (daysPassed < 1) daysPassed = 1;

    const filteredTransactions = transactions.filter(t => {
      if (!t.createdAt) return true; 
      const txDate = parseISO(t.createdAt);
      return txDate >= effectiveStartDate;
    });

    const spent = filteredTransactions
      .filter((t) => t.amount < 0 && t.category !== 'Base Expense' && t.type !== 'TRANSFER')
      .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
      
    const avg = spent / daysPassed;

    return {
      totalSpent: spent,
      dailyAverage: avg.toFixed(0)
    };
  }, [transactions, activeTimeframe]); 

  const handleOpenAddModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTransaction(null); 
    setIsAddModalVisible(true);
  };

  const handleTransactionPress = (transaction) => {
    setSelectedTransaction(transaction); 
    setIsAddModalVisible(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      <AccountSwitcher 
        accounts={accounts}
        activeAccountId={activeAccountId}
        onSelectAccount={(id) => {
          Haptics.selectionAsync(); 
          setActiveAccountId(id);
        }}
      />

      <BalanceCard 
        totalBalance={globalBalance} 
        totalSpent={totalSpent} 
        dailyAverage={dailyAverage} 
        timeframeLabel={activeTimeframe.label}
        onTimeframePress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsTimeframeModalVisible(true);
        }}
      />

      <TransactionList 
        transactions={transactions} 
        onTransactionPress={handleTransactionPress} 
        onDeleteTransaction={deleteTransaction} 
      />

      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={handleOpenAddModal}>
        <Ionicons name="add" size={36} color="#09090B" />
      </TouchableOpacity>

      <AddTransactionModal 
        visible={isAddModalVisible} 
        onClose={() => setIsAddModalVisible(false)} 
        selectedTransaction={selectedTransaction}
        accounts={accounts} 
        activeAccountId={activeAccountId}
        onSave={(newTx) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          addTransaction(newTx);
          setIsAddModalVisible(false);
        }}
        onUpdate={(updatedTx) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          updateTransaction(updatedTx);
          setIsAddModalVisible(false);
        }}
        onDelete={(id) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          deleteTransaction(id);
          setIsAddModalVisible(false);
        }}
      />

      <TimeframeModal 
        visible={isTimeframeModalVisible}
        onClose={() => setIsTimeframeModalVisible(false)}
        activeTimeframe={activeTimeframe}
        onSelectTimeframe={(item) => {
          Haptics.selectionAsync(); 
          setActiveTimeframe(item);
          setIsTimeframeModalVisible(false);
        }}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { 
    flex: 1, 
    backgroundColor: '#09090B', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  container: { 
    flex: 1, 
    backgroundColor: '#09090B',
    paddingTop: 16, 
  },
  fab: { 
    position: 'absolute', 
    right: 24, 
    bottom: 30, 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: '#FFFFFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    elevation: 5 
  },
});
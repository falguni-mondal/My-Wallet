import React, { useRef } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Animated, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// We extract the row into its own component so it can maintain its own swipe reference
const TransactionRow = ({ item, onTransactionPress, onDeleteTransaction }) => {
  const swipeableRef = useRef(null);

  const isTransfer = item.type === 'TRANSFER';
  const isIncome = item.amount > 0;
  
  let amountColor = isIncome ? '#10B981' : '#EF4444';
  if (isTransfer) amountColor = '#3B82F6';

  // Automatically triggers the moment the swipe threshold is crossed
  const handleSwipeAction = (direction) => {
    // 1. Instantly snap the row back closed
    swipeableRef.current?.close();

    if (direction === 'left') {
      // Swiped Left-to-Right (Revealing Green Edit Action)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onTransactionPress(item);
    } 
    else if (direction === 'right') {
      // Swiped Right-to-Left (Revealing Red Delete Action)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Delete Transaction",
        "Are you sure you want to remove this entry?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Delete", 
            style: "destructive", 
            onPress: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              if (onDeleteTransaction) onDeleteTransaction(item.id);
            }
          }
        ]
      );
    }
  };

  // Background visual for Swiping Left-to-Right (Edit)
  const renderLeftActions = (progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [0, 80],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
    return (
      <View style={styles.leftAction}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="create" size={24} color="#FFFFFF" />
        </Animated.View>
      </View>
    );
  };

  // Background visual for Swiping Right-to-Left (Delete)
  const renderRightActions = (progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });
    return (
      <View style={styles.rightAction}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash" size={24} color="#FFFFFF" />
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      onSwipeableWillOpen={handleSwipeAction} // Fires instantly without waiting for tap
      friction={2}
      leftThreshold={60} // Require an intentional swipe
      rightThreshold={60} 
    >
      <TouchableOpacity 
        style={styles.transactionRow} 
        activeOpacity={1} 
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onTransactionPress(item);
        }}
      >
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle}>{item.title}</Text>
          <Text style={styles.transactionCategory}>
            {item.category} • {item.date}
          </Text>
        </View>
        <Text style={[styles.transactionAmount, { color: amountColor }]}>
          {isIncome && !isTransfer ? '+' : ''}₹{Math.abs(item.amount).toLocaleString('en-IN')}
        </Text>
      </TouchableOpacity>
    </Swipeable>
  );
};


export default function TransactionList({ transactions, onTransactionPress, onDeleteTransaction }) {
  return (
    <View style={styles.listContainer}>
      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Text style={styles.countText}>{transactions.length} items</Text>
      </View>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionRow 
            item={item} 
            onTransactionPress={onTransactionPress} 
            onDeleteTransaction={onDeleteTransaction} 
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: { flex: 1, paddingHorizontal: 24 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontFamily: 'Jakarta-Bold', fontSize: 18, color: '#FFFFFF' },
  countText: { fontFamily: 'Jakarta-Regular', fontSize: 13, color: '#A1A1AA' },
  
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#18181B', 
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#27272A', 
  },
  transactionInfo: { flex: 1 },
  transactionTitle: { fontFamily: 'Jakarta-SemiBold', fontSize: 15, color: '#FFFFFF', marginBottom: 3 },
  transactionCategory: { fontFamily: 'Jakarta-Regular', fontSize: 12, color: '#71717A' },
  transactionAmount: { fontFamily: 'Jakarta-Bold', fontSize: 15 },

  // Swipe Action Styles - Changed to fill the space cleanly
  leftAction: {
    backgroundColor: '#10B981', 
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 24,
    borderRadius: 16,
    marginBottom: 10,
    flex: 1,
  },
  rightAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 24,
    borderRadius: 16,
    marginBottom: 10,
    flex: 1,
  },
});
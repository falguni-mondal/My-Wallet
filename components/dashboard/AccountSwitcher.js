import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AccountSwitcher({ accounts, activeAccountId, onSelectAccount }) {
  const displayAccounts = [
    { id: 'ALL', name: 'All Accounts', type: 'AGGREGATE' },
    ...accounts
  ];

  const getIconName = (type) => {
    if (type === 'AGGREGATE') return 'layers';
    if (type === 'BANK') return 'business'; // Bank building icon
    return 'wallet'; // Manual wallets
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {displayAccounts.map((acc) => {
          const isActive = activeAccountId === acc.id;
          const iconColor = isActive ? '#09090B' : '#A1A1AA';
          
          return (
            <TouchableOpacity
              key={acc.id}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => onSelectAccount(acc.id)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={getIconName(acc.type)} 
                size={16} 
                color={iconColor} 
                style={styles.pillIcon}
              />
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {acc.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 4 },
  pill: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#09090B',
    borderWidth: 1,
    borderColor: '#27272A',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  pillIcon: { marginRight: 6 },
  pillText: { fontFamily: 'Jakarta-SemiBold', fontSize: 14, color: '#A1A1AA' },
  pillTextActive: { color: '#09090B', fontFamily: 'Jakarta-Bold' }
});
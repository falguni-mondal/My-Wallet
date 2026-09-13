import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BalanceCard({ 
  totalBalance, 
  totalSpent, 
  dailyAverage, 
  timeframeLabel = "This Month", 
  onTimeframePress 
}) {
  return (
    <View style={styles.card}>
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Net Balance</Text>
        <Text style={styles.balanceAmount} numberOfLines={1} adjustsFontSizeToFit>
          ₹{totalBalance.toLocaleString('en-IN')}
        </Text>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.statsContainer}>
        {/* Outflow Stat */}
        <TouchableOpacity 
          style={styles.statBox} 
          activeOpacity={0.7} 
          onPress={onTimeframePress}
        >
          <View style={styles.timeframeTrigger}>
            <Text style={styles.statLabel} numberOfLines={1}>Outflow ({timeframeLabel})</Text>
            <Ionicons name="chevron-down" size={14} color="#A1A1AA" style={styles.arrowIcon} />
          </View>
          <Text style={[styles.statValue, styles.outflowColor]} numberOfLines={1} adjustsFontSizeToFit>
            ₹{totalSpent.toLocaleString('en-IN')}
          </Text>
        </TouchableOpacity>
        
        {/* Daily Avg Stat */}
        <TouchableOpacity 
          style={[styles.statBox, styles.rightAlign]} 
          activeOpacity={0.7} 
          onPress={onTimeframePress}
        >
          <View style={styles.timeframeTrigger}>
            <Text style={styles.statLabel} numberOfLines={1}>Avg ({timeframeLabel})</Text>
            <Ionicons name="chevron-down" size={14} color="#A1A1AA" style={styles.arrowIcon} />
          </View>
          <Text style={[styles.statValue, styles.avgColor]} numberOfLines={1} adjustsFontSizeToFit>
            ₹{dailyAverage.toLocaleString('en-IN')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#18181B',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  balanceContainer: {
    marginBottom: 20,
  },
  balanceLabel: {
    fontFamily: 'Jakarta-SemiBold',
    fontSize: 14,
    color: '#A1A1AA',
    marginBottom: 8,
  },
  balanceAmount: {
    fontFamily: 'Jakarta-Bold',
    fontSize: 36,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
  },
  rightAlign: {
    alignItems: 'flex-end',
  },
  timeframeTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statLabel: {
    fontFamily: 'Jakarta-SemiBold',
    fontSize: 11,
    color: '#A1A1AA',
  },
  arrowIcon: {
    marginLeft: 4,
  },
  statValue: {
    fontFamily: 'Jakarta-Bold',
    fontSize: 18,
  },
  outflowColor: {
    color: '#EF4444',
  },
  avgColor: {
    color: '#FBBF24',
  },
});
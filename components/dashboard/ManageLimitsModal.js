import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, Modal, TextInput, 
  KeyboardAvoidingView, Platform, Keyboard, FlatList, Alert, Animated, Pressable, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ManageLimitsModal({
  visible, onClose, accounts, limits, onAddLimit, onDeleteLimit
}) {
  // Form State
  const [limitAmount, setLimitAmount] = useState('');
  const [timeframeValue, setTimeframeValue] = useState('1');
  const [timeframeType, setTimeframeType] = useState('MONTHS'); // 'DAYS', 'MONTHS', 'YEARS'
  const [thresholdPercentage, setThresholdPercentage] = useState('80');
  const [accountId, setAccountId] = useState('ALL');

  // Animation State
  const slideAnim = useRef(new Animated.Value(800)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4, speed: 12 }),
        Animated.timing(fadeAnim, { toValue: 0.6, duration: 200, useNativeDriver: true })
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  const animateOut = (callback) => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 800, duration: 250, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true })
    ]).start(() => {
      if (callback) callback();
    });
  };

  const handleClose = () => animateOut(onClose);

  const resetForm = () => {
    setLimitAmount('');
    setTimeframeValue('1');
    setTimeframeType('MONTHS');
    setThresholdPercentage('80');
    setAccountId('ALL');
  };

  const handleSaveLimit = () => {
    if (!limitAmount || !timeframeValue || !thresholdPercentage) {
      Alert.alert('Missing Fields', 'Please fill out all the limit settings.');
      return;
    }
    
    onAddLimit({
      id: Date.now().toString(),
      accountId,
      limitAmount: parseFloat(limitAmount),
      timeframeType,
      timeframeValue: parseInt(timeframeValue, 10),
      thresholdPercentage: parseFloat(thresholdPercentage)
    });
    
    resetForm();
    Alert.alert('Success', 'Active spending limit created!');
  };

  const getAccountName = (id) => {
    if (id === 'ALL') return 'All Accounts (Global)';
    const acc = accounts.find(a => a.id === id);
    return acc ? acc.name : 'Unknown';
  };

  // Render existing limits
  const renderExistingLimit = ({ item }) => (
    <View style={styles.limitCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.limitTitle}>
          ₹{item.limitAmount.toLocaleString()} per {item.timeframeValue} {item.timeframeType.toLowerCase()}
        </Text>
        <Text style={styles.limitSubtitle}>
          Account: {getAccountName(item.accountId)} • Warns at {item.thresholdPercentage}%
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.deleteLimitBtn} 
        onPress={() => onDeleteLimit(item.id)}
      >
        <Ionicons name="trash" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} animationType="none" transparent={true} onRequestClose={handleClose}>
      <View style={styles.modalWrapper}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000', opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[styles.animatedSheet, { transform: [{ translateY: slideAnim }] }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Spending Limits</Text>
              <TouchableOpacity onPress={handleClose}><Text style={styles.closeButton}>✕</Text></TouchableOpacity>
            </View>

            {/* Existing Limits List */}
            {limits.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.sectionHeader}>Active Limits</Text>
                <FlatList 
                  data={limits}
                  keyExtractor={item => item.id}
                  renderItem={renderExistingLimit}
                  style={{ maxHeight: 150 }}
                  nestedScrollEnabled
                />
              </View>
            )}

            <Text style={styles.sectionHeader}>Create New Limit</Text>

            {/* Amount & Threshold */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 2, marginRight: 10 }]}>
                <Text style={styles.inputLabel}>Limit Amount (₹)</Text>
                <TextInput style={styles.input} keyboardType="numeric" placeholder="e.g. 10000" placeholderTextColor="#71717A" value={limitAmount} onChangeText={setLimitAmount} />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Warn At (%)</Text>
                <TextInput style={styles.input} keyboardType="numeric" placeholder="80" placeholderTextColor="#71717A" value={thresholdPercentage} onChangeText={setThresholdPercentage} />
              </View>
            </View>

            {/* Timeframe Engine */}
            <Text style={styles.inputLabel}>Frequency</Text>
            <View style={styles.row}>
              <Text style={styles.staticText}>Every</Text>
              <TextInput style={[styles.input, { flex: 0.5, marginHorizontal: 10, textAlign: 'center' }]} keyboardType="numeric" value={timeframeValue} onChangeText={setTimeframeValue} />
              
              <View style={styles.typeSelector}>
                {['DAYS', 'MONTHS', 'YEARS'].map((type) => (
                  <TouchableOpacity 
                    key={type}
                    style={[styles.typeBtn, timeframeType === type && styles.typeBtnActive]}
                    onPress={() => setTimeframeType(type)}
                  >
                    <Text style={[styles.typeBtnText, timeframeType === type && styles.typeBtnTextActive]}>
                      {type.toLowerCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Account Selector */}
            <Text style={styles.inputLabel}>Apply To</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
              {[{ id: 'ALL', name: 'All Accounts' }, ...accounts].map(acc => (
                <TouchableOpacity 
                  key={acc.id} 
                  style={[styles.accountPill, accountId === acc.id && styles.accountPillActive]}
                  onPress={() => setAccountId(acc.id)}
                >
                  <Text style={[styles.accountPillText, accountId === acc.id && styles.accountPillTextActive]}>{acc.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} activeOpacity={0.8} onPress={handleSaveLimit}>
              <Text style={styles.saveButtonText}>Create Limit</Text>
            </TouchableOpacity>

          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalWrapper: { flex: 1, justifyContent: 'flex-end' },
  animatedSheet: { width: '100%' },
  modalContent: { 
    backgroundColor: '#18181B', borderTopLeftRadius: 28, borderTopRightRadius: 28, 
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: 'Jakarta-Bold', fontSize: 20, color: '#FFFFFF' }, 
  closeButton: { fontFamily: 'Jakarta-Bold', fontSize: 18, color: '#A1A1AA', padding: 4 },
  sectionHeader: { fontFamily: 'Jakarta-SemiBold', fontSize: 16, color: '#FFFFFF', marginBottom: 12, marginTop: 10 },
  
  limitCard: { flexDirection: 'row', backgroundColor: '#09090B', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#27272A', alignItems: 'center' },
  limitTitle: { fontFamily: 'Jakarta-SemiBold', fontSize: 14, color: '#FFFFFF', marginBottom: 4 },
  limitSubtitle: { fontFamily: 'Jakarta-Regular', fontSize: 12, color: '#A1A1AA' },
  deleteLimitBtn: { padding: 8 },

  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  inputGroup: { flexDirection: 'column' },
  inputLabel: { fontFamily: 'Jakarta-SemiBold', fontSize: 12, color: '#A1A1AA', marginBottom: 6, textTransform: 'uppercase' },
  input: { fontFamily: 'Jakarta-Regular', backgroundColor: '#09090B', borderWidth: 1, borderColor: '#27272A', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#FFFFFF' },
  staticText: { fontFamily: 'Jakarta-Regular', color: '#A1A1AA', fontSize: 16 },

  typeSelector: { flex: 1, flexDirection: 'row', backgroundColor: '#09090B', borderRadius: 12, borderWidth: 1, borderColor: '#27272A', overflow: 'hidden' },
  typeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  typeBtnActive: { backgroundColor: '#3B82F6' },
  typeBtnText: { fontFamily: 'Jakarta-SemiBold', fontSize: 12, color: '#A1A1AA', textTransform: 'capitalize' },
  typeBtnTextActive: { color: '#FFFFFF' },

  accountPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#09090B', borderWidth: 1, borderColor: '#27272A', marginRight: 10 },
  accountPillActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  accountPillText: { fontFamily: 'Jakarta-SemiBold', fontSize: 13, color: '#A1A1AA' },
  accountPillTextActive: { color: '#09090B' },

  saveButton: { backgroundColor: '#FFFFFF', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  saveButtonText: { fontFamily: 'Jakarta-Bold', color: '#09090B', fontSize: 16 }, 
});
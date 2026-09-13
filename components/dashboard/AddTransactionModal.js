import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  FlatList,
  Alert,
  Animated,
  Dimensions,
  Pressable 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES } from '../../constants/categories'; 

const { height } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AddTransactionModal({ 
  visible, 
  onClose, 
  onSave, 
  onUpdate, 
  onDelete, 
  selectedTransaction,
  accounts = [], // NEW: We receive the accounts list here
  activeAccountId
}) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  
  // NEW: 3-way transaction type state
  const [txType, setTxType] = useState('EXPENSE'); // 'EXPENSE' | 'INCOME' | 'TRANSFER'
  
  // NEW: Transfer-specific state
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  
  // Picker visibility states
  const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState(false);
  const [isAccountPickerVisible, setIsAccountPickerVisible] = useState(false);
  const [accountPickerSide, setAccountPickerSide] = useState('SOURCE'); // 'SOURCE' | 'TARGET'
  const [searchQuery, setSearchQuery] = useState('');

  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      if (selectedTransaction) {
        setTitle(selectedTransaction.title);
        setAmount(Math.abs(selectedTransaction.amount).toString());
        setCategory(selectedTransaction.category);
        setTxType(selectedTransaction.type || (selectedTransaction.amount < 0 ? 'EXPENSE' : 'INCOME'));
        // NOTE: Editing existing transfers is complex (requires updating two rows), 
        // so for now we'll allow viewing/deleting, but editing is disabled for transfers.
      } else {
        resetForm();
      }

      slideAnim.setValue(height);
      fadeAnim.setValue(0);

      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4, speed: 12 }),
        Animated.timing(fadeAnim, { toValue: 0.6, duration: 200, useNativeDriver: true })
      ]).start();
    }
  }, [visible, selectedTransaction, slideAnim, fadeAnim, activeAccountId, accounts]);

  const animateOut = (callback) => {
    Keyboard.dismiss(); 
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true })
    ]).start(() => {
      if (callback) callback();
    });
  };

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setCategory('');
    setTxType('EXPENSE');
    setSearchQuery('');
    
    // Default the source account to the currently active one (if not 'ALL')
    const defaultSource = activeAccountId !== 'ALL' ? activeAccountId : (accounts[0]?.id || '');
    setSourceAccountId(defaultSource);
    setTargetAccountId('');
  };

  const handleClose = () => animateOut(() => { resetForm(); onClose(); });

  const handleSave = () => {
    if (!title.trim() || !amount.trim()) {
      Alert.alert('Missing Info', 'Please fill out the title and amount.');
      return;
    }
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    if (txType === 'TRANSFER') {
      if (!sourceAccountId || !targetAccountId) {
        Alert.alert('Missing Accounts', 'Please select both a source and target account for the transfer.');
        return;
      }
      if (sourceAccountId === targetAccountId) {
        Alert.alert('Invalid Transfer', 'Source and target accounts cannot be the same.');
        return;
      }
      
      animateOut(() => {
        onSave({ 
          id: Date.now().toString(), 
          title: title.trim(), 
          amount: parsedAmount, 
          type: 'TRANSFER',
          sourceAccountId,
          targetAccountId
        });
        resetForm();
      });
    } else {
      // Normal Expense or Income
      if (!category) {
        Alert.alert('Missing Category', 'Please select a category.');
        return;
      }
      const finalAmount = txType === 'EXPENSE' ? -parsedAmount : parsedAmount;

      animateOut(() => {
        if (selectedTransaction) {
          onUpdate({ ...selectedTransaction, title: title.trim(), category, amount: finalAmount });
        } else {
          onSave({ id: Date.now().toString(), title: title.trim(), category, amount: finalAmount, type: txType });
        }
        resetForm();
      });
    }
  };

  const handleDelete = () => {
    if (selectedTransaction) animateOut(() => { onDelete(selectedTransaction.id); resetForm(); });
  };

  // Helper to get account name by ID
  const getAccountName = (id) => {
    const acc = accounts.find(a => a.id === id);
    return acc ? acc.name : 'Select Account';
  };

  const filteredCategories = CATEGORIES.filter(c => {
    const matchesType = c.type === (txType === 'EXPENSE' ? 'expense' : 'income');
    const matchesSearch = c.label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Only show manual or bank accounts in the picker (exclude 'ALL')
  const selectableAccounts = accounts.filter(a => a.id !== 'ALL');

  return (
    <Modal visible={visible} animationType="none" transparent={true} onRequestClose={handleClose}>
      <View style={styles.modalWrapper}>
        
        <AnimatedPressable
          style={[StyleSheet.absoluteFill, { backgroundColor: '#000000', opacity: fadeAnim }]}
          onPress={handleClose}
        />

        <Animated.View style={[styles.animatedSheet, { transform: [{ translateY: slideAnim }] }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedTransaction ? 'Edit Transaction' : 'Add Transaction'}</Text>
              <TouchableOpacity onPress={handleClose}><Text style={styles.closeButton}>✕</Text></TouchableOpacity>
            </View>

            {/* 3-WAY TYPE SELECTOR */}
            <View style={styles.typeSelector}>
              <TouchableOpacity style={[styles.typeButton, txType === 'EXPENSE' && styles.typeButtonActiveExpense]} onPress={() => { setTxType('EXPENSE'); setCategory(''); }}>
                <Text style={[styles.typeText, txType === 'EXPENSE' && styles.typeTextActive]}>Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeButton, txType === 'INCOME' && styles.typeButtonActiveIncome]} onPress={() => { setTxType('INCOME'); setCategory(''); }}>
                <Text style={[styles.typeText, txType === 'INCOME' && styles.typeTextActive]}>Income</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeButton, txType === 'TRANSFER' && styles.typeButtonActiveTransfer]} onPress={() => setTxType('TRANSFER')}>
                <Text style={[styles.typeText, txType === 'TRANSFER' && styles.typeTextActive]}>Transfer</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Title</Text>
            <TextInput style={styles.input} placeholder={txType === 'TRANSFER' ? "e.g. ATM Withdrawal" : "e.g. Coffee"} placeholderTextColor="#71717A" value={title} onChangeText={setTitle} />
            
            <Text style={styles.inputLabel}>Amount (₹)</Text>
            <TextInput style={styles.input} placeholder="0" placeholderTextColor="#71717A" keyboardType="numeric" value={amount} onChangeText={setAmount} />
            
            {/* CONDITIONAL RENDERING BASED ON TX TYPE */}
            {txType === 'TRANSFER' ? (
              <View style={styles.transferContainer}>
                <View style={styles.transferHalf}>
                  <Text style={styles.inputLabel}>From Account</Text>
                  <TouchableOpacity style={styles.categorySelectorTrigger} onPress={() => { setAccountPickerSide('SOURCE'); Keyboard.dismiss(); setIsAccountPickerVisible(true); }}>
                    <Text style={[styles.categoryTriggerText, !sourceAccountId && { color: '#71717A' }]} numberOfLines={1}>{getAccountName(sourceAccountId)}</Text>
                    <Ionicons name="chevron-down" size={16} color="#A1A1AA" />
                  </TouchableOpacity>
                </View>
                <View style={styles.transferIconWrapper}>
                  <Ionicons name="arrow-forward" size={24} color="#A1A1AA" />
                </View>
                <View style={styles.transferHalf}>
                  <Text style={styles.inputLabel}>To Account</Text>
                  <TouchableOpacity style={styles.categorySelectorTrigger} onPress={() => { setAccountPickerSide('TARGET'); Keyboard.dismiss(); setIsAccountPickerVisible(true); }}>
                    <Text style={[styles.categoryTriggerText, !targetAccountId && { color: '#71717A' }]} numberOfLines={1}>{getAccountName(targetAccountId)}</Text>
                    <Ionicons name="chevron-down" size={16} color="#A1A1AA" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.inputLabel}>Category</Text>
                <TouchableOpacity style={styles.categorySelectorTrigger} activeOpacity={0.7} onPress={() => { Keyboard.dismiss(); setIsCategoryPickerVisible(true); }}>
                  <Text style={[styles.categoryTriggerText, !category && { color: '#71717A' }]}>{category || 'Select a category'}</Text>
                  <Ionicons name="chevron-down" size={20} color="#A1A1AA" />
                </TouchableOpacity>
              </>
            )}

            {/* Editing a transfer is disabled to prevent sync issues, user should delete and recreate */}
            {selectedTransaction && selectedTransaction.type === 'TRANSFER' ? (
              <Text style={styles.transferWarning}>Transfers cannot be edited. Please delete and recreate if needed.</Text>
            ) : (
              <TouchableOpacity style={styles.saveButton} activeOpacity={0.8} onPress={handleSave}>
                <Text style={styles.saveButtonText}>{selectedTransaction ? 'Update Transaction' : 'Save Transaction'}</Text>
              </TouchableOpacity>
            )}

            {selectedTransaction && (
              <TouchableOpacity style={styles.deleteButton} activeOpacity={0.8} onPress={handleDelete}>
                <Text style={styles.deleteButtonText}>Delete Transaction</Text>
              </TouchableOpacity>
            )}

          </KeyboardAvoidingView>
        </Animated.View>
      </View>

      {/* CATEGORY PICKER MODAL */}
      <Modal visible={isCategoryPickerVisible} animationType="slide" transparent={true}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => { setIsCategoryPickerVisible(false); setSearchQuery(''); }}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#A1A1AA" />
              <TextInput style={styles.searchInput} placeholder="Search categories..." placeholderTextColor="#71717A" value={searchQuery} onChangeText={setSearchQuery} autoFocus={false} />
            </View>

            <FlatList 
              data={filteredCategories}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item }) => (
                <View style={styles.categoryRow}>
                  <TouchableOpacity style={styles.categorySelectArea} activeOpacity={0.7} onPress={() => { setCategory(item.label); setIsCategoryPickerVisible(false); setSearchQuery(''); }}>
                    <View style={[styles.iconCircle, { backgroundColor: item.color + '20' }]}><Ionicons name={item.icon} size={24} color={item.color} /></View>
                    <Text style={styles.categoryLabel}>{item.label}</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptySearchText}>No categories found.</Text>}
            />
          </View>
        </View>
      </Modal>

      {/* ACCOUNT PICKER MODAL (For Transfers) */}
      <Modal visible={isAccountPickerVisible} animationType="slide" transparent={true}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>
                Select {accountPickerSide === 'SOURCE' ? 'Source' : 'Destination'}
              </Text>
              <TouchableOpacity onPress={() => setIsAccountPickerVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList 
              data={selectableAccounts}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.categoryRow} // Reusing category row styles
                  activeOpacity={0.7} 
                  onPress={() => { 
                    if (accountPickerSide === 'SOURCE') setSourceAccountId(item.id);
                    else setTargetAccountId(item.id);
                    setIsAccountPickerVisible(false); 
                  }}
                >
                  <View style={styles.categorySelectArea}>
                    <View style={[styles.iconCircle, { backgroundColor: '#3B82F620' }]}>
                      <Ionicons name="wallet" size={24} color="#3B82F6" />
                    </View>
                    <Text style={styles.categoryLabel}>{item.name}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

    </Modal>
  );
}

const styles = StyleSheet.create({
  modalWrapper: { flex: 1, justifyContent: 'flex-end' },
  animatedSheet: { width: '100%', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: '#18181B', 
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28, 
    padding: 24, 
    paddingBottom: Platform.OS === 'ios' ? 40 : 24, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: -4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 10, 
    elevation: 10 
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: 'Jakarta-Bold', fontSize: 20, color: '#FFFFFF' }, 
  closeButton: { fontFamily: 'Jakarta-Bold', fontSize: 18, color: '#A1A1AA', padding: 4 },
  
  // 3-Way Selector
  typeSelector: { 
    flexDirection: 'row', 
    backgroundColor: '#09090B', 
    borderWidth: 1,
    borderColor: '#27272A', 
    borderRadius: 12, 
    padding: 4, 
    marginBottom: 18 
  },
  typeButton: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  typeButtonActiveExpense: { backgroundColor: '#EF4444' },
  typeButtonActiveIncome: { backgroundColor: '#10B981' },
  typeButtonActiveTransfer: { backgroundColor: '#3B82F6' }, // Blue for transfers
  typeText: { fontFamily: 'Jakarta-SemiBold', fontSize: 13, color: '#A1A1AA', textAlign: 'center' },
  typeTextActive: { color: '#FFFFFF' },
  
  inputLabel: { fontFamily: 'Jakarta-SemiBold', fontSize: 12, color: '#A1A1AA', marginBottom: 6, textTransform: 'uppercase' },
  input: { 
    fontFamily: 'Jakarta-Regular', 
    backgroundColor: '#09090B', 
    borderWidth: 1, 
    borderColor: '#27272A', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    fontSize: 16, 
    color: '#FFFFFF', 
    marginBottom: 16 
  },
  
  // Transfer Specific Styles
  transferContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transferHalf: {
    flex: 1,
  },
  transferIconWrapper: {
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  transferWarning: {
    fontFamily: 'Jakarta-Regular',
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  
  saveButton: { 
    backgroundColor: '#FFFFFF', 
    paddingVertical: 16, 
    borderRadius: 14, 
    alignItems: 'center', 
    marginTop: 8 
  },
  saveButtonText: { fontFamily: 'Jakarta-Bold', color: '#09090B', fontSize: 16 }, 
  
  deleteButton: { 
    backgroundColor: '#18181B', 
    borderWidth: 1, 
    borderColor: '#7F1D1D', 
    paddingVertical: 16, 
    borderRadius: 14, 
    alignItems: 'center', 
    marginTop: 12 
  },
  deleteButtonText: { fontFamily: 'Jakarta-Bold', color: '#EF4444', fontSize: 16 },
  
  categorySelectorTrigger: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#09090B', 
    borderWidth: 1, 
    borderColor: '#27272A', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    marginBottom: 16 
  },
  categoryTriggerText: { flex: 1, fontFamily: 'Jakarta-Regular', fontSize: 16, color: '#FFFFFF' }, 

  // Full Screen Picker Styles
  pickerOverlay: { 
    flex: 1, 
    backgroundColor: '#09090B', 
    marginTop: Platform.OS === 'ios' ? 40 : 0 
  },
  pickerContent: { flex: 1, padding: 24 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pickerTitle: { fontFamily: 'Jakarta-Bold', fontSize: 24, color: '#FFFFFF' }, 
  
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#18181B', 
    borderWidth: 1,
    borderColor: '#27272A', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    marginBottom: 20 
  },
  searchInput: { flex: 1, fontFamily: 'Jakarta-Regular', fontSize: 16, color: '#FFFFFF', marginLeft: 10 }, 
  
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  categorySelectArea: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  categoryLabel: { fontFamily: 'Jakarta-SemiBold', fontSize: 16, color: '#FFFFFF' }, 
  emptySearchText: { fontFamily: 'Jakarta-Regular', fontSize: 15, color: '#A1A1AA', textAlign: 'center', marginTop: 20 },
});
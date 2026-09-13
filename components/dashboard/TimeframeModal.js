import React, { useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Modal, 
  FlatList,
  Animated,
  Dimensions,
  Pressable 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const TIMEFRAMES = [
  { id: 'THIS_MONTH', label: 'This Month' },
  { id: 'LAST_2_MONTHS', label: 'Last 2 Months' },
  { id: 'LAST_3_MONTHS', label: 'Last 3 Months' },
  { id: 'LAST_6_MONTHS', label: 'Last 6 Months' },
  { id: 'THIS_YEAR', label: 'This Year' },
  { id: 'ALL_TIME', label: 'All Time' },
];

const { height } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function TimeframeModal({ 
  visible, 
  onClose, 
  activeTimeframe, 
  onSelectTimeframe 
}) {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(height);
      fadeAnim.setValue(0);

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
          speed: 12
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.6, // Slightly darker overlay for dark mode
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  const animateOut = (callback) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0, 
        duration: 250,
        useNativeDriver: true,
      })
    ]).start(() => {
      if (callback) callback();
    });
  };

  const handleClose = () => animateOut(onClose);
  const handleSelect = (item) => animateOut(() => onSelectTimeframe(item));

  return (
    <Modal visible={visible} animationType="none" transparent={true} onRequestClose={handleClose}>
      <View style={styles.modalWrapper}>
        
        <AnimatedPressable
          style={[StyleSheet.absoluteFill, { backgroundColor: '#000000', opacity: fadeAnim }]}
          onPress={handleClose}
        />

        <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Timeframe</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList 
            data={TIMEFRAMES}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isActive = activeTimeframe.id === item.id;
              return (
                <TouchableOpacity 
                  style={[styles.timeframeRow, isActive && styles.timeframeRowActive]}
                  activeOpacity={0.7}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={[styles.timeframeLabel, isActive && styles.timeframeLabelActive]}>{item.label}</Text>
                  {/* Changed checkmark to White */}
                  {isActive && <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />}
                </TouchableOpacity>
              );
            }}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalWrapper: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: '#18181B', // DARK MODE: Elevated surface color
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28, 
    padding: 24, 
    paddingBottom: 40, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: -4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 10, 
    elevation: 10 
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: 'Jakarta-Bold', fontSize: 20, color: '#FFFFFF' }, // DARK MODE: White text
  closeButton: { fontFamily: 'Jakarta-Bold', fontSize: 18, color: '#A1A1AA', padding: 4 },
  timeframeRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#27272A' // DARK MODE: Subtle border
  },
  timeframeRowActive: { 
    backgroundColor: '#27272A', // DARK MODE: Highlight color
    borderRadius: 12, 
    paddingHorizontal: 12, 
    borderBottomWidth: 0, 
    marginVertical: 4 
  },
  timeframeLabel: { fontFamily: 'Jakarta-SemiBold', fontSize: 16, color: '#A1A1AA' }, // Muted text
  timeframeLabelActive: { color: '#FFFFFF', fontFamily: 'Jakarta-Bold' }, // Active text
});
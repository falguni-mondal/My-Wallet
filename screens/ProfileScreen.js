import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Modal,
  Image,
  Animated,
  Dimensions,
  Pressable,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// NEW: Import the modal and hook for Limits
import ManageLimitsModal from '../components/dashboard/ManageLimitsModal';
import { useTransactions } from '../hooks/useTransactions';

const { height } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PREBUILT_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/png?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Aneka&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Jasper&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Destiny&backgroundColor=ffdfbf',
];

export default function ProfileScreen() {
  // Mock Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [avatarUri, setAvatarUri] = useState(null);
  
  // Modals State
  const [isSelectorVisible, setIsSelectorVisible] = useState(false);
  const [isLimitsModalVisible, setIsLimitsModalVisible] = useState(false);

  // Fetch Limits Data
  const { accounts, limits, addLimit, deleteLimit } = useTransactions('ALL');

  // Animation Values
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSelectorVisible) {
      slideAnim.setValue(height);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4, speed: 12 }),
        Animated.timing(fadeAnim, { toValue: 0.6, duration: 200, useNativeDriver: true })
      ]).start();
    }
  }, [isSelectorVisible, slideAnim, fadeAnim]);

  const closeSelector = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true })
    ]).start(() => setIsSelectorVisible(false));
  };

  const selectPrebuiltAvatar = (uri) => {
    setAvatarUri(uri);
    closeSelector();
  };

  const uploadCustomAvatar = async () => {
    if (!isLoggedIn) {
      Alert.alert(
        "Sign In Required", 
        "You must be signed in to your account to upload custom photos.",
        [{ text: "OK", style: "cancel" }]
      );
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to allow access to your photos to upload an avatar.");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], 
      quality: 0.8,
    });

    if (!pickerResult.canceled) {
      setAvatarUri(pickerResult.assets[0].uri);
      closeSelector();
    }
  };

  return (
    <View style={styles.container}>
      
      {/* 1. TOP ROW: AVATAR, INFO, AND AUTH BUTTON */}
      <View style={styles.topRow}>
        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={() => setIsSelectorVisible(true)}
          style={styles.avatarCompact}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImageCompact} />
          ) : (
            <Ionicons name="person" size={32} color="#71717A" />
          )}
          <View style={styles.editBadgeCompact}>
            <Ionicons name="camera" size={10} color="#09090B" />
          </View>
        </TouchableOpacity>
        
        <View style={styles.userInfo}>
          <Text style={styles.nameText} numberOfLines={1}>
            {isLoggedIn ? 'Welcome Back!' : 'Guest User'}
          </Text>
          <Text style={styles.emailText} numberOfLines={1}>
            {isLoggedIn ? 'user@example.com' : 'Tap avatar to edit'}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.authBtnCompact, isLoggedIn ? styles.signOutBtn : styles.signInBtn]}
          activeOpacity={0.8}
          onPress={() => setIsLoggedIn(!isLoggedIn)} 
        >
          <Text style={[styles.authBtnText, isLoggedIn && styles.signOutBtnText]}>
            {isLoggedIn ? 'Sign Out' : 'Sign In'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* HORIZONTAL DIVIDER */}
      <View style={styles.mainDivider} />

      {/* 2. SETTINGS LIST */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <TouchableOpacity 
          style={styles.settingsRow} 
          activeOpacity={0.7}
          onPress={() => setIsLimitsModalVisible(true)}
        >
          <View style={styles.settingsIconWrapper}>
            <Ionicons name="speedometer-outline" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.settingsRowText}>Spending Limits</Text>
          <Ionicons name="chevron-forward" size={20} color="#71717A" />
        </TouchableOpacity>
        
        {/* You can easily duplicate the TouchableOpacity above to add more settings items later */}

      </View>

      {/* 3. AVATAR SELECTOR MODAL */}
      <Modal visible={isSelectorVisible} animationType="none" transparent={true} onRequestClose={closeSelector}>
        <View style={styles.modalWrapper}>
          <AnimatedPressable
            style={[StyleSheet.absoluteFill, { backgroundColor: '#000000', opacity: fadeAnim }]}
            onPress={closeSelector}
          />
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Avatar</Text>
              <TouchableOpacity onPress={closeSelector}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subHeading}>In-built Avatars</Text>
            <View style={styles.prebuiltGrid}>
              {PREBUILT_AVATARS.map((uri, index) => (
                <TouchableOpacity 
                  key={index}
                  activeOpacity={0.7}
                  onPress={() => selectPrebuiltAvatar(uri)}
                  style={[styles.prebuiltAvatarWrapper, avatarUri === uri && styles.selectedAvatarWrapper]}
                >
                  <Image source={{ uri }} style={styles.prebuiltAvatarImage} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalDivider} />

            <TouchableOpacity 
              style={[styles.uploadButton, !isLoggedIn && styles.uploadButtonDisabled]}
              activeOpacity={0.8}
              onPress={uploadCustomAvatar}
            >
              <Ionicons name="images-outline" size={20} color={isLoggedIn ? '#09090B' : '#71717A'} />
              <Text style={[styles.uploadButtonText, !isLoggedIn && styles.uploadButtonTextDisabled]}>
                Upload from system
              </Text>
              {!isLoggedIn && <Ionicons name="lock-closed" size={16} color="#71717A" style={{ marginLeft: 'auto' }} />}
            </TouchableOpacity>
            
            {!isLoggedIn && (
              <Text style={styles.loginWarning}>*Sign in to unlock custom uploads</Text>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* 4. MANAGE LIMITS MODAL */}
      <ManageLimitsModal 
        visible={isLimitsModalVisible}
        onClose={() => setIsLimitsModalVisible(false)}
        accounts={accounts}
        limits={limits}
        onAddLimit={addLimit}
        onDeleteLimit={deleteLimit}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
    paddingTop: 16,
  },
  
  // Top Row (Avatar + Info + Button)
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  avatarCompact: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarImageCompact: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  editBadgeCompact: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#09090B',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 10,
  },
  nameText: {
    fontFamily: 'Jakarta-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  emailText: {
    fontFamily: 'Jakarta-Regular',
    fontSize: 13,
    color: '#A1A1AA',
  },
  authBtnCompact: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInBtn: {
    backgroundColor: '#FFFFFF',
  },
  signOutBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  authBtnText: {
    fontFamily: 'Jakarta-Bold',
    fontSize: 13,
    color: '#09090B',
  },
  signOutBtnText: {
    color: '#FFFFFF',
  },

  mainDivider: {
    height: 1,
    backgroundColor: '#18181B',
    marginHorizontal: 24,
    marginVertical: 8,
  },

  // Settings List
  settingsSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  sectionTitle: {
    fontFamily: 'Jakarta-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: 12,
  },
  settingsIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingsRowText: {
    flex: 1,
    fontFamily: 'Jakarta-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },

  // Modal Styles
  modalWrapper: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: '#18181B', 
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28, 
    padding: 24, 
    paddingBottom: Platform.OS === 'ios' ? 40 : 24, 
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontFamily: 'Jakarta-Bold', fontSize: 20, color: '#FFFFFF' },
  closeButton: { fontFamily: 'Jakarta-Bold', fontSize: 18, color: '#A1A1AA', padding: 4 },
  
  subHeading: {
    fontFamily: 'Jakarta-SemiBold',
    fontSize: 14,
    color: '#A1A1AA',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  prebuiltGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  prebuiltAvatarWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  selectedAvatarWrapper: {
    borderColor: '#FFFFFF',
  },
  prebuiltAvatarImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#27272A',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#27272A',
    marginBottom: 24,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  uploadButtonDisabled: {
    backgroundColor: '#27272A',
  },
  uploadButtonText: {
    fontFamily: 'Jakarta-Bold',
    fontSize: 16,
    color: '#09090B',
    marginLeft: 12,
  },
  uploadButtonTextDisabled: {
    color: '#71717A',
  },
  loginWarning: {
    fontFamily: 'Jakarta-Regular',
    fontSize: 12,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 12,
  }
});
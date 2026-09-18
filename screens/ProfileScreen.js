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
  Platform,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import the modal and hook for Limits
import ManageLimitsModal from '../components/dashboard/ManageLimitsModal';
import { useTransactions } from '../hooks/useTransactions';

// Import our new API service wrapper
import { api } from '../services/api';

const { height } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PROFILE_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/png?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Aneka&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Jasper&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Destiny&backgroundColor=ffdfbf',
];

// FIX: Added the navigation prop here so we can route the user after login
export default function ProfileScreen({ navigation }) {
  // Authentication & User State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: '', username: '' });
  const [avatarUri, setAvatarUri] = useState(PROFILE_AVATARS[0]);
  
  // Auth Form State
  const [authMode, setAuthMode] = useState('LOGIN'); // 'LOGIN' or 'REGISTER'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Modals Visibility State
  const [isSelectorVisible, setIsSelectorVisible] = useState(false);
  const [isLimitsModalVisible, setIsLimitsModalVisible] = useState(false);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);

  // Fetch Limits Data
  const { accounts, limits, addLimit, deleteLimit } = useTransactions('ALL');

  // Animation Values for Avatar Modal
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animation Values for Auth Modal
  const authSlideAnim = useRef(new Animated.Value(height)).current;
  const authFadeAnim = useRef(new Animated.Value(0)).current;

  // Check for existing session on component mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const savedUser = await AsyncStorage.getItem('user');
      const savedAvatar = await AsyncStorage.getItem('avatarUri');
      
      if (token && savedUser) {
        setIsLoggedIn(true);
        setUser(JSON.parse(savedUser));
      }
      if (savedAvatar) {
        setAvatarUri(savedAvatar);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  // ==========================================
  // AVATAR SELECTOR ANIMATIONS & LOGIC
  // ==========================================
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

  const selectAvatar = async (uri) => {
    setAvatarUri(uri);
    await AsyncStorage.setItem('avatarUri', uri);
    closeSelector();
  };

  // ==========================================
  // AUTHENTICATION MODAL ANIMATIONS & LOGIC
  // ==========================================
  useEffect(() => {
    if (isAuthModalVisible) {
      authSlideAnim.setValue(height);
      authFadeAnim.setValue(0);
      Animated.parallel([
        Animated.spring(authSlideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4, speed: 12 }),
        Animated.timing(authFadeAnim, { toValue: 0.6, duration: 200, useNativeDriver: true })
      ]).start();
    }
  }, [isAuthModalVisible, authSlideAnim, authFadeAnim]);

  const closeAuthModal = () => {
    Animated.parallel([
      Animated.timing(authSlideAnim, { toValue: height, duration: 250, useNativeDriver: true }),
      Animated.timing(authFadeAnim, { toValue: 0, duration: 250, useNativeDriver: true })
    ]).start(() => {
      setIsAuthModalVisible(false);
      // Reset form fields
      setUsername('');
      setPassword('');
      setName('');
      setShowPassword(false);
    });
  };

  const handleAuthSubmit = async () => {
    if (!username || !password || (authMode === 'REGISTER' && !name)) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    setIsAuthLoading(true);
    try {
      let response;
      if (authMode === 'LOGIN') {
        response = await api.auth.login({ username: username.toLowerCase().trim(), password });
      } else {
        response = await api.auth.register({ name, username: username.toLowerCase().trim(), password });
      }

      if (response.success && response.data && response.data.accessToken) {
        const { accessToken, user: backendUser } = response.data;

        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('user', JSON.stringify(backendUser));
        
        setUser(backendUser);
        setIsLoggedIn(true);
        closeAuthModal();
        
        Alert.alert('Success', `Welcome, ${backendUser.name}!`);
        
        if (navigation) {
          navigation.navigate('MainTabs', { screen: 'Dashboard' });
        }
      }
    } catch (error) {
      Alert.alert('Authentication Failed', error.message || 'Unable to connect to the server.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out? Your offline data will remain on this device.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('user');
            setIsLoggedIn(false);
            setUser({ name: '', username: '' });
          }
        }
      ]
    );
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
          <Image source={{ uri: avatarUri }} style={styles.avatarImageCompact} />
          <View style={styles.editBadgeCompact}>
            <Ionicons name="color-palette" size={10} color="#09090B" />
          </View>
        </TouchableOpacity>
        
        <View style={styles.userInfo}>
          <Text style={styles.nameText} numberOfLines={1}>
            {isLoggedIn ? user.name : 'Guest User'}
          </Text>
          <Text style={styles.emailText} numberOfLines={1}>
            {isLoggedIn ? `@${user.username}` : 'Local Offline Mode'}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.authBtnCompact, isLoggedIn ? styles.signOutBtn : styles.signInBtn]}
          activeOpacity={0.8}
          onPress={() => isLoggedIn ? handleSignOut() : setIsAuthModalVisible(true)} 
        >
          <Text style={[styles.authBtnText, isLoggedIn && styles.signOutBtnText]}>
            {isLoggedIn ? 'Sign Out' : 'Sign In'}
          </Text>
        </TouchableOpacity>
      </View>

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

            <View style={styles.prebuiltGrid}>
              {PROFILE_AVATARS.map((uri, index) => (
                <TouchableOpacity 
                  key={index}
                  activeOpacity={0.7}
                  onPress={() => selectAvatar(uri)}
                  style={[styles.prebuiltAvatarWrapper, avatarUri === uri && styles.selectedAvatarWrapper]}
                >
                  <Image source={{ uri }} style={styles.prebuiltAvatarImage} />
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* 4. AUTHENTICATION MODAL */}
      <Modal visible={isAuthModalVisible} animationType="none" transparent={true} onRequestClose={closeAuthModal}>
        <View style={styles.modalWrapper}>
          <AnimatedPressable
            style={[StyleSheet.absoluteFill, { backgroundColor: '#000000', opacity: authFadeAnim }]}
            onPress={closeAuthModal}
          />
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: authSlideAnim }] }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {authMode === 'LOGIN' ? 'Welcome Back' : 'Create Account'}
                </Text>
                <TouchableOpacity onPress={closeAuthModal}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.authDescription}>
                Sign in to backup your transactions to the cloud and enable cross-device syncing.
              </Text>

              {authMode === 'REGISTER' && (
                <>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="John Doe" 
                    placeholderTextColor="#71717A" 
                    value={name} 
                    onChangeText={setName} 
                    autoCapitalize="words"
                  />
                </>
              )}

              <Text style={styles.inputLabel}>Username</Text>
              <TextInput 
                style={styles.input} 
                placeholder="johndoe123" 
                placeholderTextColor="#71717A" 
                value={username} 
                onChangeText={setUsername} 
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput 
                  style={styles.passwordInput} 
                  placeholder="••••••••" 
                  placeholderTextColor="#71717A" 
                  value={password} 
                  onChangeText={setPassword} 
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeIconContainer} 
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color="#A1A1AA" 
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.submitButton} 
                activeOpacity={0.8}
                onPress={handleAuthSubmit}
                disabled={isAuthLoading}
              >
                {isAuthLoading ? (
                  <ActivityIndicator color="#09090B" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {authMode === 'LOGIN' ? 'Sign In' : 'Create Account'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.switchModeButton} 
                onPress={() => setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
              >
                <Text style={styles.switchModeText}>
                  {authMode === 'LOGIN' 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"}
                </Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>

      {/* 5. MANAGE LIMITS MODAL */}
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
  
  prebuiltGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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

  // Auth Form Styles
  authDescription: {
    fontFamily: 'Jakarta-Regular',
    fontSize: 14,
    color: '#A1A1AA',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputLabel: { 
    fontFamily: 'Jakarta-SemiBold', 
    fontSize: 12, 
    color: '#A1A1AA', 
    marginBottom: 6, 
    textTransform: 'uppercase' 
  },
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
  
  // Password Input Container Styles
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#09090B',
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 12,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    fontFamily: 'Jakarta-Regular',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  eyeIconContainer: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  submitButton: { 
    backgroundColor: '#FFFFFF', 
    paddingVertical: 16, 
    borderRadius: 14, 
    alignItems: 'center', 
    marginTop: 8 
  },
  submitButtonText: { 
    fontFamily: 'Jakarta-Bold', 
    color: '#09090B', 
    fontSize: 16 
  },
  switchModeButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  switchModeText: {
    fontFamily: 'Jakarta-SemiBold',
    fontSize: 14,
    color: '#A1A1AA',
  }
});
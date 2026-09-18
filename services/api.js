import AsyncStorage from '@react-native-async-storage/async-storage';

// Pull the URL from the .env file. 
// Fallback to localhost to prevent crashes if the variable is missing.
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * Standardized fetch wrapper that automatically attaches the JWT token
 */
const fetchWithAuth = async (endpoint, options = {}) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
};

export const api = {
  // ==========================================
  // AUTHENTICATION
  // ==========================================
  auth: {
    login: (credentials) => 
      fetchWithAuth('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData) => 
      fetchWithAuth('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  },

  // ==========================================
  // ACCOUNTS
  // ==========================================
  accounts: {
    getAll: () => fetchWithAuth('/accounts', { method: 'GET' }),
    create: (accountData) => fetchWithAuth('/accounts', { method: 'POST', body: JSON.stringify(accountData) }),
  },

  // ==========================================
  // TRANSACTIONS
  // ==========================================
  transactions: {
    getAll: (accountId = 'ALL') => {
      const url = accountId === 'ALL' ? '/transactions' : `/transactions?accountId=${accountId}`;
      return fetchWithAuth(url, { method: 'GET' });
    },
    create: (txData) => fetchWithAuth('/transactions', { method: 'POST', body: JSON.stringify(txData) }),
    update: (id, txData) => fetchWithAuth(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(txData) }),
    delete: (id) => fetchWithAuth(`/transactions/${id}`, { method: 'DELETE' }),
    // The endpoint our background SMS listener uses
    syncSms: (smsData) => fetchWithAuth('/transactions/sync-sms', { method: 'POST', body: JSON.stringify(smsData) }),
  },
};
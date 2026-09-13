import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function AnalyticsScreen() {
  return (
    <View style={styles.container}>
      {/* Local header removed so it doesn't duplicate the global App.js header! */}
      
      <View style={styles.content}>
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderText}>Charts Coming Soon</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#09090B' // DARK MODE: Deep background
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 24, 
    justifyContent: 'center' 
  },
  placeholderCard: { 
    backgroundColor: '#18181B', // DARK MODE: Elevated surface 
    borderRadius: 20, 
    padding: 40, 
    alignItems: 'center', 
    borderStyle: 'dashed', 
    borderWidth: 2, 
    borderColor: '#27272A' // DARK MODE: Subtle border
  },
  placeholderText: { 
    fontFamily: 'Jakarta-SemiBold', 
    fontSize: 16, 
    color: '#A1A1AA' // Muted gray text
  },
});
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { determineUserType } from '../../utils/userTypeDetector';
import { getStorageItem } from '../../utils/storageUtils';
import apiService from '../../services/api';

/**
 * Composant de diagnostic pour les développeurs
 * Affiche l'état actuel de l'authentification et permet de tester les routes API
 */
export default function DiagnosticTool() {
  const [authState, setAuthState] = useState(null);
  const [userState, setUserState] = useState(null);
  const [tokenState, setTokenState] = useState(null);
  const [apiResults, setApiResults] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    auth: true,
    user: false,
    token: false,
    api: false
  });
  
  // Récupérer les états Redux
  const reduxAuthState = useSelector(state => state.auth);
  const reduxUserState = useSelector(state => state.user);
  const state = useSelector(state => state);
  
  // Détecter le type d'utilisateur
  const userType = determineUserType(reduxAuthState.user, state, 'DiagnosticTool');
  
  /**
   * Basculer l'expansion d'une section
   */
  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };
  
  /**
   * Rendre les valeurs en format lisible
   */
  const renderValue = (value) => {
    if (value === null || value === undefined) {
      return <Text style={styles.nullValue}>null</Text>;
    }
    
    if (typeof value === 'object') {
      return <Text style={styles.objectValue}>{JSON.stringify(value, null, 2)}</Text>;
    }
    
    if (typeof value === 'boolean') {
      return <Text style={value ? styles.trueValue : styles.falseValue}>{String(value)}</Text>;
    }
    
    return <Text style={styles.value}>{String(value)}</Text>;
  };
  
  /**
   * Rendre une section de résultats
   */
  const renderResultSection = (title, data, expanded) => {
    if (!data) return null;
    
    return (
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => toggleSection(title.toLowerCase())}
        >
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.expandButton}>{expanded ? '▼' : '►'}</Text>
        </TouchableOpacity>
        
        {expanded && (
          <View style={styles.sectionContent}>
            {Object.entries(data).map(([key, value]) => (
              <View key={key} style={styles.dataRow}>
                <Text style={styles.dataKey}>{key}:</Text>
                {renderValue(value)}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };
  
  /**
   * Exécuter le diagnostic complet
   */
  const handleRunDiagnostic = async () => {
    // Récupérer l'état d'authentification Redux
    setAuthState(reduxAuthState);
    
    // Récupérer l'état utilisateur Redux
    setUserState(reduxUserState);
    
    // Récupérer le token depuis AsyncStorage
    try {
      const token = await getStorageItem('token');
      setTokenState({
        exists: Boolean(token),
        value: token?.substring(0, 15) + '...' + token?.substring(token.length - 10) || null,
        isConfigured: Boolean(apiService.getAuthToken?.())
      });
    } catch (error) {
      setTokenState({
        error: error.message,
        exists: false
      });
    }
    
    // Tester les routes API
    const endpoints = [
      { name: 'profile', path: '/users/profile' },
      { name: 'notifications', path: '/notifications/unread-count' },
      { name: 'host_stats', path: '/hosts/me/stats' },
      { name: 'host_listings', path: '/hosts/me/active-listings' },
      { name: 'cleaner_stats', path: '/cleaners/me/stats' },
      { name: 'cleaner_listings', path: '/cleaners/available-listings' }
    ];
    
    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        const response = await apiService.get(endpoint.path);
        results[endpoint.name] = {
          status: 'success',
          statusCode: 200,
          data: response
        };
      } catch (error) {
        results[endpoint.name] = {
          status: 'error',
          statusCode: error.response?.status || 'unknown',
          message: error.message,
          data: error.response?.data
        };
      }
    }
    
    setApiResults(results);
    setExpandedSections({ ...expandedSections, api: true });
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Outil de Diagnostic</Text>
        <Text style={styles.headerSubtitle}>
          Type utilisateur détecté: {" "}
          <Text style={styles.typeHighlight}>{userType || 'Non détecté'}</Text>
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.runButton} 
        onPress={handleRunDiagnostic}
      >
        <Text style={styles.runButtonText}>Exécuter le diagnostic</Text>
      </TouchableOpacity>
      
      {renderResultSection('Auth', authState, expandedSections.auth)}
      {renderResultSection('User', userState, expandedSections.user)}
      {renderResultSection('Token', tokenState, expandedSections.token)}
      {renderResultSection('API', apiResults, expandedSections.api)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 15,
    backgroundColor: '#3498db',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    marginTop: 5,
  },
  typeHighlight: {
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#2980b9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  runButton: {
    backgroundColor: '#2ecc71',
    margin: 15,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  runButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 5,
    marginHorizontal: 15,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  expandButton: {
    fontWeight: 'bold',
    color: '#666',
  },
  sectionContent: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  dataRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dataKey: {
    fontWeight: 'bold',
    width: 120,
    color: '#333',
  },
  value: {
    flex: 1,
    color: '#333',
  },
  nullValue: {
    flex: 1,
    color: '#999',
    fontStyle: 'italic',
  },
  objectValue: {
    flex: 1,
    color: '#333',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  trueValue: {
    flex: 1,
    color: '#27ae60',
    fontWeight: 'bold',
  },
  falseValue: {
    flex: 1,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
});
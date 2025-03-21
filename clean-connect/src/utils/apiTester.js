/**
 * API Testing Utility
 * 
 * This utility provides functions to test API endpoints without requiring UI interaction.
 * It's useful for debugging API connectivity issues in development environments.
 * 
 * Usage:
 * - Import this file: import ApiTester from '../utils/apiTester';
 * - Run a test: ApiTester.testHostActiveListings();
 * - Check console output for results
 */

import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hostDebugApi, cleanerDebugApi, getApiBaseUrl } from './apiDebugUtils';

class ApiTester {
  constructor() {
    this.authenticated = false;
    this.authToken = null;
    this.results = {
      successes: 0,
      failures: 0,
      skipped: 0,
      details: []
    };
  }

  /**
   * Initialize the tester with authentication
   */
  async init() {
    try {
      console.log('🧪 API Tester: Initializing...');
      this.authToken = await AsyncStorage.getItem('token');
      this.authenticated = !!this.authToken;
      
      if (this.authenticated) {
        console.log('🔑 API Tester: Authenticated session available');
        api.setAuthToken(this.authToken);
      } else {
        console.log('⚠️ API Tester: No authentication token available - some tests will be skipped');
      }
      
      return this.authenticated;
    } catch (error) {
      console.error('❌ API Tester initialization failed:', error);
      return false;
    }
  }

  /**
   * Run a test against an API endpoint
   */
  async testEndpoint(name, apiCall, debugFallback = null, options = {}) {
    if (!this.authenticated && options.requiresAuth !== false) {
      console.log(`⏭️ Skipping test "${name}" - requires authentication`);
      this.results.skipped++;
      this.results.details.push({
        name,
        status: 'skipped',
        reason: 'Not authenticated'
      });
      return null;
    }
    
    console.log(`🧪 Testing "${name}"...`);
    
    try {
      const startTime = Date.now();
      const response = await apiCall();
      const endTime = Date.now();
      
      console.log(`✅ Test "${name}" succeeded in ${endTime - startTime}ms`);
      console.log(`📊 Response:`, response);
      
      this.results.successes++;
      this.results.details.push({
        name,
        status: 'success',
        duration: endTime - startTime,
        response
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Test "${name}" failed:`, error);
      
      this.results.failures++;
      this.results.details.push({
        name,
        status: 'failure',
        error: error.message || 'Unknown error'
      });
      
      // Try the debug fallback if provided
      if (debugFallback) {
        try {
          console.log(`🔍 Trying debug fallback for "${name}"...`);
          const response = await debugFallback();
          console.log(`✅ Debug fallback succeeded:`, response);
          return response;
        } catch (fallbackError) {
          console.error(`❌ Debug fallback also failed:`, fallbackError);
          return null;
        }
      }
      
      return null;
    }
  }

  /**
   * Test host dashboard active listings endpoint
   */
  async testHostActiveListings() {
    return this.testEndpoint(
      'Host Active Listings',
      () => api.getHostActiveListings(),
      () => hostDebugApi.getActiveListings()
    );
  }

  /**
   * Test cleaner dashboard available listings endpoint
   */
  async testCleanerAvailableListings() {
    return this.testEndpoint(
      'Cleaner Available Listings',
      () => api.getCleanerAvailableListings(),
      () => cleanerDebugApi.getAvailableListings()
    );
  }

  /**
   * Test host stats endpoint
   */
  async testHostStats() {
    return this.testEndpoint(
      'Host Stats',
      () => api.getHostStats()
    );
  }

  /**
   * Test cleaner stats endpoint
   */
  async testCleanerStats() {
    return this.testEndpoint(
      'Cleaner Stats',
      () => api.getCleanerStats()
    );
  }

  /**
   * Test API connectivity (no auth required)
   */
  async testApiConnectivity() {
    return this.testEndpoint(
      'API Connectivity',
      async () => {
        try {
          const response = await fetch(`${getApiBaseUrl()}/health`);
          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }
          return response.json();
        } catch (error) {
          throw new Error(`API connectivity test failed: ${error.message}`);
        }
      },
      null,
      { requiresAuth: false }
    );
  }

  /**
   * Test dashboard endpoints for both host and cleaner
   */
  async testDashboardEndpoints() {
    console.log('🧪 Testing Dashboard API Endpoints...');
    
    // Reset results
    this.results = {
      successes: 0,
      failures: 0,
      skipped: 0,
      details: []
    };
    
    // Initialize
    await this.init();
    
    // Test connectivity (no auth required)
    await this.testApiConnectivity();
    
    // Host endpoints
    await this.testHostActiveListings();
    await this.testHostStats();
    
    // Cleaner endpoints
    await this.testCleanerAvailableListings();
    await this.testCleanerStats();
    
    // Print summary
    console.log('📋 API Test Summary:');
    console.log(`✅ Successes: ${this.results.successes}`);
    console.log(`❌ Failures: ${this.results.failures}`);
    console.log(`⏭️ Skipped: ${this.results.skipped}`);
    
    return this.results;
  }
}

// Create singleton instance
const apiTester = new ApiTester();

// Expose the tester globally in development
if (__DEV__) {
  global.ApiTester = apiTester;
}

export default apiTester;
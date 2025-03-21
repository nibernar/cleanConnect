/**
 * Comprehensive utility for testing integration between frontend and backend
 * Provides functions to test all aspects of listing functionality
 */
import { store } from '../redux/store';
import { 
  fetchMyListings, 
  createListing, 
  updateListing, 
  deleteListing,
  fetchListingById,
  fetchApplications,
  clearListingsError
} from '../redux/slices/listingsSlice';
import { calculateListingPrice } from './priceCalculator';
import { logApiRequest, logApiResponse } from './debugUtils';
import { transformListingToBackend, transformListingToFrontend } from './dataAdapters';

// Sample listing data for tests
const SAMPLE_LISTING = {
  title: 'Test Integration Listing',
  accommodationType: 'Appartement',
  address: '123 Test Street, 75001 Paris',
  squareMeters: 75,
  personCount: 1,
  date: new Date(),
  startTime: '09:00',
  endTime: '11:00',
  services: ['regular_cleaning', 'kitchen_cleaning'],
  equipment: ['vacuum', 'mop'],
  notes: 'Created via integration test'
};

/**
 * Test the full lifecycle of a listing: create, fetch, update, delete
 * @returns {Promise<Object>} Test results with success/failure for each step
 */
export const testListingLifecycle = async () => {
  console.group('🧪 Testing Listing Lifecycle');
  const results = {
    create: { success: false, data: null, error: null },
    fetch: { success: false, data: null, error: null },
    update: { success: false, data: null, error: null },
    delete: { success: false, data: null, error: null },
    timestamp: new Date().toISOString()
  };
  
  try {
    // Clear any existing errors
    store.dispatch(clearListingsError());
    
    // 1. Create a listing
    console.log('Step 1: Creating test listing...');
    const listingData = {
      ...SAMPLE_LISTING,
      title: `Test Listing ${new Date().toISOString()}`, // Make it unique
      price: calculateListingPrice(SAMPLE_LISTING)
    };
    
    try {
      const createAction = await store.dispatch(createListing(listingData));
      if (createAction.type.endsWith('/fulfilled')) {
        const createdListing = createAction.payload;
        results.create = { 
          success: true, 
          data: { id: createdListing.id || createdListing._id, title: createdListing.title },
          error: null
        };
        console.log('✅ Listing created successfully:', results.create.data);
        
        // 2. Fetch the listing by ID
        console.log('Step 2: Fetching the created listing...');
        try {
          const listingId = createdListing.id || createdListing._id;
          const fetchAction = await store.dispatch(fetchListingById(listingId));
          
          if (fetchAction.type.endsWith('/fulfilled')) {
            results.fetch = { 
              success: true, 
              data: { 
                id: fetchAction.payload.id || fetchAction.payload._id, 
                title: fetchAction.payload.title 
              },
              error: null
            };
            console.log('✅ Listing fetched successfully:', results.fetch.data);
            
            // 3. Update the listing
            console.log('Step 3: Updating the listing...');
            try {
              const updateData = {
                id: listingId,
                listingData: {
                  ...fetchAction.payload,
                  title: `Updated: ${fetchAction.payload.title}`,
                  notes: 'Updated via integration test'
                }
              };
              
              const updateAction = await store.dispatch(updateListing(updateData));
              
              if (updateAction.type.endsWith('/fulfilled')) {
                results.update = { 
                  success: true, 
                  data: { 
                    id: updateAction.payload.id || updateAction.payload._id, 
                    title: updateAction.payload.title 
                  },
                  error: null
                };
                console.log('✅ Listing updated successfully:', results.update.data);
                
                // 4. Delete the listing
                console.log('Step 4: Deleting the listing...');
                try {
                  const deleteAction = await store.dispatch(deleteListing(listingId));
                  
                  if (deleteAction.type.endsWith('/fulfilled')) {
                    results.delete = { 
                      success: true, 
                      data: { id: listingId },
                      error: null
                    };
                    console.log('✅ Listing deleted successfully');
                  } else {
                    results.delete = { 
                      success: false, 
                      data: null, 
                      error: deleteAction.payload || 'Failed to delete listing'
                    };
                    console.error('❌ Error deleting listing:', results.delete.error);
                  }
                } catch (error) {
                  results.delete = { success: false, data: null, error: error.message };
                  console.error('❌ Exception during delete test:', error);
                }
              } else {
                results.update = { 
                  success: false, 
                  data: null, 
                  error: updateAction.payload || 'Failed to update listing'
                };
                console.error('❌ Error updating listing:', results.update.error);
              }
            } catch (error) {
              results.update = { success: false, data: null, error: error.message };
              console.error('❌ Exception during update test:', error);
            }
          } else {
            results.fetch = { 
              success: false, 
              data: null, 
              error: fetchAction.payload || 'Failed to fetch listing'
            };
            console.error('❌ Error fetching listing:', results.fetch.error);
          }
        } catch (error) {
          results.fetch = { success: false, data: null, error: error.message };
          console.error('❌ Exception during fetch test:', error);
        }
      } else {
        results.create = { 
          success: false, 
          data: null, 
          error: createAction.payload || 'Failed to create listing'
        };
        console.error('❌ Error creating listing:', results.create.error);
      }
    } catch (error) {
      results.create = { success: false, data: null, error: error.message };
      console.error('❌ Exception during create test:', error);
    }
  } catch (error) {
    console.error('❌ Fatal error during listing lifecycle test:', error);
  }
  
  console.log('📋 Listing Lifecycle Test Results:', results);
  console.groupEnd();
  
  return results;
};

/**
 * Test data transformation between frontend and backend formats
 * @returns {Object} Test results for transformation
 */
export const testDataTransformation = () => {
  console.group('🧪 Testing Data Transformation');
  const results = {
    frontendToBackend: { success: false, data: null, error: null },
    backendToFrontend: { success: false, data: null, error: null },
    roundTrip: { success: false, data: null, error: null }
  };
  
  try {
    // Test frontend to backend transformation
    const frontendData = SAMPLE_LISTING;
    console.log('🔄 Testing frontend to backend transformation...');
    
    try {
      const backendData = transformListingToBackend(frontendData);
      results.frontendToBackend = { 
        success: true, 
        data: { 
          fromType: typeof frontendData.accommodationType,
          toType: typeof backendData.accommodationType,
          hasServices: Array.isArray(backendData.services),
          servicesCount: backendData.services.length
        },
        error: null
      };
      console.log('✅ Frontend to backend transformation successful:', results.frontendToBackend.data);
      
      // Test backend to frontend transformation
      console.log('🔄 Testing backend to frontend transformation...');
      try {
        const transformedToFrontend = transformListingToFrontend(backendData);
        results.backendToFrontend = { 
          success: true, 
          data: { 
            fromType: typeof backendData.accommodationType,
            toType: typeof transformedToFrontend.accommodationType,
            hasServices: Array.isArray(transformedToFrontend.services),
            servicesCount: transformedToFrontend.services.length
          },
          error: null
        };
        console.log('✅ Backend to frontend transformation successful:', results.backendToFrontend.data);
        
        // Test round-trip transformation
        console.log('🔄 Testing round-trip transformation...');
        try {
          const roundTripData = transformListingToBackend(transformedToFrontend);
          
          // Check if key fields maintained integrity
          const fieldsMatch = 
            roundTripData.title === backendData.title &&
            roundTripData.services.length === backendData.services.length;
          
          results.roundTrip = { 
            success: fieldsMatch, 
            data: { 
              titleMaintained: roundTripData.title === backendData.title,
              servicesCountMaintained: roundTripData.services.length === backendData.services.length
            },
            error: fieldsMatch ? null : 'Data integrity not maintained through round-trip transformation'
          };
          
          if (fieldsMatch) {
            console.log('✅ Round-trip transformation successful:', results.roundTrip.data);
          } else {
            console.warn('⚠️ Round-trip transformation has some differences:', results.roundTrip.data);
          }
        } catch (error) {
          results.roundTrip = { success: false, data: null, error: error.message };
          console.error('❌ Exception during round-trip test:', error);
        }
      } catch (error) {
        results.backendToFrontend = { success: false, data: null, error: error.message };
        console.error('❌ Exception during backend to frontend test:', error);
      }
    } catch (error) {
      results.frontendToBackend = { success: false, data: null, error: error.message };
      console.error('❌ Exception during frontend to backend test:', error);
    }
  } catch (error) {
    console.error('❌ Fatal error during data transformation test:', error);
  }
  
  console.log('📋 Data Transformation Test Results:', results);
  console.groupEnd();
  
  return results;
};

/**
 * Test the price calculation functionality
 * @returns {Object} Test results for price calculation
 */
export const testPriceCalculation = () => {
  console.group('🧪 Testing Price Calculation');
  const results = {
    basicCalculation: { success: false, data: null, error: null },
    premiumServices: { success: false, data: null, error: null },
    largeArea: { success: false, data: null, error: null }
  };
  
  try {
    // Test basic calculation
    console.log('💰 Testing basic price calculation...');
    const basicData = {
      squareMeters: 50,
      startTime: '09:00',
      endTime: '11:00',
      services: ['regular_cleaning']
    };
    
    try {
      const basicPrice = calculateListingPrice(basicData);
      results.basicCalculation = { 
        success: basicPrice.baseAmount > 0 && basicPrice.commission > 0 && basicPrice.totalAmount > 0, 
        data: basicPrice,
        error: null
      };
      console.log('✅ Basic price calculation successful:', results.basicCalculation.data);
      
      // Test premium services
      console.log('💰 Testing premium services price calculation...');
      const premiumData = {
        ...basicData,
        services: ['regular_cleaning', 'window_cleaning', 'kitchen_cleaning']
      };
      
      try {
        const premiumPrice = calculateListingPrice(premiumData);
        const premiumIsHigher = premiumPrice.totalAmount > basicPrice.totalAmount;
        
        results.premiumServices = { 
          success: premiumIsHigher, 
          data: {
            basicPrice: basicPrice.totalAmount,
            premiumPrice: premiumPrice.totalAmount,
            difference: premiumPrice.totalAmount - basicPrice.totalAmount
          },
          error: null
        };
        
        if (premiumIsHigher) {
          console.log('✅ Premium services price calculation successful:', results.premiumServices.data);
        } else {
          console.warn('⚠️ Premium services do not increase price as expected:', results.premiumServices.data);
        }
        
        // Test large area
        console.log('💰 Testing large area price calculation...');
        const largeAreaData = {
          ...basicData,
          squareMeters: 150
        };
        
        try {
          const largeAreaPrice = calculateListingPrice(largeAreaData);
          const largeAreaIsHigher = largeAreaPrice.totalAmount > basicPrice.totalAmount;
          
          results.largeArea = { 
            success: largeAreaIsHigher, 
            data: {
              basicPrice: basicPrice.totalAmount,
              largeAreaPrice: largeAreaPrice.totalAmount,
              difference: largeAreaPrice.totalAmount - basicPrice.totalAmount
            },
            error: null
          };
          
          if (largeAreaIsHigher) {
            console.log('✅ Large area price calculation successful:', results.largeArea.data);
          } else {
            console.warn('⚠️ Large area does not increase price as expected:', results.largeArea.data);
          }
        } catch (error) {
          results.largeArea = { success: false, data: null, error: error.message };
          console.error('❌ Exception during large area test:', error);
        }
      } catch (error) {
        results.premiumServices = { success: false, data: null, error: error.message };
        console.error('❌ Exception during premium services test:', error);
      }
    } catch (error) {
      results.basicCalculation = { success: false, data: null, error: error.message };
      console.error('❌ Exception during basic calculation test:', error);
    }
  } catch (error) {
    console.error('❌ Fatal error during price calculation test:', error);
  }
  
  console.log('📋 Price Calculation Test Results:', results);
  console.groupEnd();
  
  return results;
};

/**
 * Run all integration tests for listings
 * @returns {Object} Combined test results
 */
export const runAllTests = async () => {
  console.group('🔍 Running All Listing Integration Tests');
  
  const results = {
    dataTransformation: testDataTransformation(),
    priceCalculation: testPriceCalculation(),
    lifecycle: await testListingLifecycle(),
    timestamp: new Date().toISOString()
  };
  
  // Calculate overall success
  const allSuccessful = 
    results.dataTransformation.frontendToBackend.success &&
    results.dataTransformation.backendToFrontend.success &&
    results.priceCalculation.basicCalculation.success &&
    results.lifecycle.create.success &&
    results.lifecycle.fetch.success;
  
  if (allSuccessful) {
    console.log('🎉 All essential integration tests passed successfully!');
  } else {
    console.error('❌ Some integration tests failed. Check the detailed results.');
  }
  
  console.log('📊 Overall Integration Test Results:', {
    allPassed: allSuccessful,
    passedTests: [
      { name: 'Frontend to Backend Transformation', passed: results.dataTransformation.frontendToBackend.success },
      { name: 'Backend to Frontend Transformation', passed: results.dataTransformation.backendToFrontend.success },
      { name: 'Round-Trip Transformation', passed: results.dataTransformation.roundTrip.success },
      { name: 'Basic Price Calculation', passed: results.priceCalculation.basicCalculation.success },
      { name: 'Premium Services Price', passed: results.priceCalculation.premiumServices.success },
      { name: 'Large Area Price', passed: results.priceCalculation.largeArea.success },
      { name: 'Create Listing', passed: results.lifecycle.create.success },
      { name: 'Fetch Listing', passed: results.lifecycle.fetch.success },
      { name: 'Update Listing', passed: results.lifecycle.update.success },
      { name: 'Delete Listing', passed: results.lifecycle.delete.success }
    ]
  });
  
  console.groupEnd();
  return results;
};

export default {
  testListingLifecycle,
  testDataTransformation,
  testPriceCalculation,
  runAllTests,
  SAMPLE_LISTING
};
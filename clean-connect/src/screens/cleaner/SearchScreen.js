import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Animated, PanResponder, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
    fetchListingsForCleaner, 
    applyToListing, 
    rejectListing, 
    selectAllListings,
    selectListingsLoading 
} from '../../redux/slices/listingsSlice';
import ListingSwipeCard from '../../components/cleaner/ListingSwipeCard';
import { colors, spacing, typography } from '../../../src/utils/theme'; 
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';

const SearchScreen = () => {
  const dispatch = useDispatch();
  const availableListings = useSelector(selectAllListings) || []; 
  const loading = useSelector(selectListingsLoading);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipedAll, setSwipedAll] = useState(false);

  console.log('[SearchScreen] Render - isLoading:', loading, 'listings count:', availableListings.length, 'currentIndex:', currentIndex, 'swipedAll:', swipedAll);

  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({ inputRange: [-200, 0, 200], outputRange: ['-30deg', '0deg', '30deg'], extrapolate: 'clamp' });
  const likeOpacity = position.x.interpolate({ inputRange: [25, 100], outputRange: [0, 1], extrapolate: 'clamp' });
  const dislikeOpacity = position.x.interpolate({ inputRange: [-100, -25], outputRange: [1, 0], extrapolate: 'clamp' });
  const nextCardScale = position.x.interpolate({ inputRange: [-200, 0, 200], outputRange: [1, 0.8, 1], extrapolate: 'clamp' });

  const resetPosition = () => {
      position.setValue({ x: 0, y: 0 });
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !swipedAll && availableListings.length > 0 && currentIndex < availableListings.length,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 120) {
          Animated.spring(position, { toValue: { x: 500, y: gesture.dy }, useNativeDriver: false }).start(() => handleSwipe('right'));
        } else if (gesture.dx < -120) {
          Animated.spring(position, { toValue: { x: -500, y: gesture.dy }, useNativeDriver: false }).start(() => handleSwipe('left'));
        } else {
          Animated.spring(position, { toValue: { x: 0, y: 0 }, friction: 4, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const handleSwipe = useCallback((direction) => {
    if (currentIndex >= availableListings.length) return;
    const currentListing = availableListings[currentIndex];
    const listingId = currentListing?.id;
    console.log(`[SearchScreen] Swiped ${direction} on Listing ID: ${listingId}`);
    
    if (direction === 'right' && listingId) {
      console.log(`[SearchScreen] Dispatching applyToListing for ID: ${listingId}`);
      dispatch(applyToListing(listingId));
    } else if (direction === 'left' && listingId) {
       if(typeof rejectListing === 'function') {
           console.log(`[SearchScreen] Dispatching rejectListing for ID: ${listingId}`);
           dispatch(rejectListing(listingId));
       } else {
           console.warn('[SearchScreen] rejectListing action is not available.');
       }
    }

     Animated.timing(position, { toValue: { x: 0, y: 0 }, duration: 100, useNativeDriver: false }).start(() => {
        if (currentIndex >= availableListings.length - 1) {
            console.log('[SearchScreen] Swiped all cards.');
            setSwipedAll(true);
        } else {
            setCurrentIndex((prevIndex) => prevIndex + 1);
        }
     });

  }, [currentIndex, availableListings, dispatch, position]);

  const reloadListings = useCallback(() => {
      console.log("[SearchScreen] Reloading listings...");
      setCurrentIndex(0);
      setSwipedAll(false);
      dispatch(fetchListingsForCleaner());
  }, [dispatch]);

  useEffect(() => {
    reloadListings(); 
  }, [reloadListings]); 

  if (loading && availableListings.length === 0 && !swipedAll) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Recherche des missions...</Text>
      </SafeAreaView>
    );
  }

  if (swipedAll || (!loading && availableListings.length === 0)) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Ionicons name="sad-outline" size={80} color={colors.textTertiary} />
        <Text style={styles.emptyText}>Aucune nouvelle annonce</Text>
        <Text style={styles.emptySubText}>Revenez plus tard ou ajustez vos préférences.</Text>
        <Button title="Recharger" onPress={reloadListings} style={{ marginTop: spacing.lg }} />
      </SafeAreaView>
    );
  }

  const renderCards = () => {
      return availableListings
          .map((listing, index) => {
              if (index < currentIndex) return null; 
              if (index > currentIndex + 1) return null; 

              const isCurrentCard = index === currentIndex;
              const panHandlers = isCurrentCard ? panResponder.panHandlers : {};
              const cardStyle = isCurrentCard
                  ? { transform: [...position.getTranslateTransform(), { rotate }] }
                  : { transform: [{ scale: nextCardScale }], opacity: 0.8 }; 

              return (
                  <Animated.View
                      key={listing.id || `listing-${index}`}
                      style={[styles.card, cardStyle]}
                      {...panHandlers}
                  >
                      <ListingSwipeCard listing={listing} />
                      {isCurrentCard && (
                          <>
                              <Animated.View style={[styles.overlayLabel, styles.likeContainer, { opacity: likeOpacity }]}><Text style={styles.likeText}>POSTULER</Text></Animated.View>
                              <Animated.View style={[styles.overlayLabel, styles.dislikeContainer, { opacity: dislikeOpacity }]}><Text style={styles.dislikeText}>PASSER</Text></Animated.View>
                          </>
                      )}
                  </Animated.View>
              );
          }).reverse(); 
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cardsContainer}>
          {renderCards()}
      </View>
       <View style={styles.actionsContainer}>
         <TouchableOpacity style={styles.actionButton} onPress={() => handleSwipe('left')} disabled={currentIndex >= availableListings.length || !availableListings[currentIndex]?.id}>
           <Ionicons name="close-circle" size={64} color={colors.error || 'red'} />
         </TouchableOpacity>
         <TouchableOpacity style={styles.actionButton} onPress={() => handleSwipe('right')} disabled={currentIndex >= availableListings.length || !availableListings[currentIndex]?.id}>
           <Ionicons name="checkmark-circle" size={64} color={colors.success || 'green'} />
         </TouchableOpacity>
       </View>
    </SafeAreaView>
  );
};

// Styles restaurés
let styles = {};
try {
    styles = StyleSheet.create({
      container: { flex: 1, backgroundColor: colors.background || '#f8f9fa' },
      centered: { flex: 1, justifyContent:'center', alignItems:'center' },
      loadingText: { marginTop: spacing.md || 15, color: colors.textSecondary || 'grey' },
      header: { padding: spacing.md || 15, borderBottomWidth: 1, borderBottomColor: colors.border || '#eee' },
      title: { ...typography.h1 },
      subtitle: { ...typography.body, color: colors.textSecondary },
      cardsContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.sm || 8 },
      card: { position: 'absolute' }, // La taille est déterminée par ListingSwipeCard
      overlayLabel: { position: 'absolute', top: 50, borderWidth: 4, borderRadius: 8, padding: spacing.sm || 8, backgroundColor: 'rgba(255,255,255,0.8)' },
      likeContainer: { right: 40, transform: [{ rotate: '30deg' }], borderColor: colors.success || 'green' },
      dislikeContainer: { left: 40, transform: [{ rotate: '-30deg' }], borderColor: colors.error || 'red' },
      likeText: { ...(typography.h3 || {fontSize: 18}), color: colors.success || 'green', fontWeight: 'bold' }, // Fallback typo
      dislikeText: { ...(typography.h3 || {fontSize: 18}), color: colors.error || 'red', fontWeight: 'bold' }, // Fallback typo
      actionsContainer: { flexDirection: 'row', justifyContent: 'space-evenly', padding: spacing.md || 15, paddingBottom: spacing.lg || 24 }, // Ajouter paddingBottom
      actionButton: { backgroundColor: 'transparent' }, 
      emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl || 30 },
      emptyText: { ...(typography.h2 || {fontSize: 20}), marginTop: spacing.lg || 24, marginBottom: spacing.md || 16, textAlign: 'center' }, // Fallback typo
      emptySubText: { ...(typography.body || {fontSize: 16}), textAlign: 'center', color: colors.textSecondary || 'grey' }, // Fallback typo
    });
} catch(e) {
    console.error("Style error SearchScreen:", e);
    // Fallback Styles restaurés
    styles = StyleSheet.create({ 
        container:{flex:1}, 
        centered:{flex:1, alignItems:'center', justifyContent:'center'}, 
        loadingText:{marginTop: 15, color:'grey'}, 
        header:{padding: 15}, 
        title:{fontSize: 24, fontWeight:'bold'}, 
        subtitle:{fontSize: 16, color:'grey'}, 
        cardsContainer:{flex:1, alignItems:'center', justifyContent:'center', padding: 8}, 
        card:{position:'absolute'}, 
        overlayLabel:{position:'absolute', top:50, borderWidth:4, borderRadius:8, padding:8}, 
        likeContainer:{right:40, transform: [{ rotate: '30deg' }], borderColor: 'green'}, 
        dislikeContainer:{left:40, transform: [{ rotate: '-30deg' }], borderColor: 'red'}, 
        likeText:{fontSize: 18, color: 'green', fontWeight: 'bold'}, 
        dislikeText:{fontSize: 18, color: 'red', fontWeight: 'bold'}, 
        actionsContainer:{flexDirection:'row', justifyContent:'space-evenly', padding: 15, paddingBottom: 24}, 
        actionButton:{backgroundColor: 'transparent'}, 
        emptyContainer:{flex:1, justifyContent:'center', alignItems:'center', padding: 30}, 
        emptyText:{fontSize:20, marginTop:24, marginBottom:16, textAlign:'center'}, 
        emptySubText:{fontSize:16, textAlign:'center', color:'grey'} 
    });
}

export default SearchScreen;

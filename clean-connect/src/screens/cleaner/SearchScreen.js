import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated, PanResponder, Text, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchListingsForCleaner, applyToListing, rejectListing } from '../../redux/slices/listingsSlice';
import ListingSwipeCard from '../../components/cleaner/ListingSwipeCard';
import { colors, spacing, typography } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';

/**
 * Screen for cleaners to browse and swipe through available listings
 */
const SearchScreen = () => {
  const dispatch = useDispatch();
  const { availableListings, loading } = useSelector(state => state.listings);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipedAll, setSwipedAll] = useState(false);

  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ['-30deg', '0deg', '30deg'],
    extrapolate: 'clamp',
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [25, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const dislikeOpacity = position.x.interpolate({
    inputRange: [-100, -25],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const nextCardScale = position.x.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: [1, 0.8, 1],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 120) {
          // Swiped right (apply)
          Animated.spring(position, {
            toValue: { x: 500, y: gesture.dy },
            useNativeDriver: true,
          }).start(() => {
            handleSwipe('right');
          });
        } else if (gesture.dx < -120) {
          // Swiped left (reject)
          Animated.spring(position, {
            toValue: { x: -500, y: gesture.dy },
            useNativeDriver: true,
          }).start(() => {
            handleSwipe('left');
          });
        } else {
          // Return to original position
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 4,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleSwipe = direction => {
    const currentListing = availableListings[currentIndex];
    
    if (direction === 'right' && currentListing) {
      dispatch(applyToListing(currentListing.id));
    } else if (direction === 'left' && currentListing) {
      dispatch(rejectListing(currentListing.id));
    }

    position.setValue({ x: 0, y: 0 });
    
    if (currentIndex === availableListings.length - 1) {
      setSwipedAll(true);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  useEffect(() => {
    dispatch(fetchListingsForCleaner());
  }, [dispatch]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!availableListings || availableListings.length === 0 || swipedAll) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={80} color={colors.textTertiary} />
          <Text style={styles.emptyText}>Aucune annonce disponible</Text>
          <Text style={styles.emptySubText}>
            Nous n'avons pas trouvé d'annonces correspondant à vos préférences pour le moment
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recherche</Text>
        <Text style={styles.subtitle}>
          Faites glisser les annonces pour postuler ou passer
        </Text>
      </View>

      <View style={styles.cardsContainer}>
        {availableListings
          .slice(currentIndex, currentIndex + 2)
          .reverse()
          .map((listing, index) => {
            const isCurrentCard = index === availableListings.slice(currentIndex, currentIndex + 2).length - 1;
            const panHandlers = isCurrentCard ? panResponder.panHandlers : {};
            
            const cardStyle = isCurrentCard
              ? {
                  transform: [
                    { translateX: position.x },
                    { translateY: position.y },
                    { rotate },
                  ],
                }
              : { transform: [{ scale: nextCardScale }] };

            return (
              <Animated.View
                key={listing.id}
                style={[styles.card, cardStyle]}
                {...panHandlers}
              >
                <ListingSwipeCard listing={listing} />
                {isCurrentCard && (
                  <>
                    <Animated.View
                      style={[
                        styles.likeContainer,
                        { opacity: likeOpacity },
                      ]}
                    >
                      <Text style={styles.likeText}>POSTULER</Text>
                    </Animated.View>
                    <Animated.View
                      style={[
                        styles.dislikeContainer,
                        { opacity: dislikeOpacity },
                      ]}
                    >
                      <Text style={styles.dislikeText}>PASSER</Text>
                    </Animated.View>
                  </>
                )}
              </Animated.View>
            );
          })}
      </View>

      <View style={styles.actionsContainer}>
        <View style={styles.actionButton}>
          <Ionicons
            name="close-circle"
            size={64}
            color={colors.error}
            onPress={() => handleSwipe('left')}
          />
        </View>
        <View style={styles.actionButton}>
          <Ionicons
            name="checkmark-circle"
            size={64}
            color={colors.success}
            onPress={() => handleSwipe('right')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  cardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  card: {
    position: 'absolute',
    width: '100%',
  },
  likeContainer: {
    position: 'absolute',
    top: 50,
    right: 40,
    transform: [{ rotate: '30deg' }],
    borderWidth: 4,
    borderRadius: 8,
    padding: spacing.sm,
    borderColor: colors.success,
  },
  dislikeContainer: {
    position: 'absolute',
    top: 50,
    left: 40,
    transform: [{ rotate: '-30deg' }],
    borderWidth: 4,
    borderRadius: 8,
    padding: spacing.sm,
    borderColor: colors.error,
  },
  likeText: {
    ...typography.h3,
    color: colors.success,
    fontWeight: 'bold',
  },
  dislikeText: {
    ...typography.h3,
    color: colors.error,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    padding: spacing.md,
  },
  actionButton: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 50,
    padding: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.h2,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptySubText: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});

export default SearchScreen;
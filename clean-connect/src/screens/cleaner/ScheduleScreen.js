import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { fetchCleanerBookings } from '../../redux/slices/bookingsSlice';
import { colors, spacing, typography, shadows } from '../../utils/theme';
import { router } from 'expo-router'; // Importer router

/**
 * Screen for displaying cleaner's schedule and bookings
 */
const ScheduleScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { bookings, loading } = useSelector(state => state.bookings);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState({});
  
  // Refresh bookings when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchCleanerBookings());
    }, [dispatch])
  );

  // Process bookings to mark calendar dates and filter for selected date
  useEffect(() => {
    if (bookings && bookings.length > 0) {
      // Create marked dates object for calendar
      const marks = {};
      bookings.forEach(booking => {
        const bookingDate = new Date(booking.date).toISOString().split('T')[0];
        
        if (marks[bookingDate]) {
          // If we already have bookings for this date, increase the dots
          marks[bookingDate].dots.push({
            key: booking.id,
            color: getStatusColor(booking.status),
          });
        } else {
          // First booking for this date
          marks[bookingDate] = {
            dots: [
              {
                key: booking.id,
                color: getStatusColor(booking.status),
              }
            ],
            marked: true
          };
        }
      });
      
      // Add selected date styling
      marks[selectedDate] = {
        ...marks[selectedDate],
        selected: true,
        selectedColor: colors.primary,
      };
      
      setMarkedDates(marks);
    }
  }, [bookings, selectedDate]);

  // Helper to get color based on booking status
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'completed':
        return colors.info;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textTertiary;
    }
  };

  // Get localized month name
  const getMonthName = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  // Filter bookings for selected date
  const filteredBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.date).toISOString().split('T')[0];
    return bookingDate === selectedDate;
  });

  const handleBookingPress = (booking) => {
    router.push('BookingDetail', { bookingId: booking.id });
  };

  const renderBookingItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleBookingPress(item)}>
      <></>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Planning</Text>
        <Text style={styles.subtitle}>
          Consultez vos missions à venir
        </Text>
      </View>
      
      <View style={[styles.calendarContainer, shadows.medium]}>
        <Calendar
          current={selectedDate}
          onDayPress={day => setSelectedDate(day.dateString)}
          monthFormat={'yyyy MM'}
          markingType={'multi-dot'}
          markedDates={markedDates}
          theme={{
            calendarBackground: colors.background,
            textSectionTitleColor: colors.primary,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: colors.background,
            todayTextColor: colors.primary,
            dayTextColor: colors.text,
            textDisabledColor: colors.textTertiary,
            dotColor: colors.primary,
            selectedDotColor: colors.background,
            arrowColor: colors.primary,
            monthTextColor: colors.text,
            indicatorColor: colors.primary,
          }}
        />
      </View>
      
      <View style={styles.bookingsContainer}>
        <View style={styles.dateHeader}>
          <Ionicons name="calendar" size={22} color={colors.primary} />
          <Text style={styles.dateText}>
            {new Date(selectedDate).toLocaleDateString('fr-FR', { 
              weekday: 'long',
              day: 'numeric', 
              month: 'long' 
            })}
          </Text>
        </View>
        
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : filteredBookings.length > 0 ? (
          <FlatList
            data={filteredBookings}
            renderItem={renderBookingItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={60} color={colors.textTertiary} />
            <Text style={styles.emptyText}>Aucune mission prévue</Text>
            <Text style={styles.emptySubText}>
              Vous n'avez pas de mission programmée pour cette journée
            </Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.fabButton}
        onPress={() => router.push('Search')}
      >
        <Ionicons name="add" size={24} color={colors.background} />
        <Text style={styles.fabText}>Trouver des missions</Text>
      </TouchableOpacity>
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
  calendarContainer: {
    margin: spacing.md,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  bookingsContainer: {
    flex: 1,
    padding: spacing.md,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dateText: {
    ...typography.h3,
    marginLeft: spacing.sm,
    color: colors.text,
    textTransform: 'capitalize',
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    ...typography.h2,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubText: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  loader: {
    marginTop: spacing.xl,
  },
  fabButton: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 30,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.medium,
  },
  fabText: {
    ...typography.button,
    color: colors.background,
    marginLeft: spacing.xs,
  },
});

export default ScheduleScreen;
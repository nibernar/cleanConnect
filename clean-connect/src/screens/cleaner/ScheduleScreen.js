import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native'; // Ou useFocusEffect from expo-router si utilisé
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { fetchMyBookings, selectAllBookings, selectBookingsLoading } from '../../redux/slices/bookingsSlice'; 
// Correction: Chemin vers le thème corrigé
import { colors, spacing, typography, shadows } from '../../../src/utils/theme'; 
import { router } from 'expo-router';
// Correction: Importer Card depuis common
import Card from '../../components/common/Card';

/**
 * Screen for displaying cleaner's schedule and bookings
 */
const ScheduleScreen = () => { 
  const dispatch = useDispatch();
  const bookings = useSelector(selectAllBookings) || [];
  const isLoading = useSelector(selectBookingsLoading);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState({});
  
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchMyBookings());
    }, [dispatch])
  );

  useEffect(() => {
    if (Array.isArray(bookings) && bookings.length > 0) {
      const marks = {};
      bookings.forEach(booking => {
        if (booking.dateScheduled?.date) { 
            const bookingDateStr = new Date(booking.dateScheduled.date).toISOString().split('T')[0];
            const dot = {
                key: booking._id || Math.random().toString(),
                color: getStatusColor(booking.status),
            };
            if (marks[bookingDateStr]) {
              marks[bookingDateStr].dots.push(dot);
            } else {
              marks[bookingDateStr] = { dots: [dot], marked: true };
            }
        } else {
            console.warn('Booking sans date valide:', booking);
        }
      });
      marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: colors.primary, selectedTextColor: colors.background };
      setMarkedDates(marks);
    } else {
        setMarkedDates({ [selectedDate]: { selected: true, selectedColor: colors.primary, selectedTextColor: colors.background } });
    }
  }, [bookings, selectedDate]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return colors.success || 'green';
      case 'pending': return colors.warning || 'orange';
      case 'completed': return colors.info || 'blue';
      case 'cancelled':
      case 'rejected': return colors.error || 'red';
      default: return colors.textTertiary || 'grey';
    }
  };

  const filteredBookings = Array.isArray(bookings) ? bookings.filter(booking => {
    if (!booking.dateScheduled?.date) return false;
    const bookingDateStr = new Date(booking.dateScheduled.date).toISOString().split('T')[0];
    return bookingDateStr === selectedDate;
  }) : [];

  const handleBookingPress = (booking) => {
    if (booking?._id) {
      router.push(`/(cleaner)/bookings/${booking._id}`); 
    } else {
        console.warn("Tentative de navigation sans ID de réservation valide", booking);
    }
  };

  // Correction: Utiliser le rendu simple avec Card
  const renderBookingItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleBookingPress(item)}>
        <Card style={styles.bookingCard}> 
          <View style={styles.bookingCardContent}>
              <Text style={styles.bookingTitle}>{item.listing?.title || 'Titre Indisponible'}</Text>
              <Text style={styles.bookingStatusText(item.status)}>Statut: {item.status || 'Inconnu'}</Text>
              {/* Ajouter d'autres infos si nécessaire, ex: Heure */}
              {item.dateScheduled?.startTime && <Text style={styles.bookingTime}>Heure: {item.dateScheduled.startTime} {item.dateScheduled.endTime ? `- ${item.dateScheduled.endTime}`: ''}</Text>}
          </View>
        </Card>
    </TouchableOpacity>
  );

  // Styles définis dans un bloc try...catch pour la robustesse
  let styles = {};
  try {
    styles = StyleSheet.create({
      container: { flex: 1, backgroundColor: colors.background || '#f8f9fa' },
      header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm },
      title: { ...typography.h1, marginBottom: 0 },
      calendarContainer: { marginHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: 8, backgroundColor: 'white', ...shadows.small }, 
      bookingsContainer: { flex: 1, paddingHorizontal: spacing.md },
      dateHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border || '#eee', paddingBottom: spacing.sm },
      dateText: { ...typography.h3, marginLeft: spacing.sm, color: colors.textSecondary, textTransform: 'capitalize', fontWeight: '600' },
      listContent: { paddingBottom: spacing.xl },
      emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
      emptyText: { ...typography.h3, color: colors.textTertiary, marginTop: spacing.md },
      loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
      bookingCard: { 
          marginBottom: spacing.sm, 
          padding: spacing.md, // Utiliser le padding interne de Card
          backgroundColor: 'white' // Fond blanc pour la carte
        },
      bookingCardContent: {
          // Styles pour le contenu à l'intérieur de la carte
      },
      bookingTitle: { 
          ...typography.h4, 
          fontWeight: 'bold', 
          marginBottom: spacing.xs 
      },
      bookingStatusText: (status) => ({ // Fonction pour style dynamique
        ...typography.bodySmall,
        color: getStatusColor(status),
        fontWeight: 'bold',
        marginBottom: spacing.xs
      }),
      bookingTime: {
          ...typography.bodySmall,
          color: colors.textSecondary
      }
    });
  } catch (themeError) {
      console.error("Erreur lors de l'accès aux styles du thème:", themeError);
      // Définir des styles par défaut minimaux en cas d'erreur
      styles = StyleSheet.create({ 
          container: { flex: 1 }, 
          emptyText: {}, dateText: {}, title: {}, header: {}, 
          calendarContainer:{}, bookingsContainer:{}, dateHeader:{}, listContent:{}, 
          emptyContainer:{}, loader:{}, bookingCard:{ padding: 10, marginVertical: 5, backgroundColor:'#eee' },
          bookingCardContent:{}, bookingTitle:{ fontWeight:'bold' }, bookingStatusText:()=>({}), bookingTime:{} 
      });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Planning</Text>
      </View>
      
      <Calendar
        // ... props Calendar ...
        theme={{
            calendarBackground: colors.background || '#f8f9fa',
            textSectionTitleColor: colors.primary || 'blue',
            selectedDayBackgroundColor: colors.primary || 'blue',
            selectedDayTextColor: colors.background || 'white',
            todayTextColor: colors.primary || 'blue',
            dayTextColor: colors.text || 'black',
            textDisabledColor: colors.textTertiary || 'grey',
            dotColor: colors.primary || 'blue',
            selectedDotColor: colors.background || 'white',
            arrowColor: colors.primary || 'blue',
            monthTextColor: colors.text || 'black',
            indicatorColor: colors.primary || 'blue',
            textDayFontWeight: '400',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '500',
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14
          }}
        style={[styles.calendarContainer]}
         current={selectedDate}
         onDayPress={day => setSelectedDate(day.dateString)}
         monthFormat={'yyyy MMMM'}
         markingType={'multi-dot'}
         markedDates={markedDates}
      />
      
      <View style={styles.bookingsContainer}>
        <View style={styles.dateHeader}>
          <Ionicons name="calendar-outline" size={20} color={colors.textSecondary || 'grey'} />
          <Text style={styles.dateText}>
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', { 
              weekday: 'long', day: 'numeric', month: 'long' 
            })}
          </Text>
        </View>
        
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary || 'blue'} style={styles.loader} />
        ) : filteredBookings.length > 0 ? (
          <FlatList
            data={filteredBookings}
            renderItem={renderBookingItem}
            keyExtractor={item => item._id || Math.random().toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="today-outline" size={50} color={colors.textTertiary || 'grey'} />
            <Text style={styles.emptyText}>Aucune mission ce jour</Text>
          </View>
        )}
      </View>
      
    </SafeAreaView>
  );
};


export default ScheduleScreen;
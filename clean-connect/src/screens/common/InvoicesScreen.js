import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInvoices, downloadInvoice } from '../../redux/slices/invoicesSlice';
import Card from '../../components/common/Card';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../utils/colors';
import { formatDate } from '../../utils/dateUtils';

const InvoicesScreen = () => {
  const dispatch = useDispatch();
  const { invoices, loading, error } = useSelector(state => state.invoices);
  const { userType } = useSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth());
  const [activeYear, setActiveYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadInvoices();
  }, [dispatch, activeMonth, activeYear]);

  const loadInvoices = () => {
    dispatch(fetchInvoices({ month: activeMonth + 1, year: activeYear }));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    
    // Option 1: Si loadInvoices() ne retourne pas une promesse
    loadInvoices();
    setRefreshing(false);
    
    // Option 2: Faire en sorte que loadInvoices retourne une promesse
    // Dans la définition de loadInvoices :
    const loadInvoices = () => {
      return dispatch(fetchInvoices({ month: activeMonth + 1, year: activeYear }));
    };
  };

  const handleDownload = (invoiceId) => {
    dispatch(downloadInvoice(invoiceId));
  };

  const handlePreviousMonth = () => {
    if (activeMonth === 0) {
      setActiveMonth(11);
      setActiveYear(activeYear - 1);
    } else {
      setActiveMonth(activeMonth - 1);
    }
  };

  const handleNextMonth = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Don't allow navigation to future months beyond current month
    if (activeYear === currentYear && activeMonth === currentMonth) {
      return;
    }

    if (activeMonth === 11) {
      setActiveMonth(0);
      setActiveYear(activeYear + 1);
    } else {
      setActiveMonth(activeMonth + 1);
    }
  };

  const getMonthName = (monthIndex) => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[monthIndex];
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const renderInvoiceItem = ({ item }) => {
    const isHost = userType === 'host';
    const statusColor = item.status === 'paid' ? colors.success :
                        item.status === 'pending' ? colors.warning : colors.error;
    
    return (
      <Card style={styles.invoiceCard}>
        <View style={styles.invoiceHeader}>
          <View>
            <Text style={styles.invoiceNumber}>Facture #{item.invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <Text style={[styles.invoiceStatus, { color: statusColor }]}>
            {item.status === 'paid' ? 'Payée' : 
             item.status === 'pending' ? 'En attente' : 'Annulée'}
          </Text>
        </View>
        
        <View style={styles.separator} />
        
        <View style={styles.invoiceDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service:</Text>
            <Text style={styles.detailValue}>{item.service}</Text>
          </View>
          
          {item.listing && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Hébergement:</Text>
              <Text style={styles.detailValue}>{item.listing.title}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date service:</Text>
            <Text style={styles.detailValue}>{formatDate(item.serviceDate)}</Text>
          </View>
          
          {isHost ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Prestataire:</Text>
              <Text style={styles.detailValue}>{item.cleaner.name}</Text>
            </View>
          ) : (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Client:</Text>
              <Text style={styles.detailValue}>{item.host.name}</Text>
            </View>
          )}
          
          {item.commission > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Commission:</Text>
              <Text style={styles.detailValue}>{formatAmount(item.commission)}</Text>
            </View>
          )}
          
          <View style={[styles.detailRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Montant Total:</Text>
            <Text style={styles.totalAmount}>{formatAmount(item.amount)}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.downloadButton}
          onPress={() => handleDownload(item._id)}
        >
          <Ionicons name="download-outline" size={20} color="white" />
          <Text style={styles.downloadButtonText}>Télécharger PDF</Text>
        </TouchableOpacity>
      </Card>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={70} color={colors.textLight} />
      <Text style={styles.emptyTitle}>Aucune facture</Text>
      <Text style={styles.emptyText}>
        Vous n'avez aucune facture pour {getMonthName(activeMonth)} {activeYear}.
      </Text>
    </View>
  );

  if (loading && !refreshing && invoices.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={handlePreviousMonth}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        
        <Text style={styles.monthTitle}>
          {getMonthName(activeMonth)} {activeYear}
        </Text>
        
        <TouchableOpacity 
          onPress={handleNextMonth}
          disabled={activeMonth === new Date().getMonth() && activeYear === new Date().getFullYear()}
        >
          <Ionicons 
            name="chevron-forward" 
            size={24} 
            color={activeMonth === new Date().getMonth() && activeYear === new Date().getFullYear() ? 
              colors.textLight : colors.primary} 
          />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={invoices}
        keyExtractor={item => item._id}
        renderItem={renderInvoiceItem}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={invoices.length === 0 ? styles.listEmptyContent : styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 20,
    backgroundColor: colors.errorBackground,
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    marginBottom: 10,
  },
  retryButton: {
    padding: 8,
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  listContent: {
    padding: 15,
  },
  listEmptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 15,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  invoiceCard: {
    marginBottom: 15,
    padding: 0,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  invoiceDate: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  invoiceStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
  invoiceDetails: {
    padding: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  detailValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  totalRow: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  downloadButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: 12,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  downloadButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default InvoicesScreen;
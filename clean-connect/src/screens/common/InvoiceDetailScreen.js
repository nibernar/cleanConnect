import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, Share } from 'react-native';
import { Button, Card, DataTable, Divider } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInvoiceDetail, downloadInvoice } from '../../redux/actions/invoiceActions';
import { MaterialIcons } from '@expo/vector-icons';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatUtils';
import { router } from 'expo-router'; // Importer router

const InvoiceDetailScreen = ({ route }) => {
  const { invoiceId } = route.params;
  const dispatch = useDispatch();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    const loadInvoiceDetail = async () => {
      try {
        const result = await dispatch(fetchInvoiceDetail(invoiceId));
        setInvoice(result);
      } catch (error) {
        Alert.alert('Erreur', "Impossible de charger les détails de la facture");
      } finally {
        setLoading(false);
      }
    };

    loadInvoiceDetail();
  }, [dispatch, invoiceId]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const pdfUrl = await dispatch(downloadInvoice(invoiceId));
      Alert.alert('Succès', 'Facture téléchargée avec succès');
      // Here you would typically open the PDF or save it
    } catch (error) {
      Alert.alert('Erreur', "Une erreur s'est produite lors du téléchargement de la facture");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Facture #${invoice.invoiceNumber} pour un montant de ${formatCurrency(invoice.totalAmount)}`,
        // You would typically include a URL or attachment here
        title: `Facture ${invoice.invoiceNumber}`,
      });
    } catch (error) {
      Alert.alert('Erreur', "Une erreur s'est produite lors du partage de la facture");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#344955" />
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Impossible de charger les détails de la facture</Text>
        <Button mode="contained" onPress={() => router.back()} style={styles.button}>
          Retour
        </Button>
      </View>
    );
  }

  // Determine if the current user is the host or cleaner
  const isHost = user.role === 'host';
  
  // Set party names based on user role
  const fromParty = isHost ? invoice.host?.name || 'Vous' : invoice.cleaner?.name || 'Vous';
  const toParty = isHost ? invoice.cleaner?.name || 'Prestataire' : invoice.host?.name || 'Client';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.invoiceNumber}>Facture #{invoice.invoiceNumber}</Text>
                <Text style={styles.invoiceDate}>Émise le {formatDate(invoice.issueDate)}</Text>
              </View>
              <View style={[styles.statusChip, 
                invoice.status === 'paid' ? styles.paidChip : 
                invoice.status === 'pending' ? styles.pendingChip : 
                styles.cancelledChip]}>
                <Text style={styles.statusText}>
                  {invoice.status === 'paid' ? 'Payée' : 
                   invoice.status === 'pending' ? 'En attente' : 
                   'Annulée'}
                </Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.partiesContainer}>
              <View style={styles.partyContainer}>
                <Text style={styles.partyLabel}>De</Text>
                <Text style={styles.partyName}>{fromParty}</Text>
                <Text style={styles.partyDetail}>{invoice.fromAddress}</Text>
                <Text style={styles.partyDetail}>{invoice.fromEmail}</Text>
              </View>

              <View style={styles.partyContainer}>
                <Text style={styles.partyLabel}>À</Text>
                <Text style={styles.partyName}>{toParty}</Text>
                <Text style={styles.partyDetail}>{invoice.toAddress}</Text>
                <Text style={styles.partyDetail}>{invoice.toEmail}</Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            <Text style={styles.sectionTitle}>Détails de la prestation</Text>
            
            <View style={styles.serviceDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Service</Text>
                <Text style={styles.detailValue}>{invoice.service?.title || 'Prestation de nettoyage'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date du service</Text>
                <Text style={styles.detailValue}>{formatDate(invoice.service?.date)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Adresse</Text>
                <Text style={styles.detailValue}>{invoice.service?.address || 'Non spécifiée'}</Text>
              </View>
              {invoice.service?.duration && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Durée</Text>
                  <Text style={styles.detailValue}>{invoice.service.duration} heures</Text>
                </View>
              )}
            </View>

            <Divider style={styles.divider} />

            <Text style={styles.sectionTitle}>Récapitulatif</Text>
            
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Description</DataTable.Title>
                <DataTable.Title numeric>Quantité</DataTable.Title>
                <DataTable.Title numeric>Montant</DataTable.Title>
              </DataTable.Header>

              {invoice.items?.map((item, index) => (
                <DataTable.Row key={index}>
                  <DataTable.Cell>{item.description}</DataTable.Cell>
                  <DataTable.Cell numeric>{item.quantity}</DataTable.Cell>
                  <DataTable.Cell numeric>{formatCurrency(item.amount)}</DataTable.Cell>
                </DataTable.Row>
              ))}

              <Divider style={styles.tableDivider} />

              <DataTable.Row>
                <DataTable.Cell>Sous-total</DataTable.Cell>
                <DataTable.Cell numeric></DataTable.Cell>
                <DataTable.Cell numeric>{formatCurrency(invoice.subtotal)}</DataTable.Cell>
              </DataTable.Row>
              
              {invoice.tax > 0 && (
                <DataTable.Row>
                  <DataTable.Cell>TVA ({invoice.taxRate}%)</DataTable.Cell>
                  <DataTable.Cell numeric></DataTable.Cell>
                  <DataTable.Cell numeric>{formatCurrency(invoice.tax)}</DataTable.Cell>
                </DataTable.Row>
              )}
              
              <DataTable.Row>
                <DataTable.Cell>Frais de service</DataTable.Cell>
                <DataTable.Cell numeric></DataTable.Cell>
                <DataTable.Cell numeric>{formatCurrency(invoice.serviceFee)}</DataTable.Cell>
              </DataTable.Row>
              
              <DataTable.Row style={styles.totalRow}>
                <DataTable.Cell><Text style={styles.totalText}>Total</Text></DataTable.Cell>
                <DataTable.Cell numeric></DataTable.Cell>
                <DataTable.Cell numeric><Text style={styles.totalText}>{formatCurrency(invoice.totalAmount)}</Text></DataTable.Cell>
              </DataTable.Row>
            </DataTable>

            {invoice.status === 'paid' && (
              <>
                <Divider style={styles.divider} />
                
                <View style={styles.paymentDetailsContainer}>
                  <Text style={styles.paymentDetailsTitle}>Détails du paiement</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date de paiement</Text>
                    <Text style={styles.detailValue}>{formatDateTime(invoice.paymentDate)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Méthode</Text>
                    <Text style={styles.detailValue}>{invoice.paymentMethod}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Référence</Text>
                    <Text style={styles.detailValue}>{invoice.paymentReference}</Text>
                  </View>
                </View>
              </>
            )}

            {invoice.notes && (
              <>
                <Divider style={styles.divider} />
                
                <View style={styles.notesContainer}>
                  <Text style={styles.notesTitle}>Notes</Text>
                  <Text style={styles.notesText}>{invoice.notes}</Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            onPress={handleDownload}
            style={styles.downloadButton}
            loading={downloading}
            disabled={downloading}
            icon="download"
          >
            Télécharger PDF
          </Button>
          
          <Button
            mode="outlined"
            onPress={handleShare}
            style={styles.shareButton}
            icon="share"
          >
            Partager
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  invoiceNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#344955',
  },
  invoiceDate: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  paidChip: {
    backgroundColor: '#E8F5E9',
  },
  pendingChip: {
    backgroundColor: '#FFF8E1',
  },
  cancelledChip: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 16,
  },
  tableDivider: {
    marginVertical: 8,
  },
  partiesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  partyContainer: {
    flex: 1,
    padding: 8,
  },
  partyLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  partyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  partyDetail: {
    fontSize: 14,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#344955',
  },
  serviceDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    flex: 1,
    fontSize: 15,
    color: '#757575',
  },
  detailValue: {
    flex: 2,
    fontSize: 15,
  },
  totalRow: {
    backgroundColor: '#f5f5f5',
  },
  totalText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  paymentDetailsContainer: {
    marginBottom: 16,
  },
  paymentDetailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#344955',
  },
  notesContainer: {
    marginBottom: 16,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#344955',
  },
  notesText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  actionsContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  downloadButton: {
    marginBottom: 12,
    backgroundColor: '#344955',
  },
  shareButton: {
    borderColor: '#344955',
  },
  button: {
    width: '50%',
  },
});

export default InvoiceDetailScreen;
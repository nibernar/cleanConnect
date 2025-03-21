import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { showMessage } from "react-native-flash-message";
import * as FileSystem from 'expo-file-system';
import * as Sharing from "expo-sharing";

/**
 * Récupère les détails d'une facture
 */
export const fetchInvoiceDetail = createAsyncThunk(
  'invoices/fetchDetail',
  async (invoiceId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}`);
      return response.data;
    } catch (error) {
      // Affichage d'un message d'erreur
      showMessage({
        message: 'Erreur',
        description: error.response?.data?.message || 'Impossible de récupérer les détails de la facture.',
        type: 'danger',
      });
      
      return rejectWithValue(error.response?.data || { message: 'Une erreur est survenue' });
    }
  }
);

/**
 * Récupère la liste des factures de l'utilisateur
 */
export const fetchInvoices = createAsyncThunk(
  'invoices/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/invoices', { params });
      return response.data;
    } catch (error) {
      // Affichage d'un message d'erreur
      showMessage({
        message: 'Erreur',
        description: 'Impossible de récupérer vos factures.',
        type: 'danger',
      });
      
      return rejectWithValue(error.response?.data || { message: 'Une erreur est survenue' });
    }
  }
);

/**
 * Télécharge une facture au format PDF
 */
export const downloadInvoice = createAsyncThunk(
  'invoices/download',
  async (invoiceId, { rejectWithValue }) => {
    try {
      // Récupère l'URL du PDF
      const response = await api.get(`/invoices/${invoiceId}/download`, {
        responseType: 'blob',
      });
      
      const fileUri = `${FileSystem.documentDirectory}facture-${invoiceId}.pdf`;
      
      // Convertit la réponse en base64 et la sauvegarde localement
      const base64Data = response.data;
      await FileSystem.writeAsStringAsync(fileUri, base64Data, { 
        encoding: FileSystem.EncodingType.Base64 
      });
      
      // Partage le fichier
      await Sharing.shareAsync(fileUri);
      
      // Affiche un message de succès
      showMessage({
        message: 'Succès',
        description: 'La facture a été téléchargée.',
        type: 'success',
      });
      
      return { success: true };
    } catch (error) {
      // Affichage d'un message d'erreur
      showMessage({
        message: 'Erreur',
        description: 'Impossible de télécharger la facture.',
        type: 'danger',
      });
      
      return rejectWithValue(error.response?.data || { message: 'Une erreur est survenue' });
    }
  }
);

/**
 * Marque une facture comme payée (pour les hôtes)
 */
export const markInvoiceAsPaid = createAsyncThunk(
  'invoices/markAsPaid',
  async (invoiceId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/invoices/${invoiceId}/pay`);
      
      // Affichage d'un message de succès
      showMessage({
        message: 'Paiement effectué',
        description: 'La facture a été marquée comme payée.',
        type: 'success',
      });
      
      return response.data;
    } catch (error) {
      // Affichage d'un message d'erreur
      showMessage({
        message: 'Erreur',
        description: error.response?.data?.message || 'Impossible de marquer la facture comme payée.',
        type: 'danger',
      });
      
      return rejectWithValue(error.response?.data || { message: 'Une erreur est survenue' });
    }
  }
);
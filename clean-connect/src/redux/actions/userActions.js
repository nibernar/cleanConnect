import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { setUser } from '../slices/userSlice';
import { showMessage } from "react-native-flash-message";

/**
 * Met à jour les informations bancaires d'un agent de nettoyage
 */
export const updateBankingInfo = createAsyncThunk(
  'user/updateBankingInfo',
  async (bankingData, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.put('/users/banking-info', bankingData);
      
      // Mise à jour des données utilisateur dans le state
      dispatch(setUser(response.data.user));
      
      // Affichage d'un message de succès
      showMessage({
        message: 'Informations bancaires mises à jour',
        description: 'Vos informations bancaires ont été mises à jour avec succès.',
        type: 'success',
      });
      
      return response.data;
    } catch (error) {
      // Affichage d'un message d'erreur
      showMessage({
        message: 'Erreur',
        description: error.response?.data?.message || 'Une erreur est survenue lors de la mise à jour des informations bancaires.',
        type: 'danger',
      });
      
      return rejectWithValue(error.response?.data || { message: 'Une erreur est survenue' });
    }
  }
);

/**
 * Récupère les informations bancaires d'un agent de nettoyage
 */
export const fetchBankingInfo = createAsyncThunk(
  'user/fetchBankingInfo',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/banking-info');
      return response.data;
    } catch (error) {
      // Affichage d'un message d'erreur si nécessaire
      if (error.response?.status !== 404) {
        showMessage({
          message: 'Erreur',
          description: 'Impossible de récupérer vos informations bancaires.',
          type: 'danger',
        });
      }
      
      return rejectWithValue(error.response?.data || { message: 'Une erreur est survenue' });
    }
  }
);

/**
 * Met à jour le profil utilisateur
 */
export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.put('/users/profile', profileData);
      
      // Mise à jour des données utilisateur dans le state
      dispatch(setUser(response.data.user));
      
      // Affichage d'un message de succès
      showMessage({
        message: 'Profil mis à jour',
        description: 'Votre profil a été mis à jour avec succès.',
        type: 'success',
      });
      
      return response.data;
    } catch (error) {
      // Affichage d'un message d'erreur
      showMessage({
        message: 'Erreur',
        description: error.response?.data?.message || 'Une erreur est survenue lors de la mise à jour du profil.',
        type: 'danger',
      });
      
      return rejectWithValue(error.response?.data || { message: 'Une erreur est survenue' });
    }
  }
);

/**
 * Récupère le profil de l'utilisateur connecté
 */
export const fetchProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.get('/users/profile');
      
      // Mise à jour des données utilisateur dans le state
      dispatch(setUser(response.data.user));
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Une erreur est survenue' });
    }
  }
);
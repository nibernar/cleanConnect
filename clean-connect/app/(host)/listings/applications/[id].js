import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ApplicationDetailScreen from '../../../../src/screens/host/ApplicationDetailScreen';
import { useDispatch } from 'react-redux';
import { acceptApplication, rejectApplication } from '../../../../src/redux/slices/applicationsSlice';

export default function ApplicationDetail() {
  const router = useRouter();
  const dispatch = useDispatch();
  // Récupérer à la fois l'id et le listingId des paramètres
  const { id, listingId } = useLocalSearchParams();
  
  const handleAccept = async () => {
    try {
      // Implémentation réelle de l'acceptation de candidature
      await dispatch(acceptApplication(id)).unwrap();
      
      // Si listingId est présent, naviguer vers le paiement
      if (listingId) {
        router.push(`/(host)/listings/[id]/payment?id=${listingId}&applicationId=${id}`);
      } else {
        // Sinon, revenir simplement en arrière
        router.back();
      }
    } catch (error) {
      console.error('Erreur lors de l\'acceptation de la candidature:', error);
      alert('Une erreur s\'est produite lors de l\'acceptation de la candidature.');
    }
  };
  
  const handleReject = async () => {
    try {
      // Implémentation réelle du rejet de candidature
      await dispatch(rejectApplication(id)).unwrap();
      router.back();
    } catch (error) {
      console.error('Erreur lors du rejet de la candidature:', error);
      alert('Une erreur s\'est produite lors du rejet de la candidature.');
    }
  };
  
  const handleMessage = (userId) => {
    // Redirection vers la conversation avec l'utilisateur
    router.push(`/(host)/messages/${userId}`);
  };
  
  return (
    <ApplicationDetailScreen 
      applicationId={id}
      listingId={listingId} // Passer le listingId au composant
      onAccept={handleAccept}
      onReject={handleReject}
      onMessage={handleMessage}
    />
  );
}
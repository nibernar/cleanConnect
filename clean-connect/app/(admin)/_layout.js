// app/(admin)/_layout.js
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useSelector } from 'react-redux';
// Correction: Chemin d'importation corrigé
import LoadingScreen from '../../src/screens/common/AuthLoadingScreen'; 

// Sélecteur pour obtenir le rôle utilisateur (à adapter si besoin)
const selectUserRole = (state) => state.auth.user?.role || state.user?.user?.role;

function AdminLayout() {
  const router = useRouter();
  const segments = useSegments();
  const userRole = useSelector(selectUserRole);
  const isLoading = useSelector(state => state.auth.isLoading || state.user.isLoading); 

  useEffect(() => {
    const inAdminGroup = segments[0] === '(admin)';

    if (!isLoading && inAdminGroup && userRole !== 'admin') {
      console.warn('[AdminLayout] Accès non admin détecté, redirection...');
      const fallbackRoute = userRole === 'cleaner' ? '/(cleaner)/' : userRole === 'host' ? '/(host)/' : '/(auth)/login';
      router.replace(fallbackRoute);
    }
  }, [userRole, isLoading, segments, router]);

  if (isLoading) {
    return <LoadingScreen message="Vérification droits admin..." />;
  }

   if (userRole !== 'admin') {
       return <LoadingScreen message="Redirection..." />;
   }

  console.log('[AdminLayout] Utilisateur admin autorisé, rendu du Stack.');
  return (
    <Stack>
      <Stack.Screen
        name="manage-cleaners" // Nom du fichier de route
        options={{ title: 'Gestion Cleaners' }}
      />
      {/* Ajouter d'autres écrans admin ici si nécessaire */}
    </Stack>
  );
}

export default AdminLayout;

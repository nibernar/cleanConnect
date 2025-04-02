import React from 'react';
import { useRouter } from 'expo-router';
import DashboardScreen from '../../../src/screens/cleaner/DashboardScreen';

export default function Dashboard() {
  const router = useRouter();
  
  const handleViewJob = (jobId) => {
    router.push(`/(cleaner)/jobs/${jobId}`);
  };
  
  const handleSchedule = () => {
    router.push('/(cleaner)/schedule');
  };
  
  const handleUpdateProfile = () => {
    router.push('/(cleaner)/profile/edit');
  };

  return (
    <DashboardScreen 
      onViewJob={handleViewJob}
      onSchedule={handleSchedule}
      onUpdateProfile={handleUpdateProfile}
    />
  );
}
import React from 'react';
import { useRouter } from 'expo-router';
import InvoicesScreen from '../../../src/screens/common/InvoicesScreen';

export default function HostInvoices() {
  const router = useRouter();
  
  const handleInvoicePress = (invoiceId) => {
    router.push({
      pathname: `/(host)/profile/invoices/${invoiceId}`,
      params: { id: invoiceId }
    });
  };
  
  return (
    <InvoicesScreen 
      userType="host"
      onInvoicePress={handleInvoicePress}
    />
  );
}
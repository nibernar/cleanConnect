import { Redirect } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';

export default function HostListingApplicationsRedirect() {
  const { id } = useLocalSearchParams();
  return <Redirect href={`/(host)/listings/${id}/applications`} />;
}
import { Redirect } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';

export default function CleanerListingRedirect() {
  const { id } = useLocalSearchParams();
  return <Redirect href={`/(cleaner)/listings/${id}`} />;
}
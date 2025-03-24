// app/(auths)/register/_layout.tsx
import { Stack } from "expo-router";
export default function DashboardLayout() {
   return (
      <Stack>
        <Stack.Screen name="index" />
        <Stack.Screen name="create-listing" />
      </Stack>
    );
}
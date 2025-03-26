import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack>
    <Stack.Screen name="menuUtama" options={{ headerShown: false }}/>
    <Stack.Screen name="dashboard" options={{ headerShown: false }}/>
    <Stack.Screen name="NearbyCampaigns" options={{ headerShown: false }}/>
    <Stack.Screen name="MapScreen" />
  </Stack>;
}

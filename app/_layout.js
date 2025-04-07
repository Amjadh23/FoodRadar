import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack>
    <Stack.Screen name="index" options={{ headerShown: false }}/>
    <Stack.Screen name="MenuUtama" options={{ headerShown: false }}/>
    <Stack.Screen name="dashboard" options={{ headerShown: false }}/>
    <Stack.Screen name="NearbyCampaigns" options={{ headerShown: false }}/>
    <Stack.Screen name="NgoDashboard" options={{ headerShown: false }}/>
    <Stack.Screen name="NgoRegistration" options={{ headerShown: false }}/>
    <Stack.Screen name="MainMenu" options={{ headerShown: false }}/>
    <Stack.Screen name="UserRegister" options={{ headerShown: false }}/>
    <Stack.Screen name="MapScreen" />
  </Stack>;
}

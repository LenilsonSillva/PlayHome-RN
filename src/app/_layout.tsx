import { loadRewardedAd } from "@/services/ads/adsService";
import { Stack } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
  loadRewardedAd();
}, []);
  return <Stack screenOptions={{ headerShown: false }} />;
}

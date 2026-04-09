import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Stack } from "expo-router";
import Purchases, { PurchasesPackage } from "react-native-purchases";

import { getCurrentOffering } from "@/lib/revenuecat";

export default function Paywall() {
  const [loading, setLoading] = useState(true);
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);

  const priceText = useMemo(() => {
    if (!pkg) return "";
    // RevenueCat exposes localized price strings.
    return pkg.product.priceString;
  }, [pkg]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const offering = await getCurrentOffering();
        const first = offering?.availablePackages?.[0] ?? null;
        if (!cancelled) setPkg(first);
      } catch (e: any) {
        if (!cancelled) {
          Alert.alert("Error", e?.message ?? String(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function purchase() {
    if (!pkg) return;
    try {
      setLoading(true);
      const result = await Purchases.purchasePackage(pkg);
      Alert.alert("Success", "Purchase completed.");
      // You can check entitlements here:
      // result.customerInfo.entitlements.active
    } catch (e: any) {
      if (e?.userCancelled) return;
      Alert.alert("Purchase Error", e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function restore() {
    try {
      setLoading(true);
      await Purchases.restorePurchases();
      Alert.alert("Restored", "Purchases restored.");
    } catch (e: any) {
      Alert.alert("Restore Error", e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: "Upgrade" }} />

      <View className="px-6 py-8">
        <Text className="text-2xl font-bold text-gray-900 mb-2">Upgrade</Text>
        <Text className="text-gray-600 mb-6">
          Unlock premium features with a subscription.
        </Text>

        <View className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Premium
          </Text>
          <Text className="text-gray-600 mb-4">
            AI limits increase, plus extra features.
          </Text>

          <Text className="text-gray-900 font-semibold mb-4">
            {pkg ? priceText : loading ? "Loading price..." : "No packages found"}
          </Text>

          <TouchableOpacity
            className={`rounded-lg py-4 px-6 mb-3 ${
              loading || !pkg ? "bg-gray-300" : "bg-blue-600 active:bg-blue-700"
            }`}
            disabled={loading || !pkg}
            onPress={purchase}
          >
            <Text
              className={`text-center font-semibold ${
                loading || !pkg ? "text-gray-500" : "text-white"
              }`}
            >
              {loading ? "⏳ Please wait..." : "Subscribe"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`rounded-lg py-3 px-6 ${
              loading ? "bg-gray-200" : "bg-white border border-gray-300"
            }`}
            disabled={loading}
            onPress={restore}
          >
            <Text className="text-center font-medium text-gray-900">
              Restore purchases
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}


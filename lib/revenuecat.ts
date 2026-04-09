import { Platform } from "react-native";
import Purchases, { LOG_LEVEL, PurchasesOffering } from "react-native-purchases";

const iosApiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || "";
const androidApiKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || "";

let configured = false;

export function getRevenueCatApiKey() {
  if (Platform.OS === "ios") return iosApiKey;
  if (Platform.OS === "android") return androidApiKey;
  return "";
}

export async function configureRevenueCat() {
  if (configured) return;

  // Web/unsupported platforms: do nothing.
  const apiKey = getRevenueCatApiKey();
  if (!apiKey) return;

  Purchases.setLogLevel(LOG_LEVEL.WARN);
  await Purchases.configure({ apiKey });
  configured = true;
}

export async function setRevenueCatUser(appUserID: string | null) {
  await configureRevenueCat();
  if (!configured) return;

  if (appUserID) {
    await Purchases.logIn(appUserID);
  } else {
    await Purchases.logOut();
  }
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  await configureRevenueCat();
  if (!configured) return null;

  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}


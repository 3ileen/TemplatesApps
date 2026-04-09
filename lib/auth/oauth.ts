import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { Platform } from "react-native";

import { supabase } from "../supabase";

WebBrowser.maybeCompleteAuthSession();

function getRedirectUri() {
  // Uses `scheme` from app.json ("myapp").
  // For dev builds this will be like: myapp://
  // For web it will be a normal URL.
  return makeRedirectUri({
    scheme: "myapp",
    path: "auth/callback",
  });
}

function getUrlParam(url: string, key: string) {
  // Supabase may return values in either query (?code=) or fragment (#access_token=).
  const query = url.split("?")[1]?.split("#")[0] ?? "";
  const hash = url.split("#")[1] ?? "";
  const params = new URLSearchParams(query);
  const hashParams = new URLSearchParams(hash);
  return params.get(key) ?? hashParams.get(key);
}

export async function signInWithOAuthInAppBrowser(provider: "google" | "apple") {
  const redirectTo = getRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      // We want the URL so we can open it ourselves.
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error("Missing OAuth URL from Supabase.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
    preferEphemeralSession: Platform.OS === "ios",
  });

  if (result.type !== "success" || !result.url) {
    throw new Error("OAuth flow was cancelled.");
  }

  // Prefer PKCE code exchange if present.
  const code = getUrlParam(result.url, "code");
  if (code) {
    const exchange = await supabase.auth.exchangeCodeForSession(result.url);
    if (exchange.error) throw exchange.error;
    return;
  }

  // Fallback: implicit flow tokens.
  const access_token = getUrlParam(result.url, "access_token");
  const refresh_token = getUrlParam(result.url, "refresh_token");
  if (access_token && refresh_token) {
    const set = await supabase.auth.setSession({ access_token, refresh_token });
    if (set.error) throw set.error;
    return;
  }

  throw new Error("OAuth redirect did not include a session code or tokens.");
}


import { createOptionalClient, hasSupabaseConfig } from "./supabase/client";

export type AuthState = {
  configured: boolean;
  email: string | null;
  signedIn: boolean;
};

export function initialAuthState(): AuthState {
  return { configured: hasSupabaseConfig(), email: null, signedIn: false };
}

export async function getAuthState(): Promise<AuthState> {
  const client = createOptionalClient();
  if (!client) return initialAuthState();
  const { data } = await client.auth.getSession();
  const user = data.session?.user;
  return { configured: true, email: user?.email ?? null, signedIn: Boolean(user) };
}

export function listenForAuthChanges(onChange: (state: AuthState) => void) {
  const client = createOptionalClient();
  if (!client) return () => undefined;
  const { data } = client.auth.onAuthStateChange((_event, session) => {
    const user = session?.user;
    onChange({ configured: true, email: user?.email ?? null, signedIn: Boolean(user) });
  });
  return () => data.subscription.unsubscribe();
}

export async function sendMagicLink(email: string) {
  const client = createOptionalClient();
  if (!client) throw new Error("Supabase is not configured");
  const { error } = await client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin }
  });
  if (error) throw error;
}

export async function signOut() {
  const client = createOptionalClient();
  if (!client) return;
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

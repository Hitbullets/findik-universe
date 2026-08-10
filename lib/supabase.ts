"use client";

import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && key ? createBrowserClient(url, key) : null;

export async function sendMagicLink(email: string) {
  if (!supabase) return { error: "Supabase henüz yapılandırılmadı." };
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
  return { error: error?.message ?? null };
}

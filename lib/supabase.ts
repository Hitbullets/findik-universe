"use client";

import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && key ? createBrowserClient(url, key) : null;

export async function sendMagicLink(email: string) {
  if (!supabase) return { error: "Supabase henüz yapılandırılmadı." };
  const allowed = (process.env.NEXT_PUBLIC_AUTH_REDIRECT_ORIGINS || window.location.origin).split(",").map((origin) => origin.trim()).filter(Boolean);
  if (!allowed.includes(window.location.origin)) return { error: "Bu uygulama adresi güvenli giriş listesinde değil." };
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
  return { error: error?.message ?? null };
}

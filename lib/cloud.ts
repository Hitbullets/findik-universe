"use client";

import { supabase } from "./supabase";
import { normalizeProgress } from "./progress-schema";
import type { ProgressV3 } from "./types";

type CloudResult = { error: string | null };

export async function backupProgress(progress: ProgressV3): Promise<CloudResult> {
  if (!supabase) return { error: "Supabase henüz yapılandırılmadı." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Önce giriş yapmalısın." };
  const state = normalizeProgress(progress);
  const { error } = await supabase.from("progress_v3").upsert({ user_id: user.id, version: 3, state, updated_at: new Date().toISOString() });
  return { error: error?.message ?? null };
}

export async function restoreProgress(): Promise<{ progress: ProgressV3 | null; error: string | null }> {
  if (!supabase) return { progress: null, error: "Supabase henüz yapılandırılmadı." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { progress: null, error: "Önce giriş yapmalısın." };
  const { data, error } = await supabase.from("progress_v3").select("version,state").eq("user_id", user.id).maybeSingle();
  if (error) return { progress: null, error: error.message };
  if (!data || data.version !== 3) return { progress: null, error: "Bu hesapta v3 yedeği bulunamadı." };
  const state = normalizeProgress(data.state);
  return { progress: state, error: null };
}

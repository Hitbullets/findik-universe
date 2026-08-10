"use client";

import { supabase } from "./supabase";
import { migrateV2ToV3, normalizeProgress } from "./progress-schema";
import type { Progress, ProgressV3 } from "./types";

type CloudResult = { error: string | null };

export async function backupProgress(progress: Progress | ProgressV3): Promise<CloudResult> {
  if (!supabase) return { error: "Supabase henüz yapılandırılmadı." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Önce giriş yapmalısın." };
  const state = normalizeProgress(progress.version === 2 ? migrateV2ToV3(progress) : progress);
  const { error } = await supabase.from("progress_v3").upsert({ user_id: user.id, version: 3, state, updated_at: new Date().toISOString() });
  return { error: error?.message ?? null };
}

export async function restoreProgress(): Promise<{ progress: Progress | null; error: string | null }> {
  if (!supabase) return { progress: null, error: "Supabase henüz yapılandırılmadı." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { progress: null, error: "Önce giriş yapmalısın." };
  const { data, error } = await supabase.from("progress_v3").select("version,state").eq("user_id", user.id).maybeSingle();
  if (error) return { progress: null, error: error.message };
  if (!data || data.version !== 3) return { progress: null, error: "Bu hesapta v3 yedeği bulunamadı." };
  const state = normalizeProgress(data.state);
  const allowed = new Set(["tram", "bike", "cafe", "park", "night"]);
  const memories = state.memories.filter((memory) => allowed.has(String(memory.id))) as Progress["memories"];
  const completed = Object.values(state.completions).map((record) => record.content.id).filter((id): id is Progress["completed"][number] => allowed.has(id));
  return { progress: { version: 2, xp: state.xp, completed, boops: state.boops, wardrobe: state.wardrobe.unlocked, memories }, error: null };
}

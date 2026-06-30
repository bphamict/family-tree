import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getProfileByUserId(
  userId: string,
): Promise<Profile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, user_id, full_name, avatar_url, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function ensureProfile(
  userId: string,
  fallbackName: string,
): Promise<Profile> {
  const existing = await getProfileByUserId(userId);

  if (existing) {
    return existing;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      user_id: userId,
      full_name: fallbackName,
    })
    .select("id, user_id, full_name, avatar_url, created_at, updated_at")
    .single();

  if (error) {
    const retry = await getProfileByUserId(userId);
    if (retry) {
      return retry;
    }

    throw error;
  }

  return data;
}

export async function updateProfile(
  userId: string,
  data: {
    full_name?: string;
    avatar_url?: string | null;
  },
): Promise<Profile> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .update(data)
    .eq("user_id", userId)
    .select("id, user_id, full_name, avatar_url, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return profile;
}

import { supabase } from "./supabaseClient";
import type { ExitListing } from "./types";

export async function fetchActiveListings(): Promise<ExitListing[]> {
  const { data, error } = await supabase
    .from("exit_listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching listings:", error);
    return [];
  }

  return data || [];
}

export async function fetchListingById(id: string): Promise<ExitListing | null> {
  const { data, error } = await supabase
    .from("exit_listings")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (error) {
    console.error("Error fetching listing:", error);
    return null;
  }

  return data;
}

export async function createListing(
  listing: Omit<ExitListing, "id" | "created_at" | "user_id" | "status">
): Promise<{ data: ExitListing | null; error: any }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: { message: "Not authenticated" } };
  }

  const { data, error } = await supabase
    .from("exit_listings")
    .insert([
      {
        ...listing,
        user_id: user.id,
        status: "active",
      },
    ])
    .select()
    .single();

  return { data, error };
}

export async function softDeleteListing(id: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from("exit_listings")
    .update({ status: "deleted" })
    .eq("id", id);

  return { error };
}

export async function checkIsOwner(listingId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data } = await supabase
    .from("exit_listings")
    .select("user_id")
    .eq("id", listingId)
    .single();

  return data?.user_id === user.id;
}

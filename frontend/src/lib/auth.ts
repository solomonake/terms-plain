import { supabase } from "./supabaseClient";

export async function signUp(email: string, password: string) {
  if (!supabase) {
    return { data: null, error: { message: "Supabase is not configured." } };
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  if (!supabase) {
    return { data: null, error: { message: "Supabase is not configured." } };
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  if (!supabase) {
    return { error: { message: "Supabase is not configured." } };
  }
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession() {
  if (!supabase) {
    return { session: null, error: { message: "Supabase is not configured." } };
  }
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}

export async function getUser() {
  if (!supabase) {
    return { user: null, error: { message: "Supabase is not configured." } };
  }
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, error };
}

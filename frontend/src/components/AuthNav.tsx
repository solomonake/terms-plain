"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";
import { signOut } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

export default function AuthNav() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabaseEnv || !supabase) {
      setIsLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    router.push("/");
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className="nav-links">
      <Link href="/">Analyze</Link>
      <Link href="/explain">Explain</Link>
      <Link href="/exit-board">Exit Board</Link>
      {user ? (
        <button
          onClick={handleSignOut}
          className="button-secondary"
          style={{ padding: "6px 14px", fontSize: "1rem" }}
        >
          Sign Out
        </button>
      ) : (
        <Link href="/auth/sign-in">Sign In</Link>
      )}
    </div>
  );
}

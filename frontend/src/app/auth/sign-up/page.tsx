"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { signUp } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabaseClient";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    const { data, error: signUpError } = await signUp(email.trim(), password);

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }

    if (data?.user) {
      router.push("/exit-board");
    }

    setIsLoading(false);
  };

  return (
    <div className="section">
      <h2>Sign Up</h2>
      <p>Create an account to post Exit Board listings</p>
      {!hasSupabaseEnv ? (
        <div className="card">
          <p>
            Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and
            NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.
          </p>
        </div>
      ) : null}

      <form className="form card" onSubmit={handleSubmit} style={{ maxWidth: "480px" }}>
        <div className="section">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            required
          />
        </div>

        <div className="section">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
          />
        </div>

        <div className="section">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            required
          />
        </div>

        {error && <p className="error">{error}</p>}

        <button
          type="submit"
          className="button"
          disabled={isLoading || !hasSupabaseEnv}
        >
          {isLoading ? "Creating account..." : "Sign Up"}
        </button>

        <p className="muted">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="inline-link">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

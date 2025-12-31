"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { signIn } from "@/lib/auth";

export default function SignInClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/exit-board";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }

    setIsLoading(true);

    const { data, error: signInError } = await signIn(email.trim(), password);

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
      return;
    }

    if (data.session) {
      router.push(next);
    }
  };

  return (
    <div className="section">
      <h2>Sign In</h2>
      <p>Sign in to post and manage your Exit Board listings</p>

      <form
        className="form card"
        onSubmit={handleSubmit}
        style={{ maxWidth: "480px" }}
      >
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
            placeholder="Enter your password"
            required
          />
        </div>

        {error && <p className="error">{error}</p>}

        <button type="submit" className="button" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign In"}
        </button>

        <p className="muted">
          Don&apos;t have an account?{" "}
          <Link href="/auth/sign-up" className="inline-link">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}

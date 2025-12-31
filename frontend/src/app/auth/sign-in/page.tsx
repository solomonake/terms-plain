import { Suspense } from "react";
import SignInClient from "./sign-in-client";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="section">Loading...</div>}>
      <SignInClient />
    </Suspense>
  );
}

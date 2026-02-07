import SignupClient from "@/components/auth/SignupClient";
import { Suspense } from "react";

export default function Signup() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupClient />
    </Suspense>
  );
}

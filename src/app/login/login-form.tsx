"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Step = "email" | "code";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    setBusy(false);
    if (error) {
      setError(error.message);
    } else {
      setStep("code");
    }
  }

  async function verifyCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });

    setBusy(false);
    if (error) {
      setError(error.message);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  if (step === "code") {
    return (
      <form onSubmit={verifyCode} className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5 text-center">
          <p className="text-2xl">✉️</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Code sent to <span className="font-medium">{email}</span>
          </p>
        </div>
        <div className="space-y-2">
          <label htmlFor="code" className="text-sm font-medium">
            Sign-in code
          </label>
          <input
            id="code"
            type="text"
            required
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={8}
            placeholder="••••••••"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="flex h-14 w-full rounded-md border border-input bg-background px-3 text-center font-mono text-2xl tracking-[0.35em] ring-offset-background placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={busy || code.length < 6}
        >
          {busy ? "Verifying…" : "Sign in"}
        </Button>
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setCode("");
            setError(null);
          }}
          className="block w-full text-center text-xs text-muted-foreground underline"
        >
          Use a different email
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex h-12 w-full rounded-md border border-input bg-background px-4 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={busy || !email}
      >
        {busy ? "Sending…" : "Send sign-in code"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        We'll email you a 6-digit code. No password.
      </p>
    </form>
  );
}

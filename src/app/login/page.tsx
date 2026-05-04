import { LoginForm } from "./login-form";
import { APP_NAME } from "@/lib/site";

export default function LoginPage() {
  return (
    <div className="flex min-h-[100svh] flex-col items-stretch justify-center py-16">
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <span className="text-2xl font-bold">C</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{APP_NAME}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Plan, prioritize, and track what matters.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}

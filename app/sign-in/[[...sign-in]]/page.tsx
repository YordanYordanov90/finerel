import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-full items-center justify-center bg-[#0a0a0a] px-4 py-12">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/overview"
      />
    </main>
  );
}
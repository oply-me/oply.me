import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/dashboard/onboarding-flow";
import { requireUser } from "@/lib/auth/guards";

export default async function OnboardingPage() {
  const user = await requireUser("/dashboard/onboarding");

  // Already answered — no reason to ask twice.
  if (user.profile?.onboarded_at) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-lg py-6">
      <OnboardingFlow name={user.profile?.full_name ?? null} />
    </div>
  );
}

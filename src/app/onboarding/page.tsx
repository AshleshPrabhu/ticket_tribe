import OnboardingModal from "@/modules/onboarding/ui/components/multi-modal";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
export default async function Page() {
  const session = await auth.api.getSession({
      headers: await headers()
    });
    
    if (!session){
      redirect('/sign-in');
    }
    if(session.user.onboarded){
      redirect('/predict')
    }
  return (
    <div className="flex items-center justify-center h-screen">
      <OnboardingModal />
    </div>
  );
}

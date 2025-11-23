import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const Page = async () => {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  
  if (!session) {
    redirect('/sign-in');
  }
  
  // Check if user has completed onboarding
  if (!session.user.onboarded) {
    redirect('/onboarding');
  }
  
  // User is authenticated and onboarded, redirect to dashboard/predict
  redirect('/predict');
}

export default Page;
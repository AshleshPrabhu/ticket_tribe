// In each dashboard page
import { auth } from "@/lib/auth";
import PredictView from "@/modules/predict/ui/views/predict-view";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const PredictPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  if (!session) {
    redirect('/sign-in');
  }
  
  return <PredictView />;
};

export default PredictPage;
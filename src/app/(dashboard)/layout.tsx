import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/modules/dashboard/ui/components/dashboard-sidebar";
import { DashboardNav } from "@/modules/dashboard/ui/components/dashboard-navbar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

interface Props {
    children: React.ReactNode;
}

const Layout = async ({ children }: Props) => {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    
    if (!session) {
        redirect('/sign-in');
    }
    
    // Check if user needs onboarding
    if (!session.user.onboarded) {
        redirect('/onboarding');
    }
    
    return (
        <div>
            <SidebarProvider>
                <DashboardSidebar />
                <main className="flex flex-col min-h-screen w-screen bg-muted">
                    <DashboardNav />
                    {children}
                </main>
            </SidebarProvider>
        </div>
    );
}

export default Layout;
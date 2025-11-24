import dynamic from 'next/dynamic';

const HomeView = dynamic(() => import("@/modules/home/ui/views/home-view").then(mod => ({ default: mod.HomeView })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>
});

export default function Page() {
  return <HomeView />;
}
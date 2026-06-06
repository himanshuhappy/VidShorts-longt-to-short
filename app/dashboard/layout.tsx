import { Sidebar } from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full relative flex">
      {/* Sidebar for Desktop */}
      <div className="hidden md:flex h-full w-64 flex-col fixed inset-y-0 z-50">
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <main className="md:pl-64 flex-1 h-full min-h-screen">
        {children}
      </main>
    </div>
  );
}

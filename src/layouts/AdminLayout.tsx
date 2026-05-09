import { Outlet, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminLayout() {
  const { user, loading, isStaff } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-secondary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full bg-background text-foreground overflow-hidden">
        <AdminSidebar />
        <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
          <header className="h-14 flex items-center border-b border-white/10 px-4 bg-background/60 backdrop-blur-xl flex-shrink-0">
            <SidebarTrigger className="mr-4" />
            <h2 className="font-display font-semibold text-sm text-foreground">CRM Панель</h2>
          </header>
          <main className="flex-1 min-h-0 min-w-0 p-2 sm:p-4 md:p-6 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

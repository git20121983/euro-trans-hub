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
    <div className="dark">
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background text-foreground overflow-hidden">
          <AdminSidebar />
          <div className="flex-1 min-w-0 flex flex-col">
            <header className="h-14 flex items-center border-b border-border px-4 bg-card flex-shrink-0">
              <SidebarTrigger className="mr-4" />
              <h2 className="font-display font-semibold text-sm text-foreground">CRM Панель</h2>
            </header>
            <main className="flex-1 min-h-0 p-4 sm:p-6 overflow-auto bg-background">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}

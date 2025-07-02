import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

export function Layout() {
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // If not authenticated, show regular navbar
  if (!user) {
    return (
      <>
        <Navbar />
        <Outlet />
      </>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Mobile sidebar */}
        {isMobile && <AppSidebar />}
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b bg-white flex items-center justify-between px-4">
            <div className="flex items-center space-x-4">
              {isMobile && <SidebarTrigger />}
              {!isMobile && (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">B</span>
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-500 bg-clip-text text-transparent">
                    Bizflow
                  </span>
                </div>
              )}
            </div>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback className="bg-primary text-white">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white border shadow-lg" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* Desktop Navigation */}
          {!isMobile && (
            <nav className="border-b bg-white">
              <div className="max-w-7xl mx-auto px-4">
                <div className="flex space-x-8 h-12 items-center">
                  {[
                    { name: "Dashboard", path: "/dashboard" },
                    { name: "Products", path: "/products" },
                    { name: "Invoices", path: "/invoices" },
                    { name: "Expenses", path: "/expenses" },
                    { name: "Clients", path: "/clients" },
                    { name: "Payments", path: "/payments" },
                    { name: "Sales Report", path: "/sales-report" },
                    { name: "Referrals", path: "/referrals" },
                    { name: "Team", path: "/team" },
                  ].map((item) => (
                    <button
                      key={item.name}
                      onClick={() => navigate(item.path)}
                       className={`text-sm font-medium transition-colors hover:text-primary ${
                        location.pathname === item.path ? "text-primary" : "text-gray-700"
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            </nav>
          )}

          {/* Main content */}
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  CreditCard, 
  Settings,
  TrendingUp,
  Gift,
  UserCheck
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Customers", url: "/clients", icon: Users },
  { title: "Products", url: "/products", icon: Package },
  { title: "Invoices", url: "/invoices", icon: FileText },
  { title: "Payments", url: "/payments", icon: CreditCard },
  { title: "Expenses", url: "/expenses", icon: TrendingUp },
  { title: "Sales Report", url: "/sales-report", icon: TrendingUp },
  { title: "Referrals", url: "/referrals", icon: Gift },
  { title: "Team", url: "/team", icon: UserCheck },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar className="w-60">
      <SidebarContent>
        {/* Logo */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-500 bg-clip-text text-transparent">
              Bizflow
            </span>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className={`w-full justify-start px-3 py-2 rounded-lg transition-colors ${
                      isActive(item.url) 
                        ? "bg-green-100 text-green-700 font-medium" 
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <NavLink to={item.url} className="flex items-center space-x-3">
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  LogOut,
  Settings,
  ImageIcon,
  Users,
  TagsIcon,
  MapIcon,
  Home,
  Award,
  Ticket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { userService } from "@/services/user";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigation = [
  {
    name: "Home",
    href: "/",
    icon: Home
  },
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard
  },
  {
    name: "Products",
    href: "/admin/products",
    icon: Package
  },
  {
    name: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart
  },
  {
    name: "Customers",
    href: "/admin/customers",
    icon: Users
  },
  {
    name: "Brands",
    href: "/admin/brands",
    icon: Award
  },
  {
    name: "Banners",
    href: "/admin/banners",
    icon: ImageIcon
  },
  {
    name: "Categories",
    href: "/admin/categories",
    icon: TagsIcon
  },
  {
    name: "Promo Codes",
    href: "/admin/promo-codes",
    icon: Ticket
  },
  {
    name: "Branches",
    href: "/admin/branches",
    icon: MapIcon
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings
  }
];

interface AdminSidebarProps {
  user: {
    name: string;
    email: string;
  }
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await userService.logout();
      router.push('/');
      router.refresh();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error(`Failed to sign out: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r bg-gray-50/40">
      <div className="p-4">
        <h1 className="text-xl font-bold">Admin Panel</h1>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium",
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{user.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/account')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 
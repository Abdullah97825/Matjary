'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, 
  ShoppingCart, 
  Users, 
  Tag,
  Clock,
  RefreshCcw
} from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/utils/format";
import { OrderStatus } from "@prisma/client";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/types/order";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface DashboardData {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalCustomers: number;
  recentOrders: Array<{
    id: string;
    status: OrderStatus;
    items: Array<{
      id: string;
      quantity: number;
      price: string;
      product: {
        name: string;
        price: string;
      }
    }>;
  }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/admin/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const newData = await response.json();
      setData(newData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to refresh dashboard data');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const sections = [
    {
      title: "Products",
      icon: Package,
      href: "/admin/products",
      description: "Manage your product catalog",
      stat: data?.totalProducts,
      statLabel: "total products"
    },
    {
      title: "Orders",
      icon: ShoppingCart,
      href: "/admin/orders",
      description: "View and manage orders",
      stat: data?.totalOrders,
      statLabel: "total orders",
      highlight: data?.pendingOrders,
      highlightLabel: "pending"
    },
    {
      title: "Customers",
      icon: Users,
      href: "/admin/customers",
      description: "Customer management",
      stat: data?.totalCustomers,
      statLabel: "registered customers"
    },
    {
      title: "Categories",
      icon: Tag,
      href: "/admin/categories",
      description: "Manage product categories"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your admin dashboard
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchDashboardData}
          disabled={isRefreshing}
        >
          <RefreshCcw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {sections.map((section) => (
          <Link key={section.title} href={section.href}>
            <Card className="hover:bg-accent/5 transition-colors h-[180px]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {section.title}
                </CardTitle>
                <section.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="min-h-[80px]">
                  {section.stat !== undefined && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">{section.stat}</p>
                        <p className="text-xs text-muted-foreground">
                          {section.statLabel}
                        </p>
                      </div>
                      {section.highlight !== undefined && (
                        <div className="text-right">
                          <p className="text-sm font-medium text-orange-600">
                            {section.highlight}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {section.highlightLabel}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {section.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Order #{order.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.items.length} items - Total: {formatPrice(order.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0))}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Badge variant={ORDER_STATUS_COLORS[order.status]}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

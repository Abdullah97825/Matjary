import { Role, OrderStatus } from "@prisma/client";

interface CustomerAddress {
  id: string;
  country: string;
  province: string;
  city: string;
  neighbourhood: string;
  nearestLandmark: string;
  zipcode: string;
  isDefault: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  isActive: boolean;
  ordersCount: number;
  totalSpent: number;
}

export interface CustomerDetails extends Customer {
  addresses: CustomerAddress[];
  orders: Array<{
    id: string;
    orderNumber?: string;
    status: OrderStatus;
    createdAt: string;
    total: number;
  }>;
} 
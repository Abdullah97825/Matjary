import { OrderStatus, PaymentMethod as DbPaymentMethod } from "@prisma/client";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  ADMIN_PENDING: "Awaiting Review",
  CUSTOMER_PENDING: "Awaiting Customer Approval",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled"
} as const;

export const ORDER_STATUS_COLORS: Record<OrderStatus, "yellow" | "blue" | "green" | "destructive" | "orange"> = {
  PENDING: "yellow",
  ADMIN_PENDING: "orange",
  CUSTOMER_PENDING: "blue",
  ACCEPTED: "blue",
  COMPLETED: "green",
  REJECTED: "destructive",
  CANCELLED: "destructive"
} as const;

export type PaymentMethod = DbPaymentMethod;

export interface OrderWithAdminDiscount {
  adminDiscount?: number | null;
  adminDiscountReason?: string | null;
}
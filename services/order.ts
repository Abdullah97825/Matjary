import { OrderStatus } from "@prisma/client";

interface GetOrdersParams {
  search?: string;
  status?: OrderStatus;
  page?: number;
  per_page?: number;
}

interface OrdersResponse {
  data: Array<{
    id: string;
    orderNumber?: string;
    status: OrderStatus;
    createdAt: string;
    recipientName: string;
    shippingAddress: string;
    phone: string;
    savings: number;
    items: Array<{
      id: string;
      quantity: number;
      price: number;
      product: {
        name: string;
        price: number;
      };
    }>;
    user: {
      name: string;
      email: string;
    };
  }>;
  meta: {
    total: number;
    page: number;
    per_page: number;
  };
}

// For customer orders
interface CustomerOrdersResponse {
  orders: Array<{
    id: string;
    orderNumber?: string;
    status: OrderStatus;
    recipientName: string;
    phone: string;
    shippingAddress: string;
    paymentMethod: string;
    totalItems: number;
    savings: number;
    createdAt: string;
    updatedAt: string;
  }>;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export const orderService = {
  getAll: async (params: GetOrdersParams = {}): Promise<OrdersResponse> => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.status) searchParams.set('status', params.status);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.per_page) searchParams.set('per_page', params.per_page.toString());

    const response = await fetch(`/api/admin/orders?${searchParams.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    return response.json();
  },

  // Get customer's orders with pagination and optional filtering
  getCustomerOrders: async ({
    page = 1,
    per_page = 10,
    status
  }: {
    page?: number;
    per_page?: number;
    status?: OrderStatus;
  } = {}): Promise<CustomerOrdersResponse> => {
    const searchParams = new URLSearchParams();
    searchParams.set('page', page.toString());
    searchParams.set('per_page', per_page.toString());
    if (status) searchParams.set('status', status);

    const response = await fetch(`/api/orders?${searchParams.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    return response.json();
  },

  getAdminOrder: async (id: string) => {
    const response = await fetch(`/api/admin/orders/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch order');
    }
    return response.json();
  },

  updateOrderStatus: async (id: string, status: OrderStatus) => {
    const response = await fetch(`/api/admin/orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      throw new Error('Failed to update order status');
    }
    return response.json();
  },

  updateOrderItem: async (orderId: string, itemId: string, data: {
    quantity?: number;
    quantityNote?: string;
    price?: number;
    priceNote?: string;
  }) => {
    const response = await fetch(`/api/admin/orders/${orderId}/items/${itemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to update order item');
    }
    return response.json();
  },

  updateOrderBatch: async (
    orderId: string,
    data: {
      status?: OrderStatus;
      statusNote?: string;
      items?: Array<{
        id: string;
        quantity?: number;
        quantityNote?: string;
        price?: number;
        priceNote?: string;
      }>;
      newItems?: Array<{
        productId: string;
        quantity: number;
        price: number;
        priceNote?: string;
        quantityNote?: string;
      }>;
      removedItemIds?: string[];
    }
  ) => {
    const response = await fetch(`/api/admin/orders/${orderId}/update`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to update order');
    }
    return response.json();
  },

  getOrderHistory: async (orderId: string) => {
    // First try the customer-specific endpoint
    let response = await fetch(`/api/orders/${orderId}/history`);

    // If it fails (e.g., 404), fall back to the admin endpoint
    if (response.status === 404) {
      response = await fetch(`/api/admin/orders/${orderId}/history`);
    }

    if (!response.ok) {
      throw new Error('Failed to fetch order history');
    }

    const data = await response.json();
    return data.statusHistory || [];
  },

  // Customer-side order status update
  updateCustomerOrderStatus: async (orderId: string, status: 'PENDING' | 'REJECTED', note?: string) => {
    const response = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, note })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update order status');
    }
    return response.json();
  },

  // Customer-side order items management
  updateCustomerOrderItems: async (
    orderId: string,
    data: {
      items?: Array<{
        id: string;
        quantity?: number;
        removed?: boolean;
      }>;
      newItems?: Array<{
        productId: string;
        quantity: number;
      }>;
      submitForReview?: boolean;
      acceptChanges?: boolean;
      note?: string;
    }
  ) => {
    const response = await fetch(`/api/orders/${orderId}/items`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update order items');
    }
    const responseData = await response.json();
    return responseData;
  },

  cancelOrderWithStockOption: async (
    orderId: string,
    restoreStock: boolean,
    note?: string
  ) => {
    const response = await fetch(`/api/admin/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ restoreStock, note })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to cancel order');
    }
    return response.json();
  },

  searchProducts: async (query: string) => {
    const response = await fetch(`/api/products?search=${encodeURIComponent(query)}&per_page=20`);

    if (!response.ok) {
      throw new Error('Failed to search products');
    }
    return response.json();
  },

  // Add discount to an order
  updateOrderDiscount: async (
    orderId: string,
    data: {
      adminDiscount: number;
      adminDiscountReason: string;
    }
  ) => {
    const response = await fetch(`/api/admin/orders/${orderId}/update`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update discount');
    }

    return response.json();
  },

  // Remove discount from an order
  removeOrderDiscount: async (orderId: string) => {
    return orderService.updateOrderDiscount(orderId, {
      adminDiscount: 0,
      adminDiscountReason: '',
    });
  },

  // Add promo code to an order (admin)
  applyOrderPromoCode: async (orderId: string, code: string) => {
    const response = await fetch(`/api/admin/orders/${orderId}/apply-promo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to apply promo code');
    }

    return response.json();
  },

  // Remove promo code from an order (admin)
  removeOrderPromoCode: async (orderId: string) => {
    const response = await fetch(`/api/admin/orders/${orderId}/remove-promo`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove promo code');
    }

    return response.json();
  },

  // Change promo code on an order (admin) - replaces existing promo code with a new one
  changeOrderPromoCode: async (orderId: string, code: string) => {
    const response = await fetch(`/api/admin/orders/${orderId}/change-promo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to change promo code');
    }

    return response.json();
  }
};

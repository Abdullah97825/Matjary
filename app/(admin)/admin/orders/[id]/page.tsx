'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { OrderStatus, DiscountType } from '@prisma/client'
import { orderService } from '@/services/order'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { ArrowLeft, Save, Check, X, ArrowRight, Plus, Trash2 } from 'lucide-react'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PaymentMethod } from '@/types/order'
import { formatPrice } from '@/utils/format'
import { getOriginalValue, getOriginalNote, getValidStatusTransitions } from '@/utils/order'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { StatusHistory } from '@/components/order/statusHistory'
import { AddProductDialog } from '@/components/admin/AddProductDialog'
import { OrderReviewSection } from '@/components/order/OrderReviewSection'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AdminDiscountEditor } from '@/components/admin/AdminDiscountEditor'
import { PromoCodeEditor } from '@/components/admin/PromoCodeEditor'
import { OrderDiscountSummary } from '@/components/admin/OrderDiscountSummary'

// Type definition for order status actions
interface OrderStatusAction {
  status: string
  label: string
  color: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  icon: React.ReactNode
  className?: string
  specialAction?: boolean; // Flag for actions that need special handling
}

// Type definition for order status history
interface OrderHistoryItem {
  id: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  note?: string;
  createdAt: string;
  createdBy: {
    name: string;
    role?: string;
  };
}

interface Order {
  id: string
  status: OrderStatus
  createdAt: string
  recipientName: string
  shippingAddress: string
  phone: string
  paymentMethod: PaymentMethod
  savings: number
  itemsEdited: boolean
  adminDiscount: number | null
  adminDiscountReason: string | null
  promoCodeId: string | null
  promoDiscount: number | null
  promoCode?: {
    id: string
    code: string
    discountType: DiscountType
    discountPercent: number | null
    discountAmount: number | null
    isActive: boolean
  } | null
  items: Array<{
    id: string
    quantity: number
    price: number
    priceEdited: boolean
    quantityEdited: boolean
    originalValues?: string
    product: {
      id: string
      name: string
      price: number
      negotiablePrice?: boolean
      hidePrice?: boolean
    }
  }>
  user: {
    name: string
    email: string
  }
}

interface OrderItemForm {
  id: string
  quantity: number
  quantityNote: string
  price: number
  priceNote: string
  modified: boolean
  isNew?: boolean
  productId?: string
  productName?: string
  productImage?: string
}


export default function AdminOrderDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [itemForms, setItemForms] = useState<OrderItemForm[]>([])
  const [removedItemIds, setRemovedItemIds] = useState<string[]>([])
  const [statusNote, setStatusNote] = useState('')
  const [statusHistory, setStatusHistory] = useState<OrderHistoryItem[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false)
  const [itemToRemove, setItemToRemove] = useState<{ id: string, name: string, isNew: boolean } | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [restoreStock, setRestoreStock] = useState(true)

  useEffect(() => {
    fetchOrder()
  }, [id])

  useEffect(() => {
    if (order) {
      fetchOrderHistory()
      // Initialize form items from order data
      setItemForms(order.items.map(item => {
        return {
          id: item.id,
          quantity: item.quantity,
          quantityNote: getOriginalNote(item.originalValues, 'quantity') || '',
          price: Number(item.price),
          priceNote: getOriginalNote(item.originalValues, 'price') || '',
          modified: false
        }
      }))
      setRemovedItemIds([]) // Reset removed items when order changes
    }
  }, [order])

  const fetchOrder = async () => {
    try {
      const data = await orderService.getAdminOrder(id as string)
      setOrder(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch order')
      router.push('/admin/orders')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchOrderHistory = async () => {
    if (!order) return

    setIsLoadingHistory(true)
    try {
      const history = await orderService.getOrderHistory(order.id)
      setStatusHistory(history)
    } catch (error) {
      console.error('Failed to fetch order history:', error)
      // Don't show a toast for this as it's not critical
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const updateItemForm = (index: number, field: keyof OrderItemForm, value: string | number) => {
    setItemForms(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        [field]: value,
        modified: true
      }
      return updated
    })
  }

  const handleAddItem = (product: {
    id: string;
    name: string;
    price: number;
    thumbnail?: {
      url: string;
    };
    negotiablePrice?: boolean;
    hidePrice?: boolean;
  }, quantity: number) => {
    // Check if the product is already in the order
    const existingItemIndex = itemForms.findIndex(item => {
      // Check existing items in the form
      if (item.productId) {
        return item.productId === product.id;
      }
      // Check for regular order items that already existed
      const existingItem = order?.items.find(orderItem => orderItem.product.id === product.id);
      return existingItem && existingItem.id === item.id;
    });

    if (existingItemIndex !== -1) {
      // Product already exists, increase quantity by the selected amount
      updateItemForm(
        existingItemIndex,
        'quantity',
        itemForms[existingItemIndex].quantity + quantity
      );
    } else {
      // Add new item to the form
      setItemForms(prev => [
        ...prev,
        {
          id: `temp-${Date.now()}`, // Temporary ID, will be replaced on save
          quantity: quantity,
          quantityNote: '',
          price: product.price,
          priceNote: '',
          modified: true,
          isNew: true,
          productId: product.id,
          productName: product.name,
          productImage: product.thumbnail?.url || ''
        }
      ]);
    }

    // Close the dialog
    setIsAddProductDialogOpen(false);
    toast.success(`${product.name} added to order`);
  };

  const confirmRemoveItem = (itemId: string, isNew: boolean = false) => {
    // Find the item name for the confirmation message
    const item = itemForms.find(item => item.id === itemId);
    if (!item) return;

    const name = item.isNew ? item.productName :
      order?.items.find(orderItem => orderItem.id === itemId)?.product.name || 'this item';

    setItemToRemove({ id: itemId, name: name || 'this item', isNew });
  }

  const handleRemoveItem = (itemId: string, isNew: boolean = false) => {
    if (isNew) {
      // For new items that haven't been saved yet, just remove from the form
      setItemForms(prev => prev.filter(item => item.id !== itemId))
    } else {
      // For existing items, mark as removed and remove from forms
      setRemovedItemIds(prev => [...prev, itemId])
      setItemForms(prev => prev.filter(item => item.id !== itemId))
    }

    // Clear the item to remove
    setItemToRemove(null);
  }

  const handleUpdateOrder = async () => {
    if (!order) return;

    // Filter to only modified existing items
    const modifiedItems = itemForms.filter(item => item.modified && !item.isNew);

    // Extract new items
    const newItems = itemForms
      .filter(item => item.isNew)
      .map(item => ({
        productId: item.productId as string,
        quantity: item.quantity,
        price: item.price,
        priceNote: item.priceNote,
        quantityNote: item.quantityNote
      }));

    if (modifiedItems.length === 0 && newItems.length === 0 && removedItemIds.length === 0 && !statusNote) {
      toast.error('No changes to save');
      return;
    }

    setIsUpdating(true);
    try {
      const updatedItems = modifiedItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        quantityNote: item.quantityNote,
        price: item.price,
        priceNote: item.priceNote
      }));

      await orderService.updateOrderBatch(order.id, {
        items: updatedItems.length > 0 ? updatedItems : undefined,
        newItems: newItems.length > 0 ? newItems : undefined,
        removedItemIds: removedItemIds.length > 0 ? removedItemIds : undefined,
        statusNote: statusNote || undefined
      });

      toast.success('Order updated successfully');
      fetchOrder(); // Refresh the order data
      setItemForms([]); // Reset forms and refetch order fresh
      setRemovedItemIds([]); // Reset removed items
      setStatusNote('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update order');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return

    // Special handling for cancellation
    if (newStatus === 'CANCELLED' && order.status === 'ACCEPTED') {
      setShowCancelDialog(true)
      return
    }

    setIsUpdating(true)
    try {
      await orderService.updateOrderBatch(order.id, {
        status: newStatus,
        statusNote
      })

      setOrder({ ...order, status: newStatus })
      toast.success(`Order status updated to ${ORDER_STATUS_LABELS[newStatus]}`)
      setStatusNote('')
    } catch (error) {
      if (error instanceof Error && error.message.includes("Insufficient stock")) {
        toast.error(error.message);
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to update order status');
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!order) return

    setIsUpdating(true)
    try {
      await orderService.cancelOrderWithStockOption(order.id, restoreStock, statusNote)

      setOrder({ ...order, status: 'CANCELLED' })
      toast.success(`Order cancelled successfully${restoreStock ? ' and stock has been restored' : ''}`)
      setStatusNote('')
      setShowCancelDialog(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel order')
    } finally {
      setIsUpdating(false)
    }
  }

  // Helper to get available status transitions
  const getAvailableActions = (status: OrderStatus): OrderStatusAction[] => {
    const validTransitions = getValidStatusTransitions(status, 'ADMIN');

    // Check if any items have been modified in the current session
    const hasModifiedItems = itemForms.some(item => item.modified);

    // Check if the order has previously edited items from the database
    const hasEditedItems = order?.itemsEdited || false;

    // If we're in PENDING status and items have been modified or were previously edited, 
    // we should only allow sending quote to customer
    if (status === 'PENDING' && (hasModifiedItems || hasEditedItems)) {
      const acceptedIndex = validTransitions.indexOf('ACCEPTED');
      if (acceptedIndex !== -1) {
        validTransitions.splice(acceptedIndex, 1);
      }
    }

    const allPossibleActions: Record<OrderStatus, OrderStatusAction[]> = {
      'PENDING': [
        { status: 'ACCEPTED', label: 'Accept Order', color: 'default', icon: <Check className="mr-2 h-4 w-4" />, className: "font-medium px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white" },
        { status: 'CUSTOMER_PENDING', label: 'Send Quote to Customer', color: 'default', icon: <ArrowRight className="mr-2 h-5 w-5" />, className: "font-medium px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white" },
        { status: 'REJECTED', label: 'Reject Order', color: 'destructive', icon: <X className="mr-2 h-4 w-4" />, className: "font-medium px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white" },
      ],
      'ADMIN_PENDING': [
        { status: 'ACCEPTED', label: 'Accept Order', color: 'default', icon: <Check className="mr-2 h-4 w-4" />, className: "font-medium px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white" },
        { status: 'CUSTOMER_PENDING', label: 'Send Quote to Customer', color: 'default', icon: <ArrowRight className="mr-2 h-5 w-5" />, className: "font-medium px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white" },
        { status: 'REJECTED', label: 'Reject Order', color: 'destructive', icon: <X className="mr-2 h-4 w-4" />, className: "font-medium px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white" },
      ],
      'CUSTOMER_PENDING': [
        { status: 'REJECTED', label: 'Reject Order', color: 'destructive', icon: <X className="mr-2 h-4 w-4" />, className: "font-medium px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white" },
      ],
      'ACCEPTED': [
        { status: 'COMPLETED', label: 'Mark as Completed', color: 'default', icon: <Check className="mr-2 h-4 w-4" />, className: "font-medium px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white" },
        { status: 'CANCELLED', label: 'Cancel Order', color: 'destructive', icon: <X className="mr-2 h-4 w-4" />, className: "font-medium px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white", specialAction: true },
      ],
      'COMPLETED': [],
      'REJECTED': [],
      'CANCELLED': [],
    } as const;

    // Filter available actions to only include valid transitions
    return (allPossibleActions[status] || [])
      .filter(action => validTransitions.includes(action.status));
  }

  if (isLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!order) return null

  const availableActions = getAvailableActions(order.status)

  // Calculate total price
  const totalBeforeDiscounts = order.items.reduce((total, item) => {
    return total + (Number(item.price) * item.quantity);
  }, 0);

  // Subtract admin discount if any
  const adminDiscountAmount = order.adminDiscount ? Number(order.adminDiscount) : 0;

  // Calculate promo discount
  let promoDiscountAmount = order.promoDiscount ? Number(order.promoDiscount) : 0;

  // If there's a promo code but the discount is 0, recalculate it
  if (order.promoCode && promoDiscountAmount === 0) {
    const { discountType, discountPercent, discountAmount } = order.promoCode;

    // Recalculate based on the promo code details
    if (discountType === 'FLAT' && discountAmount) {
      promoDiscountAmount = Number(discountAmount);
    } else if (discountType === 'PERCENTAGE' && discountPercent) {
      promoDiscountAmount = (totalBeforeDiscounts * Number(discountPercent)) / 100;
    } else if (discountType === 'BOTH' && discountAmount && discountPercent) {
      const percentDiscount = (totalBeforeDiscounts * Number(discountPercent)) / 100;
      promoDiscountAmount = Number(discountAmount) + percentDiscount;
    }
  }

  // Round the discount to 2 decimal places to avoid floating point issues
  promoDiscountAmount = Math.round(promoDiscountAmount * 100) / 100;

  // Final total price
  const totalPrice = totalBeforeDiscounts - adminDiscountAmount - promoDiscountAmount;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/orders')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
            <h1 className="text-2xl font-bold">Order #{order.id.substring(0, 8)}</h1>
            <Badge variant={ORDER_STATUS_COLORS[order.status]} className="px-3 py-1">
              {ORDER_STATUS_LABELS[order.status]}
            </Badge>
          </div>
          <div className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleString()}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer and Shipping Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Name</h3>
                  <p>{order.user.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Email</h3>
                  <p>{order.user.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Phone</h3>
                  <p>{order.phone}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shipping Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Recipient</h3>
                  <p>{order.recipientName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Address</h3>
                  <p className="whitespace-pre-wrap">{order.shippingAddress}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Payment Method</h3>
                  <div className="mt-1">
                    {order.paymentMethod === 'PENDING' ? (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-800 hover:bg-yellow-50">Payment Pending</Badge>
                    ) : (
                      <span className="font-medium">
                        {order.paymentMethod === 'CASH' ? 'Cash on Delivery' : order.paymentMethod}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Items and Actions Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
                <CardDescription>
                  {order.status === 'PENDING' || order.status === 'ADMIN_PENDING'
                    ? 'You can adjust prices and quantities or add new items to this order.'
                    : 'Order items cannot be edited in the current status.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Item Button - only show when order can be edited */}
                {(order.status === 'PENDING' || order.status === 'ADMIN_PENDING') && (
                  <Button
                    onClick={() => setIsAddProductDialogOpen(true)}
                    className="mb-4"
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item to Order
                  </Button>
                )}

                {itemForms.map((itemForm, index) => {
                  // Get the corresponding order item for existing items
                  const orderItem = !itemForm.isNew
                    ? order.items.find(item => item.id === itemForm.id)!
                    : null;

                  return (
                    <div key={itemForm.id} className="rounded-lg border p-4 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          {/* For existing items, show product name from order */}
                          {orderItem ? (
                            <h3 className="font-medium">{orderItem.product.name}</h3>
                          ) : (
                            <h3 className="font-medium">{itemForm.productName} <Badge variant="outline" className="ml-2 bg-blue-50">New</Badge></h3>
                          )}
                          <div className="flex gap-2 mt-1">
                            {orderItem?.product.negotiablePrice && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-md font-medium">
                                Negotiable
                              </span>
                            )}
                            {orderItem?.product.hidePrice && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-medium">
                                Hidden Price
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-lg font-semibold">
                            {formatPrice(itemForm.price * itemForm.quantity)}
                          </div>
                          {(order.status === 'PENDING' || order.status === 'ADMIN_PENDING') && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => confirmRemoveItem(itemForm.id, itemForm.isNew)}
                              title="Remove item"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Price row - input and note on same row */}
                        <div className="flex gap-4 items-start">
                          <div className="w-1/3">
                            <Label htmlFor={`price-${itemForm.id}`}>Price</Label>
                            <div className="relative">
                              <Input
                                id={`price-${itemForm.id}`}
                                type="number"
                                value={itemForm.price}
                                onChange={(e) => updateItemForm(index, 'price', parseFloat(e.target.value))}
                                step="0.01"
                                min="0"
                                className={itemForm.modified ? "border-blue-500" : ""}
                                disabled={order.status !== 'PENDING' && order.status !== 'ADMIN_PENDING'}
                              />
                              {orderItem?.priceEdited && (
                                <div className="text-xs text-yellow-800 mt-1">
                                  Original: {formatPrice(getOriginalValue<number>(orderItem.originalValues, 'price', Number(orderItem.product.price)) || 0)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex-1">
                            <Label htmlFor={`price-note-${itemForm.id}`}>
                              Price Note <span className="text-xs text-gray-500">(customer visible)</span>
                            </Label>
                            <Textarea
                              id={`price-note-${itemForm.id}`}
                              value={itemForm.priceNote}
                              onChange={(e) => updateItemForm(index, 'priceNote', e.target.value)}
                              placeholder="Explain price changes to the customer..."
                              className={itemForm.modified ? "border-blue-500" : ""}
                              disabled={order.status !== 'PENDING' && order.status !== 'ADMIN_PENDING'}
                            />
                          </div>
                        </div>

                        {/* Quantity row - input and note on same row */}
                        <div className="flex gap-4 items-start">
                          <div className="w-1/3">
                            <Label htmlFor={`quantity-${itemForm.id}`}>Quantity</Label>
                            <div className="relative">
                              <Input
                                id={`quantity-${itemForm.id}`}
                                type="number"
                                value={itemForm.quantity}
                                onChange={(e) => updateItemForm(index, 'quantity', parseInt(e.target.value))}
                                min="1"
                                step="1"
                                className={itemForm.modified ? "border-blue-500" : ""}
                                disabled={order.status !== 'PENDING' && order.status !== 'ADMIN_PENDING'}
                              />
                              {orderItem?.quantityEdited && (
                                <div className="text-xs text-yellow-800 mt-1">
                                  Original: {getOriginalValue(orderItem.originalValues, 'quantity', '(unknown)')}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex-1">
                            <Label htmlFor={`quantity-note-${itemForm.id}`}>
                              Quantity Note <span className="text-xs text-gray-500">(customer visible)</span>
                            </Label>
                            <Textarea
                              id={`quantity-note-${itemForm.id}`}
                              value={itemForm.quantityNote}
                              onChange={(e) => updateItemForm(index, 'quantityNote', e.target.value)}
                              placeholder="Explain quantity changes to the customer..."
                              className={itemForm.modified ? "border-blue-500" : ""}
                              disabled={order.status !== 'PENDING' && order.status !== 'ADMIN_PENDING'}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <div className="text-sm text-gray-500">
                  <p>See the complete order summary below for all discounts and final total.</p>
                </div>
                <Button
                  onClick={handleUpdateOrder}
                  disabled={isUpdating ||
                    (itemForms.every(item => !item.modified) && removedItemIds.length === 0) ||
                    (order.status !== 'PENDING' && order.status !== 'ADMIN_PENDING')}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>

            {/* Add the consolidated order summary */}
            <div className="mt-6 mb-6">
              <OrderDiscountSummary
                subtotal={totalBeforeDiscounts}
                adminDiscount={adminDiscountAmount}
                promoDiscount={promoDiscountAmount}
                finalTotal={totalPrice}
                promoCode={order.promoCode?.code}
              />
            </div>

            {/* Admin Discount Editor - Moved here for better UX */}
            {(order.status === 'PENDING' || order.status === 'ADMIN_PENDING') && (
              <AdminDiscountEditor
                orderId={order.id}
                originalTotal={totalBeforeDiscounts - adminDiscountAmount}
                currentDiscount={order.adminDiscount ? Number(order.adminDiscount) : null}
                currentReason={order.adminDiscountReason}
                onDiscountApplied={() => fetchOrder()}
              />
            )}

            {/* Promo Code Editor */}
            {(order.status === 'PENDING' || order.status === 'ADMIN_PENDING') && (
              <PromoCodeEditor
                orderId={order.id}
                originalTotal={totalBeforeDiscounts - adminDiscountAmount}
                currentPromoCode={order.promoCode ? {
                  id: order.promoCode.id,
                  code: order.promoCode.code,
                  discountAmount: promoDiscountAmount,
                  discountType: order.promoCode.discountType,
                  discountPercent: order.promoCode.discountPercent ?? undefined,
                  discountValue: order.promoCode.discountAmount ? Number(order.promoCode.discountAmount) : undefined
                } : null}
                onPromoCodeApplied={() => fetchOrder()}
              />
            )}

            <Card>
              <CardHeader>
                <CardTitle>Order Status Actions</CardTitle>
                <CardDescription>
                  Update the order status based on your review.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status-note">
                    Status Change Note <span className="text-xs text-gray-500">(customer visible)</span>
                  </Label>
                  <Textarea
                    id="status-note"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Add a note to explain the status change..."
                    className="mb-4"
                  />
                </div>

                {(itemForms.some(item => item.modified) || removedItemIds.length > 0) && (
                  <div className="bg-yellow-50 p-4 rounded-md mb-4">
                    <h3 className="text-sm font-medium text-yellow-800">Unsaved Changes</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Save your changes to the order items before updating the order status.
                    </p>
                  </div>
                )}

                {order.status === 'ADMIN_PENDING' && (
                  <div className="bg-yellow-50 p-4 rounded-md mb-4">
                    <h3 className="text-sm font-medium text-yellow-800">Order Requires Review</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      This order contains items with special pricing. Review and update the prices before proceeding.
                      {(itemForms.some(item => item.modified) || removedItemIds.length > 0) || (order.itemsEdited) ? (
                        <span> Since you&apos;ve modified items, <b>you must send the quote to the customer for approval.</b></span>
                      ) : (
                        <span> If you don&apos;t modify any items, <b>you can directly accept the order without customer approval.</b></span>
                      )}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {(order.status === 'ADMIN_PENDING'
                    ? [...availableActions].reverse() // Put Send Quote button first 
                    : availableActions
                  ).map((action) => (
                    <Button
                      key={action.status}
                      variant={action.color as "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"}
                      onClick={() => handleStatusChange(action.status as OrderStatus)}
                      disabled={isUpdating || itemForms.some(item => item.modified) || removedItemIds.length > 0 || (action.status === 'ACCEPTED' && order.itemsEdited)}
                      className={action.className}
                    >
                      {action.icon}
                      {action.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Add Status History Component */}
            <StatusHistory
              history={statusHistory}
              isLoading={isLoadingHistory}
            />

            {/* Order Review Section */}
            <OrderReviewSection
              orderId={order.id}
              isCompleted={order.status === 'COMPLETED'}
              isAdmin={true}
            />
          </div>
        </div>
      </div>

      {/* Remove Item Confirmation Dialog */}
      <AlertDialog
        open={!!itemToRemove}
        onOpenChange={(open) => {
          if (!open) setItemToRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {itemToRemove?.name} from this order?
              {!itemToRemove?.isNew && " This cannot be undone after saving."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                if (itemToRemove) handleRemoveItem(itemToRemove.id, itemToRemove.isNew);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Order Dialog */}
      <AlertDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to restore the stock for this order when cancelling?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="restore-stock"
                checked={restoreStock}
                onChange={(e) => setRestoreStock(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="restore-stock" className="text-sm font-medium text-gray-700">
                Restore product quantities to stock
              </label>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {restoreStock
                ? "Items from this order will be added back to inventory."
                : "Inventory levels will remain unchanged."}
            </p>
            <div className="mt-4">
              <label htmlFor="cancel-note" className="block text-sm font-medium text-gray-700">
                Cancellation Note (optional)
              </label>
              <textarea
                id="cancel-note"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleCancelOrder}
              disabled={isUpdating}
            >
              {isUpdating ? "Processing..." : "Cancel Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Product Dialog */}
      <AddProductDialog
        isOpen={isAddProductDialogOpen}
        onClose={() => setIsAddProductDialogOpen(false)}
        onAddItem={handleAddItem}
        existingProductIds={[
          ...order?.items.map(item => item.product.id) || [],
          ...itemForms.filter(item => item.isNew).map(item => item.productId as string)
        ]}
      />
    </div>
  )
} 
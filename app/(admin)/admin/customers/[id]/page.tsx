'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { CustomerDetails } from "@/types/customer"
import { customerService } from "@/services/customer"
import { formatPrice } from "@/utils/format"
import { Badge } from "@/components/ui/badge"
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/types/order"
import { OrderStatus } from "@prisma/client"
import Link from "next/link"

export default function CustomerDetailsPage() {
  const router = useRouter()
  const { id } = useParams()
  const [customer, setCustomer] = useState<CustomerDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const data = await customerService.getById(id as string)
        setCustomer(data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCustomer()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!customer) return null

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/admin/customers')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Customers
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Name</div>
              <div>{customer.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div>{customer.email}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Phone</div>
              <div>{customer.phone}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Member Since</div>
              <div>{new Date(customer.createdAt).toLocaleDateString()}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Total Orders</div>
              <div>{customer.ordersCount}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Spent</div>
              <div>{formatPrice(customer.totalSpent)}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Addresses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer.addresses.map((address) => (
              <div
                key={address.id}
                className="flex flex-col space-y-2 border-b pb-4 last:border-0 last:pb-0"
              >
                {address.isDefault && (
                  <Badge variant="secondary" className="w-fit">Default</Badge>
                )}
                <div>
                  <div className="font-medium">{address.country}</div>
                  <div className="text-sm text-muted-foreground">
                    {address.province}, {address.city}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {address.neighbourhood}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Near {address.nearestLandmark}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {address.zipcode}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customer.orders.length > 0 ? (
                customer.orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="block transition-colors hover:bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center justify-between border-b p-4 last:border-0">
                      <div>
                        <div className="font-medium">Order #{order.orderNumber || order.id}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={ORDER_STATUS_COLORS[order.status as OrderStatus]}>
                          {ORDER_STATUS_LABELS[order.status as OrderStatus]}
                        </Badge>
                        <div className="font-medium">{formatPrice(order.total)}</div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  This customer has not placed any orders yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
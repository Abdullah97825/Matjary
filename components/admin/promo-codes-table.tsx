'use client'

import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { PromoCodeWithDetails } from "@/types/promo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, RefreshCw } from "lucide-react"
import { formatPrice } from "@/utils/format"
import { PaginationState } from "@/types/pagination"

interface AdminPromoCodesTableProps {
    promoCodes: PromoCodeWithDetails[]
    isLoading?: boolean
    pagination: PaginationState
    onPaginationChange: (pagination: PaginationState) => void
    onRefresh: () => void
}

export function AdminPromoCodesTable({
    promoCodes,
    isLoading,
    pagination,
    onPaginationChange,
    onRefresh
}: AdminPromoCodesTableProps) {
    const router = useRouter()

    const columns: ColumnDef<PromoCodeWithDetails>[] = [
        {
            accessorKey: "code",
            header: "Code",
        },
        {
            accessorKey: "discountType",
            header: "Discount",
            cell: ({ row }) => {
                const discountType = row.getValue("discountType") as string
                const discountAmount = row.original.discountAmount
                const discountPercent = row.original.discountPercent

                if (discountType === 'NONE') {
                    return <span className="text-muted-foreground">No discount</span>
                }

                return (
                    <div className="space-y-1">
                        {(discountType === 'FLAT' || discountType === 'BOTH') && discountAmount && (
                            <Badge variant="outline">{formatPrice(discountAmount)}</Badge>
                        )}
                        {(discountType === 'PERCENTAGE' || discountType === 'BOTH') && discountPercent && (
                            <Badge variant="outline">{discountPercent}%</Badge>
                        )}
                    </div>
                )
            }
        },
        {
            accessorKey: "isActive",
            header: "Status",
            cell: ({ row }) => {
                const isActive = row.getValue("isActive") as boolean
                return (
                    <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? "Active" : "Inactive"}
                    </Badge>
                )
            }
        },
        {
            accessorKey: "expiryDate",
            header: "Expiry",
            cell: ({ row }) => {
                const hasExpiryDate = row.original.hasExpiryDate
                const expiryDate = row.original.expiryDate

                if (!hasExpiryDate) {
                    return <span className="text-muted-foreground">No expiry</span>
                }

                if (expiryDate) {
                    const date = new Date(expiryDate)
                    return date.toLocaleDateString()
                }

                return <span className="text-muted-foreground">-</span>
            }
        },
        {
            accessorKey: "usedCount",
            header: "Uses",
            cell: ({ row }) => {
                const usedCount = row.getValue("usedCount") as number
                const maxUses = row.original.maxUses

                if (maxUses) {
                    return `${usedCount} / ${maxUses}`
                }

                return usedCount.toString()
            }
        },
        {
            accessorKey: "userAssignments",
            header: "Assigned Users",
            cell: ({ row }) => {
                const userAssignments = row.original.userAssignments

                if (!userAssignments || userAssignments.length === 0) {
                    return <span className="text-muted-foreground">Public</span>
                }

                return `${userAssignments.length} users`
            }
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/admin/promo-codes/${row.original.id}`)}
                >
                    View Details
                    <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            )
        }
    ]

    return (
        <div>
            <div className="mb-4 flex justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>Refreshing...</>
                    ) : (
                        <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </>
                    )}
                </Button>
            </div>
            <DataTable
                columns={columns}
                data={promoCodes}
                pagination={pagination}
                onPaginationChange={onPaginationChange}
                isLoading={isLoading}
            />
        </div>
    )
} 
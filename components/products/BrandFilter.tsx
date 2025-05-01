"use client";

import { BrandType } from '@/types/brand';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface BrandFilterProps {
    brands: BrandType[];
    selectedBrand?: string;
}

export function BrandFilter({ brands, selectedBrand }: BrandFilterProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const createQueryString = (name: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === null) {
            params.delete(name);
        } else {
            params.set(name, value);
        }
        return params.toString();
    };

    const handleBrandChange = (brandId: string) => {
        // Update URL without refresh
        const query = createQueryString('brand', brandId === 'all' ? null : brandId);
        router.push(`${pathname}?${query}`, { scroll: false });
    };

    return (
        <Select
            value={selectedBrand ?? 'all'}
            onValueChange={handleBrandChange}
        >
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
} 
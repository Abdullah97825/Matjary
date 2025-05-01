"use client";

import { CategoryType } from '@/types/products';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface CategoryFilterProps {
  categories: CategoryType[];
  selectedCategory?: string;
}

export function CategoryFilter({ categories, selectedCategory }: CategoryFilterProps) {
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

  const handleCategoryChange = (categoryId: string) => {
    // Update URL without refresh
    const query = createQueryString('category', categoryId === 'all' ? null : categoryId);
    router.push(`${pathname}?${query}`, { scroll: false });
  };

  return (
    <Select
      value={selectedCategory ?? 'all'}
      onValueChange={handleCategoryChange}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Categories</SelectItem>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 
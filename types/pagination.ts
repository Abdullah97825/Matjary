import { SerializedProduct } from './products';

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
} 
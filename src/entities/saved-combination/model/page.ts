import type { SavedCombination } from "./combination";

export const SAVED_COMBINATIONS_PAGE_SIZE = 10;

export type SavedCombinationsPage = {
  items: SavedCombination[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

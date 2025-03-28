"use client";

import * as React from "react";
import { type ColumnFiltersState, type Updater } from "@tanstack/react-table";
import { UseQueryStatesKeysMap } from "nuqs";

import { DataTableFilterField } from "@/types";

/**
 * Initialize column filters from query parameters
 */
export function useInitialColumnFilters(
  queryParams: Record<string, unknown>
): ColumnFiltersState {
  return React.useMemo(() => {
    return Object.entries(queryParams).reduce<ColumnFiltersState>(
      (filters, [key, value]) => {
        if (value !== null) {
          filters.push({
            id: key,
            value: Array.isArray(value) ? value : [value],
          });
        }
        return filters;
      },
      []
    );
  }, [queryParams]);
}

/**
 * Create a handler for column filter changes
 */
export function useColumnFiltersChangeHandler<TData>(
  setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>,
  debouncedSetFilterValues: (values: UseQueryStatesKeysMap<unknown>) => void,
  searchableColumns: DataTableFilterField<TData>[],
  filterableColumns: DataTableFilterField<TData>[]
) {
  return React.useCallback(
    (updaterOrValue: Updater<ColumnFiltersState>) => {
      setColumnFilters((prev) => {
        // Get the updated filters
        const next =
          typeof updaterOrValue === "function"
            ? updaterOrValue(prev)
            : updaterOrValue;

        // Format filter updates for query params
        const filterUpdates = next.reduce<
          Record<string, string | string[] | null>
        >((acc, filter) => {
          if (searchableColumns.find((col) => col.id === filter.id)) {
            // For search filters, use the value directly
            acc[filter.id] = filter.value as string;
          } else if (filterableColumns.find((col) => col.id === filter.id)) {
            // For faceted filters, use the array of values
            acc[filter.id] = filter.value as string[];
          }
          return acc;
        }, {});

        // Mark removed filters as null
        for (const prevFilter of prev) {
          if (!next.some((filter) => filter.id === prevFilter.id)) {
            filterUpdates[prevFilter.id] = null;
          }
        }

        // Update URL query params
        debouncedSetFilterValues(filterUpdates);
        return next;
      });
    },
    [debouncedSetFilterValues, filterableColumns, searchableColumns]
  );
}

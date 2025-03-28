"use client";

import * as React from "react";
import {
  type ColumnFiltersState,
  type PaginationState,
  type RowSelectionState,
  type TableOptions,
  type TableState,
  type Updater,
  type VisibilityState,
  createColumnHelper,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { SetValues, UseQueryStatesKeysMap, Values } from "nuqs";

import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { tableQueryParams } from "@/lib/table-utils";
import { DataTableFilterField } from "@/types";
import {
  useInitialColumnFilters,
  useColumnFiltersChangeHandler,
} from "@/hooks/use-data-table-utils";
import { Checkbox } from "@/components/ui/checkbox";

// ======================================================
// Type Definitions
// ======================================================

type TReturnTypeUseQueryStatesTable = [
  Values<UseQueryStatesKeysMap<unknown> & typeof tableQueryParams>,
  SetValues<UseQueryStatesKeysMap<unknown> & typeof tableQueryParams>
];

/**
 * Properties for configuring the DataTable hook
 */
interface UseDataTableProps<
  TData,
  TQueryParams extends TReturnTypeUseQueryStatesTable
> extends Omit<
      TableOptions<TData>,
      | "state"
      | "pageCount"
      | "getCoreRowModel"
      | "manualFiltering"
      | "manualPaginatio, tableQueryParamsn"
      | "manualSorting"
    >,
    Required<Pick<TableOptions<TData>, "pageCount">> {
  /**
   * Filter fields configuration for the table
   * @default []
   */
  filterFields?: DataTableFilterField<TData>[];

  /**
   * Debounce time (ms) for filter updates
   * @default 300
   */
  debounceMs?: number;

  /**
   * Enable row selection functionality
   * @default false
   */
  enableRowSelection?: boolean;

  /**
   * Initial state for the table
   */
  initialState?: Omit<Partial<TableState>, "sorting">;

  /**
   * URL query states for persistence
   */
  queryStates: TQueryParams;
}

// ======================================================
// Selection Types
// ======================================================

/**
 * Type for storing selection data with records and keys
 */
interface SelectionState<TData> {
  /**
   * Object mapping page indexes to row selection states
   */
  keys: Record<number, RowSelectionState>;

  /**
   * Object mapping page indexes to Maps of row IDs to their data
   */
  records: Record<number, Map<string, TData>>;
}

/**
 * Props for row selection checkboxes
 */
export interface SelectionCellProps {
  selectRow: {
    checked: boolean;
    disabled: boolean;
    indeterminate: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };
}

/**
 * Props for "Select All" header checkbox
 */
export interface SelectionHeaderProps {
  selectAll: {
    checked: boolean;
    indeterminate: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };
}

/**
 * Return type of the useDataTable hook
 */
interface UseDataTableReturn<TData> {
  /** Table instance */
  table: ReturnType<typeof useReactTable<TData>>;

  /** Selection state across all pages */
  selection: SelectionState<TData>;

  /** Handler for row selection changes */
  handleRowSelectionChange: (
    rowId: string,
    rowData: TData,
    isSelected: boolean
  ) => void;

  /** Get all selected records across pages */
  getAllSelectedRecords: () => TData[];

  /** Get count of selected records */
  getSelectedCount: () => number;
}

// ======================================================
// Main Hook
// ======================================================

/**
 * Hook for creating data tables with filtering, pagination, and row selection
 */
export function useDataTable<
  TData,
  TQueryParams extends TReturnTypeUseQueryStatesTable
>({
  pageCount = -1,
  filterFields = [],
  debounceMs = 300,
  initialState,
  queryStates,
  enableRowSelection = false,
  ...props
}: UseDataTableProps<TData, TQueryParams>): UseDataTableReturn<TData> {
  const [queryParams, setQueryParams] = queryStates;

  // ======================================================
  // State Management
  // ======================================================

  // Selection state
  const [selection, setSelection] = React.useState<SelectionState<TData>>({
    keys: { [queryParams.page]: initialState?.rowSelection || {} },
    records: { [queryParams.page]: new Map<string, TData>() },
  });

  // Column visibility
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialState?.columnVisibility ?? {});

  // Column filters
  const initialColumnFilters = useInitialColumnFilters(queryParams);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>(initialColumnFilters);

  // ======================================================
  // Pagination
  // ======================================================

  const pagination: PaginationState = {
    pageIndex: queryParams.page - 1,
    pageSize: queryParams.perPage,
  };

  // Handle pagination changes
  function onPaginationChange(updaterOrValue: Updater<PaginationState>) {
    const newPagination =
      typeof updaterOrValue === "function"
        ? updaterOrValue(pagination)
        : updaterOrValue;

    void setQueryParams((prev) => ({
      ...prev,
      page: newPagination.pageIndex + 1,
      perPage: newPagination.pageSize,
    }));
  }

  // ======================================================
  // Filtering
  // ======================================================

  // Filter debouncing
  const debouncedSetFilterValues = useDebouncedCallback(
    (values: UseQueryStatesKeysMap<unknown>) => {
      void setQueryParams({
        ...values,
        page: 1, // Reset to first page on filter change
      });
    },
    debounceMs
  );

  // Categorize filter fields
  const { searchableColumns, filterableColumns } = React.useMemo(
    () => ({
      searchableColumns: filterFields.filter((field) => !field.options),
      filterableColumns: filterFields.filter((field) => field.options),
    }),
    [filterFields]
  );

  // Handle column filter changes
  const onColumnFiltersChange = useColumnFiltersChangeHandler<TData>(
    setColumnFilters,
    debouncedSetFilterValues,
    searchableColumns,
    filterableColumns
  );

  // ======================================================
  // Row Selection
  // ======================================================

  // Handle individual row selection
  const handleRowSelectionChange = React.useCallback(
    (rowId: string, rowData: TData, isSelected: boolean) => {
      setSelection((prev) => {
        const pageIndex = pagination.pageIndex;
        const newRecords = { ...prev.records };

        // Initialize page records if not exists
        if (!newRecords[pageIndex]) {
          newRecords[pageIndex] = new Map<string, TData>();
        }

        const pageRecords = new Map(newRecords[pageIndex]);

        // Update record based on selection state
        if (isSelected) {
          pageRecords.set(rowId, rowData);
        } else {
          pageRecords.delete(rowId);
        }

        newRecords[pageIndex] = pageRecords;

        return {
          keys: prev.keys, // Keys are managed by the table
          records: newRecords,
        };
      });
    },
    [pagination.pageIndex]
  );

  // Handle row selection state changes (including "Select All")
  const onRowSelectionChange = React.useCallback(
    (updaterOrValue: Updater<RowSelectionState>) => {
      setSelection((prev) => {
        const pageIndex = pagination.pageIndex;

        // Create copies of state objects
        const newKeys = { ...prev.keys };
        const newRecords = { ...prev.records };

        // Initialize page data if not exists
        if (!newKeys[pageIndex]) {
          newKeys[pageIndex] = {};
        }
        if (!newRecords[pageIndex]) {
          newRecords[pageIndex] = new Map<string, TData>();
        }

        // Get the updated keys state for current page
        const updatedPageKeys =
          typeof updaterOrValue === "function"
            ? updaterOrValue(newKeys[pageIndex])
            : updaterOrValue;

        // Create a new page records map
        const pageRecords = new Map<string, TData>();

        // Update records based on selection state
        table.getRowModel().rows.forEach((row) => {
          if (updatedPageKeys[row.id]) {
            pageRecords.set(row.id, row.original);
          }
        });

        // Update state
        newKeys[pageIndex] = updatedPageKeys;
        newRecords[pageIndex] = pageRecords;

        return {
          keys: newKeys,
          records: newRecords,
        };
      });
    },
    [pagination.pageIndex]
  );

  // ======================================================
  // Column Configuration
  // ======================================================

  // Create selection column when enabled
  const columnHelper = createColumnHelper<TData>();
  const selectionColumn = React.useMemo(() => {
    if (!enableRowSelection) return [];

    return [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <div className="px-1">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              className="h-4 w-4"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="px-1">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => {
                row.toggleSelected(!!value);
                if (row.original) {
                  handleRowSelectionChange(row.id, row.original, !!value);
                }
              }}
              className="h-4 w-4"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      }),
    ];
  }, [enableRowSelection, columnHelper, handleRowSelectionChange]);

  // Combine selection column with provided columns
  const columns = React.useMemo(
    () => [
      ...(enableRowSelection ? selectionColumn : []),
      ...(props.columns || []),
    ],
    [enableRowSelection, selectionColumn, props.columns]
  );

  // ======================================================
  // Table Creation
  // ======================================================

  const table = useReactTable({
    ...props,
    columns,
    initialState,
    pageCount,
    state: {
      pagination,
      columnVisibility,
      rowSelection: selection.keys[pagination.pageIndex] || {},
      columnFilters,
    },
    enableRowSelection,
    onRowSelectionChange,
    onPaginationChange,
    onColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  // ======================================================
  // Selection Utilities
  // ======================================================

  // Get all selected records across pages
  const getAllSelectedRecords = React.useCallback(() => {
    const allRecords: TData[] = [];
    Object.values(selection.records).forEach((pageMap) => {
      pageMap.forEach((record) => allRecords.push(record));
    });
    return allRecords;
  }, [selection.records]);

  // Get count of selected records
  const getSelectedCount = React.useCallback(() => {
    let count = 0;
    Object.values(selection.records).forEach((pageMap) => {
      count += pageMap.size;
    });
    return count;
  }, [selection.records]);

  return {
    table,
    selection,
    handleRowSelectionChange,
    getAllSelectedRecords,
    getSelectedCount,
  };
}

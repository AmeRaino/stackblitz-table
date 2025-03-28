"use client";

import React from "react";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { ColumnDef } from "@tanstack/react-table";

//

import { DataTable } from "@/components/data-table/data-table";
import { Spin } from "@/components/ui/spin";
import { useDataTable } from "@/hooks/use-data-table";
import { fetchData, Person, tableQueryParams } from "@/lib/table-utils";
import { useQueryStates } from "nuqs";

export default function App() {
  const [queryParams, setQueryParams] = useQueryStates(tableQueryParams);

  const columns = React.useMemo<ColumnDef<Person>[]>(
    () => [
      {
        accessorKey: "firstName",
        cell: (info) => info.getValue(),
        footer: (props) => props.column.id,
      },
      {
        accessorFn: (row) => row.lastName,
        id: "lastName",
        cell: (info) => info.getValue(),
        header: () => <span>Last Name</span>,
        footer: (props) => props.column.id,
      },
      {
        accessorKey: "visits",
        header: () => <span>Visits</span>,
        footer: (props) => props.column.id,
      },
      {
        accessorKey: "status",
        header: "Status",
        footer: (props) => props.column.id,
      },
      {
        accessorKey: "progress",
        header: "Profile Progress",
        footer: (props) => props.column.id,
      },
    ],
    []
  );

  const dataQuery = useQuery({
    queryKey: ["data", queryParams],
    queryFn: () =>
      fetchData({
        pageIndex: queryParams.page,
        pageSize: queryParams.perPage,
      }),
    placeholderData: keepPreviousData,
  });

  const defaultData = React.useMemo(() => [], []);

  const { table } = useDataTable({
    enableRowSelection: true,
    queryStates: [queryParams, setQueryParams],
    data: dataQuery.data?.rows || defaultData,
    columns,
    pageCount: dataQuery.data?.pageCount || 0,
    getRowId: (row) => row.id,
  });

  return (
    <div className="p-20 space-y-4">
      <Spin spinning={dataQuery.isFetching}>
        <DataTable table={table} />
      </Spin>
    </div>
  );
}

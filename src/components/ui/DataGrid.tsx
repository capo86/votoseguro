import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

interface DataGridProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  emptyMessage: string;
  getRowKey: (row: TData) => string;
  isLoading?: boolean;
  loadingMessage: string;
  renderMobileCard: (row: TData) => ReactNode;
}

function DataGrid<TData>({
  columns,
  data,
  emptyMessage,
  getRowKey,
  isLoading = false,
  loadingMessage,
  renderMobileCard,
}: DataGridProps<TData>) {
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="inline-flex min-h-20 items-center gap-3 rounded-panel border border-neutral-200 bg-white/70 p-4 font-body font-black text-brand-ink dark:border-brand-line dark:bg-black/[0.16] dark:text-white">
        <Loader2 aria-hidden="true" className="animate-spin text-brand-orange" size={22} />
        {loadingMessage}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-panel border border-neutral-200 bg-white/70 p-4 font-body font-black text-neutral-600 dark:border-brand-line dark:bg-black/[0.16] dark:text-orange-50/70">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 lg:hidden">
        {data.map((row) => (
          <div key={getRowKey(row)}>{renderMobileCard(row)}</div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-panel border border-neutral-200 bg-white/75 dark:border-brand-line dark:bg-black/[0.16] lg:block">
        <table className="min-w-full border-collapse text-left font-body text-sm">
          <thead className="bg-neutral-100 text-[0.68rem] font-black uppercase text-neutral-500 dark:bg-white/[0.05] dark:text-orange-100/[0.58]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    className="border-b border-neutral-200 px-4 py-3 dark:border-brand-line"
                    key={header.id}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                className="border-b border-neutral-200 last:border-0 dark:border-brand-line"
                key={row.id}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    className="px-4 py-3 align-top font-semibold text-neutral-700 dark:text-orange-50/80"
                    key={cell.id}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default DataGrid;

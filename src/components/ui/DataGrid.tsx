import {
  getPaginationRowModel,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnFiltersState,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

const DEFAULT_PAGE_SIZE = 25;
const EMPTY_COLUMN_FILTERS: ColumnFiltersState = [];

interface DataGridProps<TData> {
  columnFilters?: ColumnFiltersState;
  columns: ColumnDef<TData>[];
  data: TData[];
  emptyMessage: string;
  getRowKey: (row: TData) => string;
  isLoading?: boolean;
  loadingMessage: string;
  renderMobileCard: (row: TData) => ReactNode;
}

function DataGrid<TData>({
  columnFilters = EMPTY_COLUMN_FILTERS,
  columns,
  data,
  emptyMessage,
  getRowKey,
  isLoading = false,
  loadingMessage,
  renderMobileCard,
}: DataGridProps<TData>) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      columnFilters,
      pagination,
    },
  });

  const rows = table.getRowModel().rows;
  const totalRows = table.getFilteredRowModel().rows.length;
  const firstRow = totalRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const lastRow = Math.min(totalRows, firstRow + rows.length - 1);

  useEffect(() => {
    setPagination((current) =>
      current.pageIndex === 0 ? current : { ...current, pageIndex: 0 },
    );
  }, [columnFilters, data]);

  if (isLoading) {
    return (
      <div className="inline-flex min-h-20 items-center gap-3 rounded-panel border border-neutral-200 bg-white/70 p-4 font-body font-black text-brand-ink dark:border-brand-line dark:bg-black/[0.16] dark:text-white">
        <Loader2 aria-hidden="true" className="animate-spin text-brand-orange" size={22} />
        {loadingMessage}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-panel border border-neutral-200 bg-white/70 p-4 font-body font-black text-neutral-600 dark:border-brand-line dark:bg-black/[0.16] dark:text-orange-50/70">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 lg:hidden">
        {rows.map((row) => (
          <div key={getRowKey(row.original)}>{renderMobileCard(row.original)}</div>
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
            {rows.map((row) => (
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

      {totalRows > pagination.pageSize ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-neutral-200 bg-white/70 px-3 py-2 font-body text-sm font-black text-neutral-600 dark:border-brand-line dark:bg-black/[0.16] dark:text-orange-50/75">
          <span>
            {firstRow}-{lastRow} de {totalRows.toLocaleString("es-PY")}
          </span>
          <div className="inline-flex items-center gap-2">
            <button
              aria-label="Pagina anterior"
              className="grid h-10 w-10 place-items-center rounded-panel border border-neutral-300 bg-white text-brand-ink transition hover:border-brand-orange hover:text-brand-orange disabled:cursor-not-allowed disabled:opacity-40 dark:border-brand-line dark:bg-white/[0.06] dark:text-white"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={18} strokeWidth={2.7} />
            </button>
            <span className="min-w-16 text-center">
              {pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
            <button
              aria-label="Pagina siguiente"
              className="grid h-10 w-10 place-items-center rounded-panel border border-neutral-300 bg-white text-brand-ink transition hover:border-brand-orange hover:text-brand-orange disabled:cursor-not-allowed disabled:opacity-40 dark:border-brand-line dark:bg-white/[0.06] dark:text-white"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
              type="button"
            >
              <ChevronRight aria-hidden="true" size={18} strokeWidth={2.7} />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default DataGrid;

import { GcdsTable } from "@gcds-core/components-react";
import type { ReactTableColumn } from "@gcds-core/components-react";
import type { ReactNode } from "react";
import "./GcdsDataTable.css";

export interface GcdsDataTableProps {
  caption: string;
  columns: ReactTableColumn[];
  rows: Array<Record<string, unknown>>;
  className?: string;
  sort?: boolean;
  filter?: boolean;
  pagination?: boolean;
  paginationSize?: number;
  labelledBy?: string;
  captionClassName?: string;
  id?: string;
  tabIndex?: number;
  children?: ReactNode;
}

/** Shared wrapper that gives every table a unique caption and a relationship to its section. */
export function GcdsDataTable({
  caption,
  columns,
  rows,
  className,
  sort = false,
  filter = false,
  pagination = false,
  paginationSize = 10,
  labelledBy,
  captionClassName,
  id,
  tabIndex,
  children,
}: GcdsDataTableProps) {
  return (
    <div id={id} tabIndex={tabIndex} className={["gcds-data-table", className].filter(Boolean).join(" ")} role="region" aria-label={caption}>
      {children}
      <GcdsTable columns={columns} data={rows} sort={sort} filter={filter} pagination={pagination} paginationSize={paginationSize} aria-labelledby={labelledBy}>
        <span slot="caption" className={captionClassName}>{caption}</span>
      </GcdsTable>
    </div>
  );
}

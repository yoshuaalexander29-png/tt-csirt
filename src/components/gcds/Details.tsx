import type { ReactNode } from "react";
import { GcdsDetails } from "@gcds-core/components-react";

interface DetailsProps {
  title: string;
  children: ReactNode;
  id?: string;
  className?: string;
  open?: boolean;
}

/** Thin adapter around the official GC Design System Details component. */
export function Details({ title, children, id, className, open }: DetailsProps) {
  return <GcdsDetails id={id} className={className} detailsTitle={title} open={open ?? false}>{children}</GcdsDetails>;
}

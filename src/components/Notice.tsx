import type { ReactNode } from "react";
import { GcdsNotice } from "@gcds-core/components-react";

export type NoticeType = "info" | "warning" | "danger" | "success";
type HeadingTag = "h2" | "h3" | "h4" | "h5";

interface NoticeProps {
  type: NoticeType;
  title: string;
  titleAs?: HeadingTag;
  children: ReactNode;
  id?: string;
  className?: string;
}

/** Thin adapter around the official GC Design System Notice component. */
export function Notice({ type, title, titleAs = "h2", children, id, className }: NoticeProps) {
  return (
    <div id={id} className={className} style={{ display: 'block' }}>
      <GcdsNotice noticeRole={type} noticeTitle={title} noticeTitleTag={titleAs}>
        {children}
      </GcdsNotice>
    </div>
  );
}

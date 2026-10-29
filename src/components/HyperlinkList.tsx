export interface HyperlinkListItem {
  href: string;
  label: string;
  description?: string;
}

interface HyperlinkListProps {
  items: HyperlinkListItem[];
  ariaLabel: string;
  onNavigate?: (path: string) => void;
}

export function HyperlinkList({ items, ariaLabel, onNavigate }: HyperlinkListProps) {
  return (
    <nav aria-label={ariaLabel}>
      <ul className="govuk-list related-guidance-links">
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              className="govuk-link"
              onClick={(event) => {
                if (
                  !onNavigate ||
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                ) return;
                event.preventDefault();
                onNavigate(item.href);
              }}
            >
              {item.label}
            </a>
            {item.description && <p className="govuk-body-s">{item.description}</p>}
          </li>
        ))}
      </ul>
    </nav>
  );
}

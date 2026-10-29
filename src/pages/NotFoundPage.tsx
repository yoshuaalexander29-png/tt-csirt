interface NotFoundPageProps {
  onNavigate: (path: string) => void;
}

export function NotFoundPage({ onNavigate }: NotFoundPageProps) {
  return (
    <div className="govuk-grid-row">
      <div className="govuk-grid-column-two-thirds">
        <h1 className="govuk-heading-xl">Page not found</h1>
        <p className="govuk-body-l">
          The page may have moved, or the address may be incorrect.
        </p>
        <p className="govuk-body">
          Check the web address, search the TT-CSIRT website, or return to the homepage.
        </p>
        <p className="govuk-body">
          <a
            className="govuk-link"
            href="/search"
            onClick={(event) => {
              event.preventDefault();
              onNavigate("/search");
            }}
          >
            Search TT-CSIRT
          </a>
        </p>
        <p className="govuk-body">
          <a
            className="govuk-link"
            href="/"
            onClick={(event) => {
              event.preventDefault();
              onNavigate("/");
            }}
          >
            Go to the TT-CSIRT homepage
          </a>
        </p>
      </div>
    </div>
  );
}

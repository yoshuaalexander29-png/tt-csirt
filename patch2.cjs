const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldHeader = `function TtcsirtHeader({ currentPath, onNavigate }: TtcsirtHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useLayoutEffect(() => {
    const mql = window.matchMedia('(min-width: 40.0625em)');
    const updateMode = () => setIsDesktop(mql.matches);
    updateMode();
    mql.addEventListener('change', updateMode);
    return () => mql.removeEventListener('change', updateMode);
  }, []);`;

const newHeader = `function TtcsirtHeader({ currentPath, onNavigate }: TtcsirtHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const navRef = useRef<HTMLElement>(null);
  const serviceNavInstance = useRef<any>(null);

  useEffect(() => {
    if (navRef.current && !serviceNavInstance.current) {
      try {
        serviceNavInstance.current = new ServiceNavigation(navRef.current);
        serviceNavInstance.current.init();
      } catch (e) {
        console.error("GDS ServiceNavigation init error:", e);
      }
    }
    
    return () => {
      // GDS components don't always have a destroy method, but we can clean up if needed
      if (serviceNavInstance.current && typeof serviceNavInstance.current.destroy === 'function') {
        serviceNavInstance.current.destroy();
      }
      serviceNavInstance.current = null;
    };
  }, []);`;

code = code.replace(oldHeader, newHeader);

// Now patch the service-navigation section
const oldNav = `<section
        className="govuk-service-navigation govuk-service-navigation--inverse app-service-navigation"
        data-module="govuk-service-navigation"
        aria-label="Service information"
      >
        <div className="govuk-width-container app-width-container">
          <div className="govuk-service-navigation__container">
            <nav aria-label="Menu" className="govuk-service-navigation__wrapper app-service-navigation__wrapper">
              <button
                type="button"
                className="govuk-service-navigation__toggle govuk-js-service-navigation-toggle"
                aria-controls="navigation"
                aria-expanded={isDesktop ? undefined : isMenuOpen}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                hidden={isDesktop}
                aria-hidden={isDesktop ? "true" : undefined}
              >
                Menu
              </button>
              <ul
                className="govuk-service-navigation__list"
                id="navigation"
                hidden={!isDesktop && !isMenuOpen}
              >`;

const newNav = `<section
        ref={navRef}
        className="govuk-service-navigation govuk-service-navigation--inverse app-service-navigation"
        data-module="govuk-service-navigation"
        aria-label="Service information"
      >
        <div className="govuk-width-container app-width-container">
          <div className="govuk-service-navigation__container">
            <nav aria-label="Menu" className="govuk-service-navigation__wrapper app-service-navigation__wrapper">
              <button
                type="button"
                className="govuk-service-navigation__toggle govuk-js-service-navigation-toggle"
                aria-controls="navigation"
                hidden
                aria-hidden="true"
              >
                Menu
              </button>
              <ul
                className="govuk-service-navigation__list"
                id="navigation"
              >`;

code = code.replace(oldNav, newNav);

// Also patch setIsMenuOpen(false) since we aren't managing that anymore.
// Wait, if users click a link, we might want to close the menu programmatically or let a full page reload handle it?
// Since it's a SPA and `onNavigate` doesn't reload, the menu might stay open!
// To be safe, let's just remove `setIsMenuOpen(false);`
code = code.replace(/setIsMenuOpen\(false\);\s+/g, '');

fs.writeFileSync('src/App.tsx', code);

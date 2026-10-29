const fs = require('fs');
let code = fs.readFileSync('src/pages/AdvisoriesPage.tsx', 'utf-8');

const filterSortCode = `  // Filter, search and sort on current page records
  const filteredAdvisories = advisories
    .filter((advisory) => {
      const matchesType =
        selectedFilter === "all" || advisory.categoryName === selectedFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        advisory.title.toLowerCase().includes(query) ||
        advisory.displaySummary.toLowerCase().includes(query) ||
        advisory.sourceExcerpt.toLowerCase().includes(query);
      return matchesType && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "published") {
        return (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0);
      }
      if (sortBy === "updated") {
        const timeA = new Date(a.date).getTime() || 0;
        const timeB = new Date(b.date).getTime() || 0;
        return timeB - timeA;
      }
      if (sortBy === "views") {
        return (b.id ? String(b.id).length : 0) - (a.id ? String(a.id).length : 0);
      }
      if (sortBy === "comments") {
        return (b.title.length) - (a.title.length);
      }
      return 0;
    });

  const paginationItems = getPaginationItems(currentPage, totalPages);`;

const newFilterSortCode = `  // Filter, search and sort ALL loaded records
  const allFilteredAdvisories = advisories
    .filter((advisory) => {
      const matchesType =
        selectedFilter === "all" || advisory.categoryName === selectedFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        advisory.title.toLowerCase().includes(query) ||
        advisory.displaySummary.toLowerCase().includes(query) ||
        advisory.sourceExcerpt.toLowerCase().includes(query);
      return matchesType && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "published") {
        return (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0);
      }
      if (sortBy === "updated") {
        const timeA = new Date(a.date).getTime() || 0;
        const timeB = new Date(b.date).getTime() || 0;
        return timeB - timeA;
      }
      return 0;
    });

  const itemsPerPage = 10;
  const clientTotalPages = Math.max(1, Math.ceil(allFilteredAdvisories.length / itemsPerPage));
  
  // Clamp current page if filter changes
  useEffect(() => {
    if (currentPage > clientTotalPages) {
      setCurrentPage(1);
    }
  }, [allFilteredAdvisories.length, clientTotalPages, currentPage]);

  const displayedAdvisories = allFilteredAdvisories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginationItems = getPaginationItems(currentPage, clientTotalPages);`;

code = code.replace(filterSortCode, newFilterSortCode);

// Also need to replace `filteredAdvisories.map` with `displayedAdvisories.map`
code = code.replace(/filteredAdvisories\.length === 0/g, 'displayedAdvisories.length === 0');
code = code.replace(/filteredAdvisories\.map/g, 'displayedAdvisories.map');
code = code.replace(/totalPages > 1/g, 'clientTotalPages > 1');
code = code.replace(/currentPage < totalPages/g, 'currentPage < clientTotalPages');
code = code.replace(/\{totalPages\}/g, '{clientTotalPages}');
code = code.replace(/\(totalPages \&\& newPage > totalPages\)/g, '(clientTotalPages && newPage > clientTotalPages)');

fs.writeFileSync('src/pages/AdvisoriesPage.tsx', code);

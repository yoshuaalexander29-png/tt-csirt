const fs = require('fs');
let code = fs.readFileSync('src/pages/AdvisoriesPage.tsx', 'utf-8');

const oldEffect = `  // Clamp current page if filter changes
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

const newEffect = `  const safeCurrentPage = Math.min(currentPage, clientTotalPages);
  
  // Clamp current page if filter changes
  useEffect(() => {
    if (currentPage > clientTotalPages) {
      setCurrentPage(safeCurrentPage);
    }
  }, [clientTotalPages, currentPage, safeCurrentPage]);

  const displayedAdvisories = allFilteredAdvisories.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  const paginationItems = getPaginationItems(safeCurrentPage, clientTotalPages);`;

code = code.replace(oldEffect, newEffect);

// Replace any leftover `currentPage` references in pagination with `safeCurrentPage` inside the pagination UI
code = code.replace(/currentPage > 1/g, 'safeCurrentPage > 1');
code = code.replace(/currentPage < clientTotalPages/g, 'safeCurrentPage < clientTotalPages');
code = code.replace(/currentPage - 1/g, 'safeCurrentPage - 1');
code = code.replace(/currentPage \+ 1/g, 'safeCurrentPage + 1');
// Be careful with pageNum === currentPage
code = code.replace(/pageNum === currentPage/g, 'pageNum === safeCurrentPage');
code = code.replace(/getPaginationItems\(currentPage, clientTotalPages\)/g, 'getPaginationItems(safeCurrentPage, clientTotalPages)');

fs.writeFileSync('src/pages/AdvisoriesPage.tsx', code);

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const getPaginationRange = (currentPage, totalPages) => {
  const delta = 1;
  const range = [];
  const rangeWithDots = [];

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      range.push(i);
    }
  }

  let l;
  for (let i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return rangeWithDots;
};

const PaginationFooter = ({
  currentPage = 1,
  pageSize = 20,
  totalRecords = 0,
  totalPages = 1,
  onPageChange,
  onPageSizeChange,
  loading = false,
  pageSizeOptions = [10, 20, 50, 100],
  itemLabel = 'patients'
}) => {
  const startItem = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalRecords);
  const pages = getPaginationRange(currentPage, totalPages);

  return (
    <div className="px-5 py-3.5 bg-white border-t border-orange-100 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
      {/* Left: Rows Per Page Dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-500">Rows per page:</span>
        <select
          value={pageSize}
          onChange={(e) => {
            if (onPageSizeChange) onPageSizeChange(Number(e.target.value));
          }}
          className="input py-1 px-2.5 text-xs font-bold w-auto border-orange-200 focus:ring-orange-500 bg-orange-50/30 rounded-lg cursor-pointer"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {/* Center: Showing X–Y of Z records */}
      <div className="text-xs font-bold text-gray-700 text-center">
        {totalRecords === 0 ? (
          <span>Showing 0 of 0 {itemLabel}</span>
        ) : (
          <span>
            Showing <span className="text-gray-900 font-extrabold">{startItem.toLocaleString()}</span>–
            <span className="text-gray-900 font-extrabold">{endItem.toLocaleString()}</span> of{' '}
            <span className="text-orange-600 font-extrabold">{totalRecords.toLocaleString()}</span> {itemLabel}
          </span>
        )}
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-1.5">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => {
            if (onPageChange && currentPage > 1) onPageChange(currentPage - 1);
          }}
          disabled={currentPage === 1 || loading}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-orange-200/80 bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-orange-200/80 transition-all duration-200 shadow-xs cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-2 py-1 text-xs font-bold text-gray-400 select-none">
                  ...
                </span>
              );
            }
            const isActive = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => {
                  if (onPageChange && !isActive) onPageChange(p);
                }}
                disabled={loading}
                className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center cursor-pointer ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 border border-orange-500'
                    : 'bg-white text-gray-700 border border-orange-200/60 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => {
            if (onPageChange && currentPage < totalPages) onPageChange(currentPage + 1);
          }}
          disabled={currentPage >= totalPages || totalPages === 0 || loading}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-orange-200/80 bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-orange-200/80 transition-all duration-200 shadow-xs cursor-pointer"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PaginationFooter;

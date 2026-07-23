import React from 'react';
import Skeleton from './Skeleton';

const SkeletonTable = React.memo(function SkeletonTable({
  rows = 4,
  columns = 5,
  rowHeight = '1.25rem',
  gap = '0.75rem',
  headerHeight = '1.5rem',
  className = '',
  ...props
}) {
  const headerCells = Array.from({ length: columns });
  const bodyRows = Array.from({ length: rows });

  return (
    <div className={[`skeleton-block skeleton-table`, className].filter(Boolean).join(' ')} {...props}>
      <div className="skeleton-table-header">
        {headerCells.map((_, index) => (
          <Skeleton
            key={`header-${index}`}
            width={`${100 / columns - 1}%`}
            height={headerHeight}
            borderRadius="0.75rem"
          />
        ))}
      </div>
      <div className="skeleton-table-body">
        {bodyRows.map((_, rowIndex) => (
          <div className="skeleton-table-row" key={`row-${rowIndex}`}>
            {headerCells.map((__, colIndex) => (
              <Skeleton
                key={`row-${rowIndex}-col-${colIndex}`}
                width={`${100 / columns - 1}%`}
                height={rowHeight}
                borderRadius="0.5rem"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});

export default SkeletonTable;

import React from 'react';
import Skeleton from './Skeleton';

const SkeletonText = React.memo(function SkeletonText({
  lines = 3,
  lineHeight = '1rem',
  gap = '0.75rem',
  widths = [],
  className = '',
  ...props
}) {
  const rows = Math.max(1, lines);
  return (
    <div className={[`skeleton-block skeleton-text`, className].filter(Boolean).join(' ')} {...props}>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton
          key={index}
          width={widths[index] || (index === rows - 1 ? '70%' : '100%')}
          height={lineHeight}
          borderRadius="0.375rem"
          className="skeleton-text-line"
          style={{ marginBottom: index < rows - 1 ? gap : 0 }}
        />
      ))}
    </div>
  );
});

export default SkeletonText;

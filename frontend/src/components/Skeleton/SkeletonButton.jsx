import React from 'react';
import Skeleton from './Skeleton';

const SkeletonButton = React.memo(function SkeletonButton({
  count = 1,
  width = '6rem',
  height = '2.25rem',
  borderRadius = '999px',
  gap = '0.75rem',
  className = '',
  ...props
}) {
  const buttons = Math.max(1, count);
  return (
    <div className={[`skeleton-block skeleton-button-group`, className].filter(Boolean).join(' ')} {...props}>
      {Array.from({ length: buttons }).map((_, index) => (
        <Skeleton
          key={index}
          width={width}
          height={height}
          borderRadius={borderRadius}
          className="skeleton-button-item"
          style={{ marginRight: index < buttons - 1 ? gap : 0 }}
        />
      ))}
    </div>
  );
});

export default SkeletonButton;

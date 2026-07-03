import React from 'react';
import Skeleton from './Skeleton';

const SkeletonCard = React.memo(function SkeletonCard({
  width = '100%',
  height = '12rem',
  borderRadius = '1rem',
  headerHeight = '2.5rem',
  bodyLines = 3,
  className = '',
  style = {},
  ...props
}) {
  return (
    <div
      className={[`skeleton-card skeleton-block`, className].filter(Boolean).join(' ')}
      style={{ width, ...style }}
      {...props}
    >
      <Skeleton width="100%" height={headerHeight} borderRadius="1rem 1rem 0 0" />
      <div className="skeleton-card-body">
        {Array.from({ length: bodyLines }).map((_, index) => (
          <Skeleton
            key={index}
            width={index === bodyLines - 1 ? '75%' : '100%'}
            height="1rem"
            borderRadius="0.5rem"
            style={{ marginBottom: index < bodyLines - 1 ? '0.75rem' : 0 }}
          />
        ))}
      </div>
    </div>
  );
});

export default SkeletonCard;

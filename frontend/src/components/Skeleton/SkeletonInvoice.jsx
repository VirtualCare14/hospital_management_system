import React from 'react';
import Skeleton from './Skeleton';

const SkeletonInvoice = React.memo(function SkeletonInvoice({
  width = '100%',
  headerHeight = '2rem',
  lineCount = 5,
  className = '',
  ...props
}) {
  return (
    <div className={[`skeleton-block skeleton-invoice`, className].filter(Boolean).join(' ')} {...props}>
      <Skeleton width="100%" height={headerHeight} borderRadius="0.75rem" />
      <div className="skeleton-invoice-meta">
        <Skeleton width="45%" height="1rem" borderRadius="0.5rem" />
        <Skeleton width="30%" height="1rem" borderRadius="0.5rem" />
      </div>
      <div className="skeleton-invoice-lines">
        {Array.from({ length: lineCount }).map((_, index) => (
          <Skeleton
            key={index}
            width={index === lineCount - 1 ? '60%' : '100%'}
            height="1rem"
            borderRadius="0.5rem"
            style={{ marginBottom: index < lineCount - 1 ? '0.75rem' : 0 }}
          />
        ))}
      </div>
      <div className="skeleton-invoice-summary">
        <Skeleton width="50%" height="1rem" borderRadius="0.5rem" />
        <Skeleton width="35%" height="1rem" borderRadius="0.5rem" />
      </div>
    </div>
  );
});

export default SkeletonInvoice;

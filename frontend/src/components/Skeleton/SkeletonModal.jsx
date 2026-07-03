import React from 'react';
import Skeleton from './Skeleton';

const SkeletonModal = React.memo(function SkeletonModal({
  width = '32rem',
  headerHeight = '2.25rem',
  contentLines = 4,
  footerHeight = '2.5rem',
  className = '',
  ...props
}) {
  return (
    <div className={[`skeleton-block skeleton-modal`, className].filter(Boolean).join(' ')} {...props}>
      <Skeleton width="100%" height={headerHeight} borderRadius="1rem 1rem 0 0" />
      <div className="skeleton-modal-content">
        {Array.from({ length: contentLines }).map((_, index) => (
          <Skeleton
            key={index}
            width={index % 3 === 2 ? '85%' : '100%'}
            height="1rem"
            borderRadius="0.5rem"
            style={{ marginBottom: '0.75rem' }}
          />
        ))}
      </div>
      <div className="skeleton-modal-footer">
        <Skeleton width="30%" height={footerHeight} borderRadius="999px" />
      </div>
    </div>
  );
});

export default SkeletonModal;

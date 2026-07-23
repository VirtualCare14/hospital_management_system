import React from 'react';
import Skeleton from './Skeleton';

const SkeletonProfile = React.memo(function SkeletonProfile({
  width = '100%',
  avatarSize = '4rem',
  lines = 3,
  className = '',
  ...props
}) {
  return (
    <div className={[`skeleton-block skeleton-profile`, className].filter(Boolean).join(' ')} {...props}>
      <div className="skeleton-profile-header">
        <Skeleton width={avatarSize} height={avatarSize} borderRadius="999px" />
        <div className="skeleton-profile-details">
          <Skeleton width="40%" height="1rem" borderRadius="0.5rem" />
          <Skeleton width="60%" height="1rem" borderRadius="0.5rem" />
          <Skeleton width="30%" height="1rem" borderRadius="0.5rem" />
        </div>
      </div>
      <div className="skeleton-profile-meta">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            width={index === lines - 1 ? '60%' : '100%'}
            height="0.9rem"
            borderRadius="0.5rem"
            style={{ marginBottom: index < lines - 1 ? '0.75rem' : 0 }}
          />
        ))}
      </div>
    </div>
  );
});

export default SkeletonProfile;

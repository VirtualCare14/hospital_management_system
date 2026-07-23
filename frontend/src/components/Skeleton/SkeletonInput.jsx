import React from 'react';
import Skeleton from './Skeleton';

const SkeletonInput = React.memo(function SkeletonInput({
  width = '100%',
  height = '2.25rem',
  borderRadius = '0.5rem',
  className = '',
  style = {},
  ...props
}) {
  return (
    <Skeleton
      width={width}
      height={height}
      borderRadius={borderRadius}
      className={[`skeleton-input`, className].filter(Boolean).join(' ')}
      style={style}
      {...props}
    />
  );
});

export default SkeletonInput;

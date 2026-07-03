import React from 'react';
import './Skeleton.css';

const normalizeSize = (value) =>
  typeof value === 'number' ? `${value}px` : value;

const Skeleton = React.memo(function Skeleton({
  width = '100%',
  height = '1rem',
  borderRadius = '0.5rem',
  className = '',
  style = {},
  ...props
}) {
  const inlineStyle = {
    width: normalizeSize(width),
    height: normalizeSize(height),
    borderRadius: normalizeSize(borderRadius),
    ...style,
  };

  return (
    <div
      className={[`skeleton`, className].filter(Boolean).join(' ')}
      style={inlineStyle}
      aria-busy="true"
      aria-label="Loading content"
      role="status"
      {...props}
    />
  );
});

export default Skeleton;

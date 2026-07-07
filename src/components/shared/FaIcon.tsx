import React from 'react';

interface FaIconProps extends React.HTMLAttributes<HTMLElement> {
  icon: string;
  size?: number | string;
}

export const FaIcon: React.FC<FaIconProps> = ({ icon, size, className = '', style, ...props }) => {
  return (
    <i
      className={[icon, className].filter(Boolean).join(' ')}
      style={{
        fontSize: size ? (typeof size === 'number' ? `${size}px` : size) : undefined,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
};

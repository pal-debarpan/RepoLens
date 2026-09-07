import React from 'react';
import { useWaterNavigate } from '../../context/useWaterNavigate';

export interface PageLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  children: React.ReactNode;
  className?: string;
}

export const PageLink: React.FC<PageLinkProps> = ({
  to,
  children,
  className = '',
  onClick,
  ...rest
}) => {
  const { waterNavigate } = useWaterNavigate();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onClick) {
      onClick(e);
    }
    waterNavigate(to, e);
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      className={`page-link ${className}`}
      {...rest}
    >
      {children}
    </a>
  );
};

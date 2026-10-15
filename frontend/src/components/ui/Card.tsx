import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`qb-card p-5 ${onClick ? 'cursor-pointer hover:border-emerald-300' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

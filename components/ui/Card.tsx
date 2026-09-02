
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-brand-surface/75 backdrop-blur-md border border-brand-border/80 rounded-xl shadow-card-glow transition-all duration-300 hover:border-brand-primary/20 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
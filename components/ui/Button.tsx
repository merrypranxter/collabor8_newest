import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:active:scale-100 disabled:hover:shadow-none active:scale-[0.98] tracking-wide transform hover:-translate-y-0.5';

  const variantStyles = {
    primary: 'bg-silver-gradient text-brand-bg-start shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40 border border-brand-primary/40 focus:ring-brand-primary focus:ring-offset-brand-surface font-bold',
    secondary: 'bg-brand-surface/60 hover:bg-brand-surface border border-brand-border text-brand-text-light hover:text-white hover:border-brand-primary/50 focus:ring-brand-border focus:ring-offset-brand-surface',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variant === 'primary' ? variantStyles.primary : variantStyles.secondary} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
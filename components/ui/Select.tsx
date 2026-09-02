
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
}

const Select: React.FC<SelectProps> = ({ label, id, children, className = '', ...props }) => {
  const selectId = id || (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);
  
  return (
    <div>
      {label && <label htmlFor={selectId} className="block text-sm font-medium text-brand-text-dark mb-1">{label}</label>}
      <select
        id={selectId}
        className={`w-full bg-brand-surface/50 border border-brand-border rounded-lg px-3.5 py-2 text-brand-text-light placeholder-brand-text-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary transition-all duration-300 appearance-none bg-no-repeat bg-right pr-10 bg-[url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20"><path stroke="%238F94B5" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m6 8 4 4 4-4"/></svg>')] cursor-pointer ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
};

export default Select;
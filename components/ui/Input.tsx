
import React, { useRef } from 'react';
import DictationButton from './DictationButton';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input: React.FC<InputProps> = ({ label, id, className = '', ...props }) => {
  const inputId = id || (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleTranscript = (text: string) => {
      if (inputRef.current) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          const currentValue = inputRef.current.value;
          const separator = currentValue && !currentValue.endsWith(' ') ? ' ' : '';
          nativeInputValueSetter?.call(inputRef.current, currentValue + separator + text.trim());
          const ev = new Event('input', { bubbles: true});
          inputRef.current.dispatchEvent(ev);
      }
  };

  return (
    <div>
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-brand-text-dark mb-1">{label}{props.required && <span className="text-red-400 ml-1">*</span>}</label>}
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          className={`w-full bg-brand-surface/50 border border-brand-border rounded-lg pl-3.5 pr-10 py-2 text-brand-text-light placeholder-brand-text-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary transition-all duration-300 shadow-inner ${className}`}
          {...props}
        />
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
            <DictationButton onTranscript={handleTranscript} />
        </div>
      </div>
    </div>
  );
};

export default Input;
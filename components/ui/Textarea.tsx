
import React, { useRef } from 'react';
import DictationButton from './DictationButton';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
}

const Textarea: React.FC<TextareaProps> = ({ label, id, className = '', ...props }) => {
  const textareaId = id || (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const handleTranscript = (text: string) => {
      if (textareaRef.current) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
          const currentValue = textareaRef.current.value;
          const separator = currentValue && !currentValue.endsWith(' ') && !currentValue.endsWith('\n') ? ' ' : '';
          nativeInputValueSetter?.call(textareaRef.current, currentValue + separator + text.trim());
          const ev = new Event('input', { bubbles: true});
          textareaRef.current.dispatchEvent(ev);
      }
  };

  return (
    <div>
      {label && <label htmlFor={textareaId} className="block text-sm font-medium text-brand-text-dark mb-1">{label}</label>}
      <div className="relative">
        <textarea
          ref={textareaRef}
          id={textareaId}
          className={`w-full bg-brand-surface/50 border border-brand-border rounded-lg pl-3.5 pr-10 py-2 text-brand-text-light placeholder-brand-text-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary transition-all duration-300 shadow-inner resize-y ${className}`}
          {...props}
        />
        <div className="absolute right-1.5 top-2">
            <DictationButton onTranscript={handleTranscript} />
        </div>
      </div>
    </div>
  );
};

export default Textarea;
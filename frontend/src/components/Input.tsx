import React from 'react';

// Input Component
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  startIcon,
  endIcon,
  className = '',
  containerClassName = '',
  id,
  disabled,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {startIcon && (
          <div className="absolute left-3 text-gray-400 pointer-events-none flex items-center">
            {startIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 dark:disabled:bg-gray-800 ${
            startIcon ? 'pl-10' : ''
          } ${endIcon ? 'pr-10' : ''} ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900/50'
              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-100 dark:border-gray-700 dark:focus:border-primary-500 dark:focus:ring-primary-900/50'
          } ${className}`}
          {...props}
        />
        {endIcon && (
          <div className="absolute right-3 text-gray-400 flex items-center">
            {endIcon}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {!error && helperText && <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';

// Textarea Component
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  id,
  disabled,
  rows = 4,
  ...props
}, ref) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={textareaId} className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        disabled={disabled}
        className={`w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 dark:disabled:bg-gray-800 ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900/50'
            : 'border-gray-300 focus:border-primary-500 focus:ring-primary-100 dark:border-gray-700 dark:focus:border-primary-500 dark:focus:ring-primary-900/50'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {!error && helperText && <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';

// Select Component
export interface SelectOption {
  label: string;
  value: string | number;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  options,
  error,
  helperText,
  className = '',
  containerClassName = '',
  id,
  disabled,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        disabled={disabled}
        className={`w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-900 dark:text-gray-100 dark:disabled:bg-gray-800 ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900/50'
            : 'border-gray-300 focus:border-primary-500 focus:ring-primary-100 dark:border-gray-700 dark:focus:border-primary-500 dark:focus:ring-primary-900/50'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {!error && helperText && <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>}
    </div>
  );
});

Select.displayName = 'Select';

// Checkbox Component
export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  error,
  className = '',
  id,
  ...props
}, ref) => {
  const checkboxId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1">
      <label className="inline-flex items-center gap-2.5 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          ref={ref}
          id={checkboxId}
          className={`h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:checked:bg-primary-600 ${className}`}
          {...props}
        />
        {label && <span>{label}</span>}
      </label>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

// Radio Component
export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(({
  label,
  className = '',
  id,
  ...props
}, ref) => {
  const radioId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
      <input
        type="radio"
        ref={ref}
        id={radioId}
        className={`h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 ${className}`}
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
  );
});

Radio.displayName = 'Radio';

// Switch Toggle Component
export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
}) => {
  return (
    <label className={`inline-flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out translate-y-0.5 ${
            checked ? 'translate-x-5.5' : 'translate-x-0.5'
          }`}
        />
      </div>
      {label && <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{label}</span>}
    </label>
  );
};

export default Input;

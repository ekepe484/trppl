// src/components/ui/FormField.jsx
export function FormField({ label, error, hint, icon, children }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">{label}</label>}
      <div className="relative flex items-center">
        {icon && <i className={`ti ${icon} absolute left-3 text-neutral-400 pointer-events-none text-lg z-10`} />}
        {children}
      </div>
      {hint  && !error && <p className="text-xs text-neutral-400 mt-1 px-0.5">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export function Input({ icon, className = '', ...props }) {
  return (
    <input
      className={`field-input ${icon ? 'pl-10' : 'px-4'} ${className}`}
      {...props}
    />
  );
}

export function Select({ icon, children, className = '', ...props }) {
  return (
    <select className={`field-select ${icon ? 'pl-10' : 'px-4'} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ icon, className = '', ...props }) {
  return (
    <textarea
      className={`field-input ${icon ? 'pl-10' : 'px-4'} resize-none ${className}`}
      {...props}
    />
  );
}

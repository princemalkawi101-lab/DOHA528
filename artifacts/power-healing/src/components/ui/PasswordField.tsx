import { useState, InputHTMLAttributes } from 'react';
import { useApp } from '@/lib/store';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  iconSize?: number;
};

export function PasswordField({ className = '', iconSize = 20, ...rest }: Props) {
  const { lang } = useApp();
  const [show, setShow] = useState(false);
  const isAr = lang === 'ar';

  return (
    <div className="relative">
      <input
        {...rest}
        type={show ? 'text' : 'password'}
        dir={rest.dir || 'ltr'}
        className={`${className} ${isAr ? 'pl-12' : 'pr-12'}`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? (isAr ? 'إخفاء كلمة المرور' : 'Hide password') : (isAr ? 'إظهار كلمة المرور' : 'Show password')}
        tabIndex={-1}
        className={`absolute top-1/2 -translate-y-1/2 ${isAr ? 'left-3' : 'right-3'} text-[rgba(255,255,255,0.5)] hover:text-[hsl(var(--g300))] transition-colors`}
      >
        {show ? (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        ) : (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        )}
      </button>
    </div>
  );
}

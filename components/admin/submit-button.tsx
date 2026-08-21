'use client';

import { useFormStatus } from 'react-dom';
import { ReactNode } from 'react';

interface SubmitButtonProps {
  children: ReactNode;
  className?: string;
}

export function SubmitButton({ children, className = '' }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`bg-[var(--color-ink)] text-[var(--color-cream)] rounded-full px-8 py-3 text-sm tracking-[0.2em] uppercase font-medium hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {pending ? (
        <>
          <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
          Guardando...
        </>
      ) : (
        children
      )}
    </button>
  );
}

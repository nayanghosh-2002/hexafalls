"use client";

import { useCallback, useRef, useState } from "react";
import { useBo } from "./BoContext";

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function PasswordInput({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  const focusedRef = useRef(false);
  const hoveredRef = useRef(false);
  const { setPasswordHidden, setExcited } = useBo();

  const syncBoState = useCallback(() => {
    const shy = focusedRef.current || hoveredRef.current;
    setPasswordHidden(shy);
    if (shy) setExcited(false);
  }, [setPasswordHidden, setExcited]);

  return (
    <div
      className="relative"
      onPointerEnter={() => {
        hoveredRef.current = true;
        syncBoState();
      }}
      onPointerLeave={() => {
        hoveredRef.current = false;
        syncBoState();
      }}
    >
      <input
        {...props}
        type={visible ? "text" : "password"}
        onFocus={(e) => {
          focusedRef.current = true;
          syncBoState();
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          focusedRef.current = false;
          syncBoState();
          props.onBlur?.(e);
        }}
        onInput={(e) => {
          syncBoState();
          props.onInput?.(e);
        }}
        className={`auth-input py-3 pl-3.5 pr-11 ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        <EyeIcon open={visible} />
      </button>
    </div>
  );
}

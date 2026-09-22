"use client";

import { useState } from "react";

type PasswordInputProps = {
  id: string;
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  labelClassName?: string;
  className?: string;
};

const baseInputClass =
  "w-full border-b border-black/30 bg-transparent pb-2 pr-8 text-[17px] text-black outline-none placeholder:font-normal placeholder:opacity-30 focus:border-[#001192] dark:border-white/30 dark:text-white dark:placeholder:text-white dark:focus:border-[#4258ff]";

export default function PasswordInput({
  id,
  label,
  value,
  onChange,
  name,
  placeholder,
  autoComplete,
  required,
  minLength,
  labelClassName = "",
  className = "",
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <>
      <label
        htmlFor={id}
        className={`text-[17px] font-medium text-black dark:text-white ${labelClassName}`}
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`${baseInputClass} ${className}`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
          title={show ? "Sembunyikan password" : "Tampilkan password"}
          className="absolute bottom-1 right-0 grid size-7 cursor-pointer place-items-center rounded-full text-black/40 transition-colors hover:bg-black/5 dark:text-white/65 dark:hover:bg-white/10"
        >
          {show ? (
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}

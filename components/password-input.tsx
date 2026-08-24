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
          className="absolute bottom-1 right-0 grid size-7 cursor-pointer place-items-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        >
          <img
            src={show ? "/assets/eye.svg" : "/assets/eye-closed.svg"}
            alt=""
            className="size-5 object-contain"
          />
        </button>
      </div>
    </>
  );
}

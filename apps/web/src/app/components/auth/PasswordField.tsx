"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type InputHTMLAttributes } from "react";
import AuthField from "./AuthField";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  hint?: string;
  error?: string;
};

export default function PasswordField({ label, hint, error, id, disabled, ...props }: PasswordFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div className="block">
      <div className="relative">
        <AuthField
          id={inputId}
          type={visible ? "text" : "password"}
          label={label}
          hint={hint}
          error={error}
          disabled={disabled}
          className="pr-12"
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          disabled={disabled}
          className="absolute right-3 top-[42px] inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus:outline-none"
          aria-label={visible ? "隐藏密码" : "显示密码"}
          aria-controls={inputId}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

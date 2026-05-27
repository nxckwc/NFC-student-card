"use client"

import { Eye, EyeOff } from "lucide-react"

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  disabled?: boolean;
  placeholder?: string;
}

const PasswordInput = ({
  value,
  onChange,
  show,
  onToggle,
  disabled,
  placeholder = "password",
}: PasswordInputProps) => {
  return (
    <div className="relative">
      <input
        autoComplete="current-password"
        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20"
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        type={show ? "text" : "password"}
        value={value}
      />
      <button
        aria-label={show ? "Hide password" : "Show password"}
        className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-white/80"
        disabled={disabled}
        onClick={onToggle}
        type="button"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
};

export default PasswordInput

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
        className="w-full rounded-xl border border-[#ded6d0] bg-white px-4 py-3 pr-12 text-sm text-[#303536] outline-none transition placeholder:text-[#aaa19b] focus:border-[#c94f5f] focus:ring-3 focus:ring-[#f8e7e9]"
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        type={show ? "text" : "password"}
        value={value}
      />
      <button
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-lg px-3 py-2 text-[#817873] hover:bg-[#f1eeea]"
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

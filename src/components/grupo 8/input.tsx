import type React from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export const Input: React.FC<InputProps> = ({ className = "", ...props }) => {
  const baseStyles =
    "w-full px-30 py-2 bg-transparent rounded-md bg-[#1a1a2e] text-white border-[#2a2a40] focus:outline-none focus:ring-1 focus:ring-[#3a3a50]"

  return <input className={`${baseStyles} ${className}`} {...props} />
}

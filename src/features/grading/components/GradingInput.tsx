import type React from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export const GradingInput: React.FC<InputProps> = ({ className = "", ...props }) => {
  const baseStyles =
    "w-full px-30 py-2  rounded-mdfocus:outline-none focus:ring-1 focus:ring-[#3a3a50]"

  return <input className={`${baseStyles} ${className}`} {...props} />
}

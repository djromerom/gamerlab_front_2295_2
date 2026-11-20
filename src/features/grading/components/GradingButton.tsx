import type React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "primary"
  size?: "default" | "sm" | "lg"
  children: React.ReactNode
}

export const GradingButton: React.FC<ButtonProps> = ({
  variant = "default",
  size = "default",
  className = "",
  children,
  ...props
}) => {
  const baseStyles = "rounded-md font-medium transition-colors focus:outline-none flex items-center justify-center"

  const variantStyles = {
    default: "bg-card hover:bg-card text-foreground",
    outline: "border text-black",
    primary: "bg-[#b3c7ff] hover:bg-[#a0b8ff] text-[#1a1a2e] font-medium",
  }

  const sizeStyles = {
    sm: "px-3 py-1 text-sm",
    default: "px-4 py-2",
    lg: "px-6 py-6 text-lg",
  }

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`

  return (
    <button className={combinedClassName} {...props}>
      {children}
    </button>
  )
}

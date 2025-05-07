"use client"
import type React from "react"

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string
}

export const Textarea: React.FC<TextareaProps> = ({ className = "", ...props }) => {
  const baseStyles =
    "w-full px-3 py-2 rounded-md bg-[#e5e5e5] dark:bg-gray-800 text-[#1a1a2e] dark:text-gray-200 border border-[#4d5474] dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-[#3a3a50] dark:focus:ring-gray-600 resize-none"

  return <textarea className={`${baseStyles} ${className}`} {...props} />
}

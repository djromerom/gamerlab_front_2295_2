import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--background)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          success: "bg-[var(--toast-success)] text-[var(--foreground)]",
          error: "bg-[var(--toast-error)] text-[var(--foreground)]",
          info: "bg-blue-600 text-white",
          warning: "bg-yellow-400 text-black",
        },
        ...props.toastOptions, // para no sobrescribir props externos
      }}
      {...props}
    />
  )
}

export { Toaster }

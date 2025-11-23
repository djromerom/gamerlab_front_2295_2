import { ThemeProvider } from "@/components/grupo 11/theme-provider"
import RoutesConfiguration from "@/routes/RoutesConfiguration"
import { AuthProvider } from "@/contexts/AuthContext"
import { Toaster } from "sonner"

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <RoutesConfiguration />
        <Toaster 
          richColors 
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--background)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

"use client"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"

export function ToastTest() {

  const testToast = () => {
    console.log("Mostrando toast...")
    toast.success( "message", {
      description: "Este es un toast de prueba",})
  }


  const testErrorToast = () => {
    console.log("Mostrando toast de error...")
    toast.error( "message", {
      description: "Este es un toast de prueba de error",
      duration: 50000,})
  }

  return (
    <div>
      <div className="p-6 space-y-4 border rounded-lg">
      <h2 className="text-xl font-bold">Prueba del Sistema de Toast</h2>
      <p>Haz clic en los botones para probar si el sistema de toast está funcionando correctamente.</p>
      <div className="flex space-x-4">
        <Button onClick={testToast}>Probar Toast Normal</Button>
        <Button variant="destructive" onClick={testErrorToast}>
          Probar Toast de Error
        </Button>
      </div>
    </div>
      <Toaster
      richColors={false}
      toastOptions={{
        unstyled: true,
        classNames: {
          success: 'bg-[var(--toast-success)] border border-green-800 w-[356px] text-foreground flex flex-justify gap-2 items-center px-3 py-3 rounded-md shadow-md',
          error: 'bg-[var(--toast-error)] border border-rose-800 w-[356px] text-foreground flex flex-justify gap-2 items-center px-3 py-3 rounded-md shadow-md',
          info: 'bg-blue-600 text-white px-4 py-3 rounded-md shadow-md',
          // ...
        },
      }} />
  </div>
    
  )
  
}

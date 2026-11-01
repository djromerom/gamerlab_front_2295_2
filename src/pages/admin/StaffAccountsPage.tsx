import { useState, type FormEvent } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import LayoutAplication from "@/layouts/LayoutAplication";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createStaff } from "@/fetchs/jurorCheckIn";

const StaffAccountsPage = () => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await createStaff({ email: email.trim(), firstName: firstName.trim(), lastName: lastName.trim() });
      toast.success("Cuenta Staff creada", { description: "Se enviará el correo de verificación." });
      setEmail("");
      setFirstName("");
      setLastName("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear la cuenta Staff");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LayoutAplication breadcrumbs={[{ label: "Cuentas Staff", href: "/cuentas-staff" }]}>
      <main className="mx-auto w-full max-w-2xl px-4 pb-10">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><UserPlus /> Crear cuenta Staff</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={submit}>
              <div className="space-y-2"><Label htmlFor="staff-email">Correo</Label><Input id="staff-email" type="email" required maxLength={50} value={email} onChange={(event) => setEmail(event.target.value)} /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="staff-first-name">Nombre</Label><Input id="staff-first-name" required maxLength={50} value={firstName} onChange={(event) => setFirstName(event.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="staff-last-name">Apellido</Label><Input id="staff-last-name" required maxLength={50} value={lastName} onChange={(event) => setLastName(event.target.value)} /></div>
              </div>
              <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="mr-2 animate-spin" />}Crear cuenta</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </LayoutAplication>
  );
};

export default StaffAccountsPage;

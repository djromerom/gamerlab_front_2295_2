import { TextSizeControls } from "@/components/grupo 5/TextSizeControl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyIcon } from "lucide-react";
import { Link } from "react-router";

export default function ResetPassword() {
  return(
    <div className="relative min-h-screen dark bg-[#060312] overflow-hidden">
        <div
            className="absolute inset-0 z-0 bg-center bg-cover bg-no-repeat  animate-float"
            style={{
            backgroundImage: "url('/background.webp')",
            }}
        ></div>
        <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4 sm:p-6 md:p-10">
            <Card className="w-full max-w-md p-6 sm:p-8 md:p-12 py-5 flex flex-col mx-auto items-center justify-center gap-4 sm:gap-6 bg-black/50">
            <div className="flex items-center w-full justify-center">
                <Link to="/" className="flex items-center">
                <img
                    src="/Arkad.svg"
                    alt="Logo"
                    className="h-12 sm:h-16 w-auto"
                />
                </Link>
            </div>
            <CardHeader className="w-full p-0 text-center">
                <CardTitle className="text-2xl sm:text-3xl md:text-[30px] leading-tight space-y-2">
                <h2 className="font-bold">¡Hola!</h2>
                <p className="text-xl font-medium">(name)</p>
                </CardTitle>
                <CardDescription className="text-[12px] sm:text-[15px]">
                    Rellana los campos para tu nueva contraseña.
                </CardDescription>
            </CardHeader>

            <CardContent className="w-full p-0">
                <form onSubmit={()=>{}}>
                <div className="flex flex-col gap-4 sm:gap-6 items-center w-full">
                    <div className="relative flex flex-col justify-center h-[45px] w-full items-start">
                        <div className="absolute flex justify-center items-center h-full px-[10px] border-r-2">
                            <KeyIcon size={16} />
                        </div>
                        <Input
                            id="resetPassword"
                            type="password"
                            placeholder="Ingresar contraseña"
                            required
                            className="w-full h-full pl-[45px] m-0"
                        />
                    </div>
                    <div className="relative flex flex-col justify-center h-[45px] w-full items-start">
                        <div className="absolute flex justify-center items-center h-full px-[10px] border-r-2">
                            <KeyIcon size={16} />
                        </div>
                        
                        <Input
                            id="confirmResetPassword"
                            type="password"
                            placeholder="Confirmar contraseña"
                            required
                            className="w-full h-full pl-[45px] m-0"
                        />
                    </div>
                    <div className="w-full mt-2 sm:mt-4">
                        <Button
                            type="submit"
                            className="w-full bg-[#B3C7FF] text-base sm:text-[18px] hover:bg-[#8a70ff] cursor-pointer"
                        >
                            Aceptar
                        </Button>
                    </div>
                </div>
                </form>
            </CardContent>
            <CardFooter className="w-full justify-center p-0 mt-2 sm:mt-4 text-center">
            </CardFooter>
            </Card>
            <TextSizeControls />
        </div>
    </div>
  );
}
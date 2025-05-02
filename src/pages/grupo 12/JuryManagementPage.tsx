import type React from "react";
import LayoutAplication from "@/layouts/LayoutAplication";
import { JuryManagementTable} from "./tabla";
import { useEffect, useState } from "react";

const JuryManagementPage: React.FC = () => {
  const breadcrumbs = [{ label: "Jurados", href: "/jurados" }];

  const [data, setData] = useState<Data>({
    titulo: "",
    nombreTabla: "",
    nombreColumnas: {},
    filas: [],
  });

  // mock data waiting for backend
  const response = {
    data: [
      { name: "Ana", correo: "ana@example.com", id_estado_confirmacion: "Confirmado" },
      { name: "Luis", correo: "luis@example.com", id_estado_confirmacion: "Pendiente" },
    ],
    error: null,
  };

    console.log("data", data);  
    const fetchJurados = async () => {
      let { data: Jurados, error } = response
      if (Jurados) {
        setData({
          titulo: "Jurados",
          nombreTabla: "usuarios",
          nombreColumnas: { name: "Nombre", correo: "Correo", id_estado_confirmacion: "Estado" },
          filas: Jurados,
        });
      }
    };
    
    useEffect(() => {
      fetchJurados();
    }, []);
    
  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      <JuryManagementTable data={data}/>
    </LayoutAplication>
  );
};

export default JuryManagementPage;
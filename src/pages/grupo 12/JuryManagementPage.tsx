import type React from "react";
import LayoutAplication from "@/layouts/LayoutAplication";
import { Tabla , Data} from "./TableJuryManagement";
import { useEffect, useState } from "react";

const JuryManagementPage: React.FC = () => {
  const breadcrumbs = [{ label: "Materias", href: "/materias" }];

  const [data, setData] = useState<Data>({
    titulo: "",
    nombreTabla: "",
    nombreColumnas: {},
    filas: [],
  });

  const response = {
    data: [
      { name: "Ana", correo: "ana@example.com", id_estado_confirmacion: "Confirmado" },
      { name: "Luis", correo: "luis@example.com", id_estado_confirmacion: "Pendiente" },
    ],
    error: null,
  };


  const filas: Data["nombreColumnas"] = {};
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
      <h1>Jurados</h1>
      {/* <Tabla data={data}/> */}
    </LayoutAplication>
  );
};

export default JuryManagementPage;
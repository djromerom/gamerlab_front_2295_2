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


  // {
  //   "id": "fbafb63a-cad4-49e3-8792-e266cbdc0426",
  //   "name": "jurado",
  //   "email": "jurado@jurado.com",
  //   "confirmationStatusId": 1,
  //   "updatedAt": "2025-05-03T02:35:18.646Z",
  //   "_count": {
  //       "evaluationsSubmitted": 0
  //   }

  const fetchJurados = async () => {
    try {
      // console.log(token);
      const response = await fetch("http://localhost:3000/juror", {credentials: "include",});  
      if (!response.ok){
        throw new Error(`Error HTTP: ${response.status}`);
      }
      const jurados = await response.json();
      for (const jurado of jurados) {
        jurado._count = jurado._count.evaluationsSubmitted;
        switch (jurado.confirmationStatusId) {
          case 1:
            jurado.confirmationStatusId = "Aceptado";
            break;
          case 2:
            jurado.confirmationStatusId = "Pendiente";
            break;
          default:
            jurado.confirmationStatusId = "Expirado";
        }
        jurado.updatedAt = new Date(jurado.updatedAt).toLocaleString("es-ES", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      setData({
        titulo: "Jurados",
        nombreTabla: "usuarios",
        nombreColumnas: {
          id: "ID",
          name: "Nombre",
          email: "Correo",
          confirmationStatusId: "Estado",
          updatedAt: "Ultima conexión",
          _count: "Juegos revisados",
        },
        filas: jurados,
      });
    }
    catch (error) {
      console.error("Error al cargar jurados:", error);
    }  
  };
  console.log("data", data);
 
  useEffect(() => {
    fetchJurados();
  }, []);

  console.log("data", data);
  
  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      <JuryManagementTable data={data} onDataChanged={fetchJurados}/>
    </LayoutAplication>
  );
};

export default JuryManagementPage;
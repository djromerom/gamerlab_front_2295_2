import type React from "react";
import LayoutAplication from "@/layouts/LayoutAplication";
import { JuryManagementTable} from "./tabla";
import { useEffect, useState } from "react";
import { url } from "inspector";


// interface Jurado {
//   id: string;
//   name: string;
//   email: string;
//   confirmationStatus: string;
//   lastConnection: Date;
//   reviewedGames: number;
// };


const JuryManagementPage: React.FC = () => {
  const breadcrumbs = [{ label: "Jurados", href: "/jurados" }];

  const [data, setData] = useState<Data>({
  titulo: "",
  nombreTabla: "",
  nombreColumnas: {},
  filas: [],
  });

  const response = [
      {
        id: "1",
        name: "Juan Pérez",
        email: "juan.perez@example.com",
        confirmationStatus: "confirmed",
        lastConnection: new Date("2025-04-30T10:30:00Z").toLocaleString(),
        reviewedGames: 12,
      }
    ];

  const fetchJurados = async () => {
    try {
      // const response = await fetch("http://localhost:3000/jurados");
      // if (!response.ok){
      //   throw new Error(`Error HTTP: ${response.status}`);
      // }
      // const jurados: Jurado[] = await response.json();
      setData({
        titulo: "Jurados",
        nombreTabla: "usuarios",
        nombreColumnas: {
          id: "ID",
          name: "Nombre",
          email: "Correo",
          confirmationStatus: "Estado",
          lastConnection: "Ultima conexión",
          reviewedGames: "Juegos revisados",
        },
        filas: response,
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
  
  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      <JuryManagementTable data={data}/>
    </LayoutAplication>
  );
};

export default JuryManagementPage;
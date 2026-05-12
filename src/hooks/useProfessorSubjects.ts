import { useEffect, useState } from 'react';
import { toast } from "sonner";

export function useProfessorSubjects(defaultNRC:any=null){
  const [allNRCs, setAllNRCs] = useState<any[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [availableNRCs, setAvailableNRCs] = useState<any[]>([]);
  const [selectedNRC, setSelectedNRC] = useState<string>("");
  const [initialLoading, setInitialLoading] = useState(true);

  const fetchProfSubjects = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/my-subjects`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error("Error fetching available subjects");
      }
      const data = await response.json();
      setAvailableSubjects(data);
      // Extraer todos los NRCs incluidos en cada materia y anexar info de la materia
      const allNrcsFromSubjects = (data || []).flatMap((subject: any) => {
        const subjectId = subject.id || subject._id || subject.code;
        const subjectName = subject.name || subject.title || "";
        const nrcs = subject.nrcs || [];
        return nrcs.map((nrc: any) => ({
          ...nrc,
          subject: { id: subjectId, name: subjectName },
        }));
      });
      // Guardamos todos los NRCs en el estado (se usará para filtrado local)
      setAllNRCs(allNrcsFromSubjects);
      if (data.length > 0) {
        const initialSubjectName = data[0].name;
        setSelectedSubject(initialSubjectName);
        // Inicialmente filtramos los NRCs para la materia seleccionada
        const filtered = allNrcsFromSubjects.filter((n: any) => {
          const name = n.subject?.name || n.subjectName || n.name || "";
          return name && String(name).toLowerCase() === String(initialSubjectName).toLowerCase();
        });
        setAvailableNRCs(filtered);
        // Si hay exactamente un NRC para la materia, auto-seleccionarlo (salvo que venga initialNRC explícito)
        if (filtered.length === 1) {
          if (!(defaultNRC && defaultNRC !== "-")) {
            setSelectedNRC(filtered[0].code ?? filtered[0].id ?? "");
          }
        }
        // Si se pasó un NRC por props (defaultNRC), lo aplicamos si existe (tiene prioridad)
        if (defaultNRC && defaultNRC !== "-") {
          const match = allNrcsFromSubjects.find((x: any) => String(x.code) === String(defaultNRC) || String(x.id) === String(defaultNRC));
          if (match) setSelectedNRC(defaultNRC);
        }
      } else {
        toast.info("No se encontraron materias disponibles");
      }
    } catch (err) {
      console.error("Error fetching available Subjects:", err);
      toast.error("Error al cargar las materias");
    }
    finally {
      // Desactivamos la pantalla inicial de carga
      setInitialLoading(false);
    }
  }

  useEffect(() => {fetchProfSubjects()}, [])
  
  return {
    allNRCs,
    availableSubjects,
    selectedSubject,
    availableNRCs,
    selectedNRC,
    initialLoading,
    setAvailableNRCs,
    setSelectedNRC,
    setSelectedSubject
  };
};
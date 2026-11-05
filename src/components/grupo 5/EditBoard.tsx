import { apiFetch } from "@/lib/api";
"use client"
/**
 * EditBoard Component
 * -------------------
 * This component provides an interface for editing team information and managing its members.
 * It handles both the team’s videogame details (name, logo, repo URL, etc.)
 * and the members' personal and academic information (name, email, NRCs).
 */

import { useEffect, useRef, useState } from "react"
import LoadingScreen from "@/components/grupo 5/LoadingScreen"
import { toast } from "sonner"
import { useForm } from "react-hook-form";
import type { CombinedFormValues } from "@/lib/schemas";
import { getImageUrl, uploadImage } from "../grupo 11/azureFile"
import TeamMembers from "./TeamMembers"
import { NRCOption, RawStudent, Student, UpdateStudentNrcsDto } from "@/types/teamMembers"
import { Team } from "@/types/teamVideogames";
import TeamVideogame from "./TeamVideogame";
import NotEnrolledNotice from "./NotEnrolledNotice";
import { NotEnrolledError, isNotEnrolledError } from "@/lib/notEnrolled";
import { fetchOwnTeam } from "@/lib/ownTeam";
import { useAuth } from "@/contexts/AuthContext";

export default function EditBoard() {
  const { user } = useAuth();
  //context and refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  //Member information
  const [students, setStudents] = useState<Student[]>([])
  const [nrcOptions, setNrcOptions] = useState<NRCOption[]>([])
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editStudentCode, setEditStudentCode] = useState("");
  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [editNrcs, setEditNrcs] = useState<string[]>([])
  const [searchNrc, setSearchNrc] = useState("")

  //Team videogame information
  const [loading, setLoading] = useState(false)
  const [notEnrolled, setNotEnrolled] = useState(false)
  const [teamLoadError, setTeamLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadingForm, setLoadingForm] = useState(false)
  const [edit, setEdit] = useState < boolean | null >(false) //Switch to active the video game information editing form
  const [infoEquipo, setInfoEquipo] = useState< Team >({ id: '', teamName: '', videogameName: '', description: '', status: '', logoUrl: '', videoUrl: '', repoUrl: '', additionalImages: [] })

  //Manage image
  const { setValue, watch } = useForm<CombinedFormValues>();
  const currentFiles = watch("files") || [];
  const [infoEditEquipo, setInfoEditEquipo] = useState< Team >(infoEquipo)
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState(false);
  const [ additionalImages, setAdditionalImages ] = useState<File[]>([])


  //Triggered when a new file is selected.
  //Opens the cropper modal for image editing.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      setSelectedFile(files[0]);
      setCropperOpen(true);
      e.target.value = "";
  };

  const handleCroppedImage = (croppedFile: File) => {
    setValue("files", [croppedFile]);
    setFileError(false);
  };


  const handleDeleteFile = () => {
    setValue("files", []);
  };

  //PATCH request to update NRC codes for a given student.
  const updateStudentNrcs = async ({ id, nrcCodes }: UpdateStudentNrcsDto) => {
    try {
      const response = await apiFetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/students/members/${id}/nrcs`, {
        method: 'PATCH',
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nrcCodes }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar los NRCs del estudiante');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en PATCH:', error);
    }
  };

  //PATCH request to update basic student information (email).
  const updateStudentBasics = async ({id, email}: { id: string; email: string }) => {
    const response = await apiFetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/teams/${infoEquipo.id}/members/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({email: email}),
    });
    if (!response.ok) {
      throw new Error("Error al actualizar los datos del estudiante");
    }
    return response.json();
  };

  //Fetches full team data (including videogame details) from the backend.
  const getInfoEquipo = async () => {
    const ownTeam = await fetchOwnTeam(user?.id ?? "");
    const response = await apiFetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/teams/${ownTeam.id}/full`, {
      method: 'GET',
      credentials: "include",
    })

    // ARK-128: sin equipo en la edición activa (p. ej. participó en una edición anterior)
    if (response.status === 404) {
      throw new NotEnrolledError();
    }
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message || "No se pudieron cargar los datos del equipo.");
    }
    const data = await response.json()
    const dataInfoEquipo = {
      id: data.id,
      teamName: data.teamName,
      videogameName: data.videogame.name, 
      description: data.videogame.description,
      status: data.videogame.videogameStatus.status,
      logoUrl: data.videogame.logoUrl,
      videoUrl: data.videogame.videoUrl,
      repoUrl: data.videogame.repoUrl,
      additionalImages: data.videogame.additionalImages
    }
    setInfoEquipo(dataInfoEquipo)
    return dataInfoEquipo
  }

  //Uploads the team's logo image to Azure, then updates the team’s general information via PATCH.
  async function uploadInfoTeam(currentImageUrls?: string[]) {
    setLoadingForm(true)
  
    try {
      const uploadedFileUrls = []
      const uploadedAdditional = []
      
      for (const file of currentFiles) {
        const uploadResult = await uploadImage(file);
        const urlResult = await getImageUrl(uploadResult.id);
        uploadedFileUrls.push(urlResult.url);
      }
      for (const file of additionalImages) {
        const uploadResult = await uploadImage(file);
        const urlResult = await getImageUrl(uploadResult.id);
        uploadedAdditional.push(urlResult.url);
      }

      // Use currentImageUrls if provided, otherwise use original logic
      const finalImageUrls = currentImageUrls 
        ? [...currentImageUrls, ...uploadedAdditional]
        : [...infoEquipo.additionalImages, ...uploadedAdditional];
      
      const payload = {
        teamName: infoEditEquipo.teamName,
        videogame: {
          vgName: infoEditEquipo.videogameName,
          description: infoEditEquipo.description,
          logoUrl: uploadedFileUrls[0] || infoEquipo.logoUrl,
          videoUrl: infoEditEquipo.videoUrl,
          repoUrl: infoEditEquipo.repoUrl,
          additionalImages: finalImageUrls
        }
      };
  
      const response = await apiFetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/teams/${infoEquipo.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (!response.ok) {
        toast.error("Hubo un error al actualizar los datos.", { id: 777 })
        throw new Error ('Error')
      } else {
        const dataEquipo = await getInfoEquipo();
        setInfoEquipo(dataEquipo);
        setInfoEditEquipo(dataEquipo);
        toast.success("El cambio se hizo de manera satisfactoria.", { id: 777 })
      }
    } catch (error) {
      let description = '';
      if (error instanceof Error && error.message.includes("413")) {
        description = "Uno de los archivos es demasiado grande. El tamaño máximo permitido es 1MB.";
      } else {
        description = error instanceof Error ? error.message : String(error);
      }
      toast.error(`Ocurrió un error: ${description}`, { id: 777 });
      console.error("Error al subir la información del equipo:", error);
    } finally {
      setLoadingForm(false)
    }
  }

  function handleSaveNrcs(
    editStudent: Student | null,
    editNrcs: string[],
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>,
    setEditStudent: (s: Student | null) => void
  ) {
    if (editStudent) {
      setStudents(students =>
        students.map(s =>
          s.id === editStudent.id ? { ...s, nrcs: editNrcs } : s
        )
      );
      updateStudentNrcs({ id: editStudent.id, nrcCodes: editNrcs });
      toast.success("Datos actualizados", { style: { background: "#22c55e", color: "#fff" } });
      setEditStudent(null);
    }
  }
  
  //Fetches both team and member data when the component mounts.
  useEffect(() => {  
    const fetchData = async () => {
      try {
        setLoading(true);
        setTeamLoadError("");
        const dataEquipo = await getInfoEquipo()
        setInfoEquipo(dataEquipo)
        setInfoEditEquipo(dataEquipo)
        setLoading(true);

        const studentsRes = await apiFetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/students/members`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        })
        const nrcsRes = await apiFetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/nrcs/select-options`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        })

        if (!studentsRes.ok || !nrcsRes.ok) throw new Error("Error al cargar datos");

        const studentsData = await studentsRes.json();
        const nrcsData = await nrcsRes.json();

        setNrcOptions(
          Array.isArray(nrcsData)
            ? nrcsData.map((nrc: any) => ({ code: nrc.code }))
            : []
        );

        setStudents(
          studentsData.map((s: RawStudent) => ({
            id: s.id.toString(),
            name: `${s.firstName} ${s.lastName}`,
            nrcs: s.nrcs.map((nrc) => nrc.code),
            firstName: s.firstName,
            lastName: s.lastName,
            email: s.email,
            studentCode: s.studentCode,
          }))
        )
      } catch (error) {
        // ARK-128: sin equipo en la edición activa no es una falla; se muestra el aviso
        if (isNotEnrolledError(error)) {
          setNotEnrolled(true);
          return;
        }
        const message = error instanceof Error ? error.message : "No se pudieron cargar los datos del equipo.";
        console.error(message, error);
        setTeamLoadError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [loadAttempt]);

  if (loading) {
    return <div className="w-full max-w-3xl mx-auto p-4"><LoadingScreen /></div>
  }

  if (notEnrolled) {
    return (
      <div className="w-full max-w-3xl mx-auto p-4">
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border p-8 text-center">
          <h2 className="text-lg font-medium text-foreground">No hay equipo para editar</h2>
          <NotEnrolledNotice />
        </div>
      </div>
    )
  }

  if (teamLoadError) {
    return (
      <div className="w-full max-w-3xl mx-auto p-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          <p>{teamLoadError}</p>
          <button
            type="button"
            className="mt-3 rounded-md bg-red-600 px-4 py-2 text-white"
            onClick={() => setLoadAttempt((attempt) => attempt + 1)}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (loadingForm) {
    toast.loading("Subiendo datos...", { id: 777 })
  }

  return (
    <div className="w-full min-w-[400px] max-w-3xl mx-auto p-4 space-y-[40px]">
      <TeamMembers 
        students={students} 
        setStudents={setStudents} 
        editStudent={editStudent}
        setEditStudent={setEditStudent}
        editNrcs={editNrcs}
        setEditNrcs={setEditNrcs}
        editFirstName={editFirstName}
        setEditFirstName={setEditFirstName}
        editLastName={editLastName}
        setEditLastName={setEditLastName}
        editEmail={editEmail}
        setEditEmail={setEditEmail}
        editStudentCode={editStudentCode}
        setEditStudentCode={setEditStudentCode}
        nrcOptions={nrcOptions}
        setNrcOptions={setNrcOptions}
        searchNrc={searchNrc}
        setSearchNrc={setSearchNrc}
        updateStudentBasics={updateStudentBasics}
        handleSaveNrcs={handleSaveNrcs}
      />

      <TeamVideogame 
        edit={edit} setEdit={setEdit}
        infoEquipo={infoEquipo} setInfoEquipo={setInfoEquipo}
        infoEditEquipo={infoEditEquipo} setInfoEditEquipo={setInfoEditEquipo}
        fileInputRef={fileInputRef}
        currentFiles={currentFiles}
        fileError={fileError} setFileError={setFileError}
        selectedFile={selectedFile} setSelectedFile={setSelectedFile}
        cropperOpen={cropperOpen} setCropperOpen={setCropperOpen}
        additionalImages={additionalImages} setAdditionalImages={setAdditionalImages}
        handleFileChange={handleFileChange} handleDeleteFile={handleDeleteFile} uploadInfoTeam={uploadInfoTeam} handleCroppedImage={handleCroppedImage}
      />

      <h2 className="text-center">Puedes ver la información pública de tu videojuego <a href="/equipos" target="_blank" className="text-violet-700 hover:text-shadow-violet-300 hover:underline">aquí</a></h2>
    </div>
  )
}
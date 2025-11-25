export type Team = {
  id: string;
  teamName: string;
  videogameName: string;
  description: string;
  logoUrl: string;
  videoUrl: string;
  repoUrl: string;
  additionalImages: File[]
}

export interface TeamVideogameProps {
    edit: boolean | null,
    setEdit: React.Dispatch<React.SetStateAction<boolean | null>>,

    infoEquipo: Team,
    setInfoEquipo: React.Dispatch<React.SetStateAction<Team>>,

    infoEditEquipo: Team,
    setInfoEditEquipo: React.Dispatch<React.SetStateAction<Team>>,

    fileInputRef: React.RefObject<HTMLInputElement | null>,

    currentFiles: File[],

    fileError: boolean,
    setFileError: React.Dispatch<React.SetStateAction<boolean>>

    selectedFile: File | null,
    setSelectedFile: React.Dispatch<React.SetStateAction<File | null>>,

    cropperOpen: boolean,
    setCropperOpen: React.Dispatch<React.SetStateAction<boolean>>,

    additionalImages: File[],
    setAdditionalImages: React.Dispatch<React.SetStateAction<File[] | []>>,

    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleDeleteFile: () => void,
    uploadInfoTeam: () => void,
    handleCroppedImage: (croppedFile: File) => void
}
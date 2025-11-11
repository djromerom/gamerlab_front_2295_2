import { TeamVideogameProps } from "@/types/teamVideogames"
import FormEditVideogame from "./FormEditVideogame"
import CardTeamVideogame from "./CardTeamVideogame"

export default function TeamVideogame (
    { 
        edit, setEdit, 
        infoEquipo, setInfoEquipo, 
        infoEditEquipo, setInfoEditEquipo, 
        fileInputRef, 
        currentFiles, 
        fileError, setFileError,
        selectedFile, setSelectedFile,
        cropperOpen, setCropperOpen, 
        handleFileChange, handleDeleteFile, uploadInfoTeam, handleCroppedImage 
    } : TeamVideogameProps) {
    return (
        <>
            <CardTeamVideogame 
                infoEquipo={infoEquipo}
                infoEditEquipo={infoEditEquipo}
                setEdit={setEdit}
            />

            <FormEditVideogame 
                edit={edit} setEdit={setEdit}
                infoEquipo={infoEquipo} setInfoEquipo={setInfoEquipo}
                infoEditEquipo={infoEditEquipo} setInfoEditEquipo={setInfoEditEquipo}
                fileInputRef={fileInputRef}
                currentFiles={currentFiles}
                fileError={fileError} setFileError={setFileError}
                selectedFile={selectedFile} setSelectedFile={setSelectedFile}
                cropperOpen={cropperOpen} setCropperOpen={setCropperOpen}
                handleFileChange={handleFileChange} handleDeleteFile={handleDeleteFile} uploadInfoTeam={uploadInfoTeam} handleCroppedImage={handleCroppedImage}
            />
        </>
    )
}
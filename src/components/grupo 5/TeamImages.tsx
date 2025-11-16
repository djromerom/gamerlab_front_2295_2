import { useAuth } from "@/contexts/AuthContext"
import { useEffect, useState } from "react"
import { CircleX, Delete, DeleteIcon, Scroll, SquareX, X } from "lucide-react"
import { Button } from "../ui/button"
import { toast } from "sonner"

export const TeamImages = () => {
    const { user } = useAuth()
    const [images, setImages] = useState<String[]>([])
    const [data, setData ] = useState<any>()

    const [error, setError] = useState("")

    const getInfo = async () => {
        try {
            const response: any = await fetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/teams/${user?.id}/full`, {
                method: 'GET',
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            })
            
            const data = await response.json()
            if (!response.ok) {
                setError(`No fue posible obtener las imagenes: ${data.message}`)
            }
            setData(data)
            setImages(data.videogame.additionalImages)

        } catch (error) {
            setError(`Error: ${error}`,)
        }
    }

    const deleteImage = async (imageToDelete: String) => {
        try {
            if (data) {
                const uploadImages = images.filter(img => img !== imageToDelete)
                const payload = {
                    teamName: data.teamName,
                    videogame: {
                        vgName: data.videogame.name,
                        description: data.videogame.description,
                        logoUrl: data.videogame.logoUrl,
                        videoUrl: data.videogame.videoUrl,
                        repoUrl: data.videogame.repoUrl,
                        additionalImages: uploadImages
                    }
                };
            const response = await fetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/teams/${data.id}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                toast.error("Hubo un error al actualizar los datos.", { id: 777 })
                throw new Error ('Error')
            } else {
                setImages(uploadImages)
                toast.success("El cambio se hizo de manera satisfactoria.", { id: 777 })
            }
        }
        } catch (error) {
            toast.error(`${error}`)
        } finally {
            setTimeout(() => {window.location.reload()}, 1000); 
    }
        
    }

    useEffect(() => {
        getInfo()
    }, [])

    return(
        <>
            <h1 className="text-center font-bold text-xl">Mis imágenes</h1>
            <div className="grid grid-flow-col justify-start items-center w-full bg-transparent rounded-lg gap-5 overflow-x-auto overflow-y- flex-1 [&::-webkit-scrollbar]:h-1 pr-0
                [&::-webkit-scrollbar-track]:rounded-full
                [&::-webkit-scrollbar-track]:bg-gray-800
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-thumb]:bg-[#AC7CFF]/50
                [&::-webkit-scrollbar-thumb:hover]:bg-[#AC7CFF]
                "
                >
                {
                    images && (
                        images.map((image, index) => {
                            return (
                                <div key={index} className="relative flex h-[100px] w-[200px] md:h-[150px] md:w-[300px]">
                                    <Button
                                        
                                        onClick={() => deleteImage(image)}
                                        className="flex justify-center items-center w-[25px] h-[25px] bg-[#FF0050] hover:bg-[#FF0010] absolute top-0 right-0 m-2 opacity-75 cursor-pointer p-0">
                                        <X color="#FFFFFF"/>
                                    </Button>
                                    <img
                                        src={`${image}`} 
                                        alt={`${image}`} 
                                        className="h-[100px] w-[200px] md:h-[150px] md:w-[300px] rounded-lg object-cover"
                                    />
                                </div>
                            )
                        })
                    )
                }

                {
                    error && (
                        <h2 className="text-center text-red-500">{error}</h2>
                    )
                }
            </div>
        </>
    )
}
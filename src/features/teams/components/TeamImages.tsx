import { SetStateAction } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

export const TeamImages = ({imageUrls, setImageUrls}: {imageUrls: string[], setImageUrls: React.Dispatch<SetStateAction<string[]>>}) => {

    const deleteImage = async (imageToDelete: String) => {
        const uploadImages = imageUrls.filter(img => img !== imageToDelete);
        setImageUrls(uploadImages);
    }

    return(
        <>
            <h1 className="text-left font-bold text-lg">Mis imágenes</h1>
            <div className="grid grid-flow-col justify-start items-center w-full bg-transparent rounded-lg gap-5 overflow-x-auto overflow-y- flex-1 [&::-webkit-scrollbar]:h-1 pr-0
                [&::-webkit-scrollbar-track]:rounded-full
                [&::-webkit-scrollbar-track]:bg-gray-800
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-thumb]:bg-[#AC7CFF]/50
                [&::-webkit-scrollbar-thumb:hover]:bg-[#AC7CFF]
                "
                >
                {
                    imageUrls && (
                        imageUrls.map((image, index) => {
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
            </div>
        </>
    )
}
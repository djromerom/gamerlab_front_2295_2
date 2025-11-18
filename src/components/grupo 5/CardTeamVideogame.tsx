import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FaGithubAlt, FaYoutube } from "react-icons/fa"
import { Team } from "@/types/teamVideogames"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"

export default function CardTeamVideogame ({ infoEquipo, infoEditEquipo, setEdit } : {infoEquipo: Team, infoEditEquipo: Team, setEdit: React.Dispatch<React.SetStateAction<boolean | null>>}) {
    return (
        <Card className="w-full shadow-sm border pb-4 bg-transparent py-5 md:p-10">
            <CardContent>
                <div className="flex flex-col justify-center space-x-5 space-y-5">
                    <div className="flex justify-center items-center rounded-[20px] w-full space-x-5">
                        <Avatar className="w-[60px] h-[60px] bg-cover rounded-[20px]">
                            <AvatarImage src={infoEditEquipo.logoUrl || "/placeholder.svg"} alt={infoEquipo.teamName} />
                            <AvatarFallback>{infoEquipo.videogameName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        
                        <div>
                            <h2 className="font-bold text-[20px]">
                                {infoEquipo.videogameName.toUpperCase()}
                            </h2>
                            <h3 className="font-medium">{infoEquipo.teamName}</h3>
                        </div>
                    </div>
                    <div className="w-full">
                        <p className="text-[12px] mt-3 text-center">
                            {infoEquipo.description}
                        </p>
                    </div>
                    <div className="flex justify-center items-center w-full space-x-5 p-5">
                        {
                            infoEquipo.repoUrl &&
                            (
                                <a href={infoEquipo.repoUrl} target="_blank">
                                    <FaGithubAlt size={25} className="cursor-pointer hover:text-[#6e5494]" />
                                </a>
                            )
                        }
                        {
                            infoEquipo.videoUrl &&
                            (
                                <a href={infoEquipo.videoUrl} target="_blank">
                                    <FaYoutube size={25} className="cursor-pointer hover:text-[#FF0000]"/>
                                </a>
                            )
                        }
                    </div>
                </div>
                <Button className="w-full cursor-pointer" onClick={()=>setEdit(true)}>
                    Editar
                </Button>
            </CardContent>
        </Card>
    )
}
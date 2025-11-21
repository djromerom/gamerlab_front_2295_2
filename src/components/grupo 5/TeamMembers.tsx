import { TeamMembersProps } from "@/types/teamMembers"
import CardTeamMember from "./CardTeamMembers"
import FormEditMembers from "./FormEditMembers"


export default function TeamMembers ({ 
    students, setStudents,
    editStudent, setEditStudent, 
    editNrcs, setEditNrcs, 
    editFirstName, setEditFirstName, 
    editLastName, setEditLastName, 
    editEmail, setEditEmail, 
    editStudentCode, setEditStudentCode, 
    nrcOptions, setNrcOptions, 
    searchNrc, setSearchNrc,
    updateStudentBasics,
    handleSaveNrcs
} : TeamMembersProps) {
    return (
        <>
        <CardTeamMember 
            students={students} 
            nrcOptions={nrcOptions} 
            setEditStudent={setEditStudent}
            setEditNrcs={setEditNrcs}
            setEditFirstName={setEditFirstName}
            setEditLastName={setEditLastName}
            setEditEmail={setEditEmail}
            setEditStudentCode={setEditStudentCode} />
            
            <FormEditMembers
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
        </>
    )
}
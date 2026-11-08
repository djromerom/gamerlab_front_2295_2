export interface Student {
    id: string
    firstName: string
    lastName: string
    email: string
    studentCode: string
    nrcs: string[]
}

export type NRCOption = {
    code: string
}

export type RawStudent = {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    studentCode: string;
    nrcs: { code: string }[]; // Suponiendo que cada NRC tiene un campo `code`
};

export type UpdateStudentNrcsDto = {
    id: string;
    nrcCodes: string[];
};

export interface TeamMembersProps {
    students: Student[]
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>

    editStudent: Student | null
    setEditStudent: React.Dispatch<React.SetStateAction<Student | null>>

    editNrcs: string[]
    setEditNrcs: React.Dispatch<React.SetStateAction<string[]>>

    editFirstName: string
    setEditFirstName: React.Dispatch<React.SetStateAction<string>>

    editLastName: string
    setEditLastName: React.Dispatch<React.SetStateAction<string>>

    editEmail: string
    setEditEmail: React.Dispatch<React.SetStateAction<string>>

    editStudentCode: string
    setEditStudentCode: React.Dispatch<React.SetStateAction<string>>

    nrcOptions: NRCOption[]
    setNrcOptions: React.Dispatch<React.SetStateAction<NRCOption[]>>

    searchNrc: string
    setSearchNrc: React.Dispatch<React.SetStateAction<string>>

    updateStudentBasics: (data: { id: string; email: string }) => Promise<any>
    handleSaveNrcs: (editStudent: Student | null, editNrcs: string[], setStudents: React.Dispatch<React.SetStateAction<Student[]>>, setEditStudent: (s: Student | null) => void ) => Promise<void>
}
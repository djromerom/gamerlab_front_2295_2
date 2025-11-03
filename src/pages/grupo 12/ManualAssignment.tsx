"use client";

import LayoutAplication from "@/layouts/LayoutAplication";
import { useEffect, useState } from "react";
import LoadingScreen from "@/components/grupo 5/LoadingScreen";
import AssignmentLayout  from "./AssignmentLayout";


export const ManualAssignmentPage = () => {
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [assigmentsData, setAssignmentsData] = useState<[{}] | null>([{'hola':'hola'}]);
    const [error, setError] = useState<string | null>(null);


    const breadcrumbs = [{ label: "Asignar a jurados", href: "/asignacion-jurados" }];
    return (
        <LayoutAplication breadcrumbs={breadcrumbs}>
            {isPageLoading && !assigmentsData ? ( // Show full page loader only on initial load or when data is completely absent
                <LoadingScreen text="Cargando asignaciones..." />
            ) : (
                <>
                    {error && !assigmentsData && (
                        <div
                          className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 text-center"
                          role="alert">
                            <span className="font-medium">Error:</span> {error}
                        </div>
                    )}
                    {assigmentsData && (
                        
                        <AssignmentLayout
                            // judges={[{id: 'Ujksif22414df8e', firstName: 'Carlos', lastName: 'Arango', email: 'arangocarlos@uninorte.edu.co' , type: "Senior", teams: [{id: 'strin', name: 'string'}]}]}
                            // paginationMeta={{totalItems: 1, itemsOnCurrentPage: 1, currentPage: 1, itemsPerPage: 10, totalPages: 1}}
                            // apiBaseUrl="/jurados"
                            // isDataLoading={isPageLoading}
                            // onLimitChange={() => {}}
                            // onPageChange={() => {}}
                            // refreshData={() => {}}
                        />
                    )}
                </>
            )}
        </LayoutAplication>
    )
}
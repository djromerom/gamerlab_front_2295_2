import LayoutAplication from "@/layouts/LayoutAplication"

export const SettingsAdmin = () => {
    const breadcrumbs = [{ label: "Configuraciones", href: "/settings-admin" }];
    return(
        <>
        <LayoutAplication breadcrumbs={breadcrumbs}>
            <div className="py-5 px-8 text-xl">
                <h1 className="text-xl font-medium">Configuraciones</h1>
            </div>
</LayoutAplication>
        </>
    )
}
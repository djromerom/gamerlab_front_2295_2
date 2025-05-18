import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"; // Ajusta según tu estructura

interface BreadcrumbItemProps {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItemProps[] | null;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const fullItems: BreadcrumbItemProps[] = [
    { label: "Inicio", href: "/inicio" },
    ...(items || []),
  ];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {fullItems.map((item, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
              {item.href ? (
                <BreadcrumbLink to={item.href}>{item.label}</BreadcrumbLink>
              ) : (
                <span>{item.label}</span>
              )}
            </BreadcrumbItem>
            {index < fullItems.length - 1 && (
              <BreadcrumbSeparator className="hidden md:inline" />
            )}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default Breadcrumbs;

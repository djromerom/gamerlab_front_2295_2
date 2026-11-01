import { Label } from "@/components/ui/label";
import { getJurorCategoryLabel, getJurorTypeLabel, type JurorCategory, type JurorType } from "@/types/jurados";

const selectClassName =
  "border-input dark:bg-input/30 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50";
const optionClassName = "bg-white dark:bg-[#120e21]";

interface JurorCategoryTypeFieldsProps {
  idPrefix: string;
  jurorCategory: JurorCategory;
  jurorType: JurorType;
  onCategoryChange: (value: JurorCategory) => void;
  onTypeChange: (value: JurorType) => void;
  disabled?: boolean;
}

// Categoría y tipo de jurado, compartidos por los formularios Agregar y Editar de Personal → Jurados.
export const JurorCategoryTypeFields: React.FC<JurorCategoryTypeFieldsProps> = ({ idPrefix, jurorCategory, jurorType, onCategoryChange, onTypeChange, disabled }) => (
  <>
    <div className="flex flex-col gap-2">
      <Label htmlFor={`${idPrefix}-jurorCategory`} className="text-left font-medium">
        Categoría
      </Label>
      <select
        id={`${idPrefix}-jurorCategory`}
        value={jurorCategory}
        onChange={(e) => onCategoryChange(e.target.value as JurorCategory)}
        className={selectClassName}
        disabled={disabled}
      >
        <option value="JUNIOR" className={optionClassName}>{getJurorCategoryLabel("JUNIOR")}</option>
        <option value="SENIOR" className={optionClassName}>{getJurorCategoryLabel("SENIOR")}</option>
      </select>
      <p className="text-xs text-muted-foreground">
        Senior es solo para profesores que participan como jurados.
      </p>
    </div>
    <div className="flex flex-col gap-2">
      <Label htmlFor={`${idPrefix}-jurorType`} className="text-left font-medium">
        Tipo
      </Label>
      <select
        id={`${idPrefix}-jurorType`}
        value={jurorType}
        onChange={(e) => onTypeChange(e.target.value as JurorType)}
        className={selectClassName}
        disabled={disabled}
      >
        <option value="OFFICIAL" className={optionClassName}>{getJurorTypeLabel("OFFICIAL")}</option>
        <option value="BACKUP" className={optionClassName}>{getJurorTypeLabel("BACKUP")}</option>
      </select>
    </div>
  </>
);

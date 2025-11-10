

interface Edicion {
  id: string;
  año: number;
  semestre: string;
  nombre: string;
}

interface ComboBoxProps {
  ediciones: Edicion[];
  edicionSeleccionada: string;
  onChange: (id: string) => void;
}

export default function ComboBoxEdiciones({
  ediciones,
  edicionSeleccionada,
  onChange,
}: ComboBoxProps) {
  return (
    <div className="w-full md:w-1/2 mb-6">
      <label
        htmlFor="combo-ediciones"
        className="block mb-2 text-sm font-medium text-[#AC7CFF]"
      >
        Selecciona una edición
      </label>
      <select
        id="combo-ediciones"
        value={edicionSeleccionada}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black/30 border border-white/20 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#AC7CFF] transition"
      >
        {ediciones.map((ed) => (
          <option key={ed.id} value={ed.id}>
            {ed.año} — {ed.semestre}
          </option>
        ))}
      </select>
    </div>
  );
}

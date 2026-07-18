import { LockKeyhole, MapPinned, School, Waypoints } from "lucide-react";

interface PadronReadonlyFieldsProps {
  departamento: string;
  distrito: string;
  local: string;
  zona: string;
}

const fields = [
  {
    key: "departamento",
    label: "Departamento",
    icon: MapPinned,
  },
  {
    key: "distrito",
    label: "Distrito",
    icon: Waypoints,
  },
  {
    key: "zona",
    label: "Zona",
    icon: LockKeyhole,
  },
  {
    key: "local",
    label: "Local",
    icon: School,
  },
] as const;

function PadronReadonlyFields({ departamento, distrito, local, zona }: PadronReadonlyFieldsProps) {
  const values = {
    departamento,
    distrito,
    local,
    zona,
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => {
        const Icon = field.icon;

        return (
          <label className="block space-y-2" htmlFor={field.key} key={field.key}>
            <span className="font-body text-xs font-black uppercase text-neutral-600 dark:text-orange-100/80">
              {field.label}
            </span>
            <span className="relative block">
              <Icon
                aria-hidden="true"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-orange"
                size={19}
                strokeWidth={2.5}
              />
              <input
                className="min-h-12 w-full cursor-not-allowed rounded-panel border border-neutral-300 border-l-4 border-l-brand-orange bg-neutral-100 px-4 py-3 pl-12 font-body text-base font-black text-neutral-700 outline-none dark:bg-neutral-200"
                id={field.key}
                readOnly
                value={values[field.key]}
              />
            </span>
          </label>
        );
      })}
    </div>
  );
}

export default PadronReadonlyFields;

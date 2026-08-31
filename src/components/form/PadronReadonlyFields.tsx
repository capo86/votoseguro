import { Hash, LockKeyhole, MapPinned, School, Vote, Waypoints } from "lucide-react";

interface PadronReadonlyFieldsProps {
  departamento: string;
  distrito: string;
  local: string;
  zona: string;
  mesa?: string;
  orden?: string;
  tipoVoto?: string;
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

function PadronReadonlyFields({
  departamento,
  distrito,
  local,
  zona,
  mesa,
  orden,
  tipoVoto,
}: PadronReadonlyFieldsProps) {
  const values = {
    departamento,
    distrito,
    local,
    zona,
  };
  const hasVotingData = Boolean(mesa || orden || tipoVoto);

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
      {hasVotingData ? (
        <div className="grid gap-3 border-t border-neutral-200 pt-3 sm:col-span-2 sm:grid-cols-3 dark:border-white/10">
          <ReadonlyVotingField icon={Hash} label="Mesa" value={mesa || "A confirmar"} />
          <ReadonlyVotingField icon={Hash} label="Orden" value={orden || "A confirmar"} />
          <ReadonlyVotingField icon={Vote} label="Tipo de voto" value={tipoVoto || "A confirmar"} />
        </div>
      ) : null}
    </div>
  );
}

function ReadonlyVotingField({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Hash;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-panel border border-brand-orange/30 bg-brand-orange/5 px-3 py-2 dark:bg-brand-orange/10">
      <div className="flex items-center gap-2 text-brand-orange">
        <Icon aria-hidden="true" size={16} strokeWidth={2.6} />
        <span className="font-body text-[0.68rem] font-black uppercase">{label}</span>
      </div>
      <p className="mt-1 truncate font-body text-sm font-black text-brand-ink dark:text-white">{value}</p>
    </div>
  );
}

export default PadronReadonlyFields;

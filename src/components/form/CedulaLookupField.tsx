import { IdCard, Loader2, Search } from "lucide-react";
import type { UseFormRegisterReturn } from "react-hook-form";
import type { PadronLookupStatus } from "../../types/votante";
import Button from "../ui/Button";
import TextInput from "../ui/TextInput";

interface CedulaLookupFieldProps {
  error?: string;
  onLookup: () => void;
  register: UseFormRegisterReturn;
  status: PadronLookupStatus;
}

function CedulaLookupField({ error, onLookup, register, status }: CedulaLookupFieldProps) {
  const isLoading = status === "loading";

  return (
    <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
      <TextInput
        autoComplete="off"
        error={error}
        icon={<IdCard aria-hidden="true" size={20} strokeWidth={2.5} />}
        id="cedula"
        inputMode="numeric"
        label="Cedula"
        placeholder="1234567"
        {...register}
      />
      <Button
        className="md:min-w-40"
        icon={
          isLoading ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={18} strokeWidth={2.8} />
          ) : (
            <Search aria-hidden="true" size={18} strokeWidth={2.8} />
          )
        }
        isLoading={isLoading}
        onClick={onLookup}
      >
        Buscar
      </Button>
    </div>
  );
}

export default CedulaLookupField;

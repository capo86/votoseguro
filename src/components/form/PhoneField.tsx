import { Phone } from "lucide-react";
import type { UseFormRegisterReturn } from "react-hook-form";
import TextInput from "../ui/TextInput";

interface PhoneFieldProps {
  error?: string;
  register: UseFormRegisterReturn;
}

function PhoneField({ error, register }: PhoneFieldProps) {
  return (
    <TextInput
      autoComplete="tel"
      error={error}
      icon={<Phone aria-hidden="true" size={19} strokeWidth={2.6} />}
      id="telefono"
      inputMode="tel"
      label="Telefono"
      placeholder="0981123456"
      {...register}
    />
  );
}

export default PhoneField;

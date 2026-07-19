const TECHNICAL_EMAIL_DOMAIN = "votoseguro.local";

export function normalizeCedula(value: string) {
  return value.replace(/\D/g, "");
}

export function assertValidCedula(value: string) {
  const cedula = normalizeCedula(value);

  if (!/^\d{5,10}$/.test(cedula)) {
    throw new Error("Ingresa una cedula valida.");
  }

  return cedula;
}

export function authEmailFromCedula(value: string) {
  const cedula = assertValidCedula(value);

  return `${cedula}@${TECHNICAL_EMAIL_DOMAIN}`;
}

export function signInIdentifierToEmail(value: string) {
  const trimmedValue = value.trim();

  if (trimmedValue.includes("@")) {
    return trimmedValue;
  }

  return authEmailFromCedula(trimmedValue);
}

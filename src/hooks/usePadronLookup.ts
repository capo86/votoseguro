import { useCallback, useState } from "react";
import { buscarPorCedula, PadronNotFoundError } from "../lib/padronApi";
import type { PadronLookupStatus, PadronResponse } from "../types/votante";

export function usePadronLookup() {
  const [status, setStatus] = useState<PadronLookupStatus>("idle");
  const [data, setData] = useState<PadronResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (cedula: string) => {
    setStatus("loading");
    setData(null);
    setError(null);

    try {
      const response = await buscarPorCedula(cedula);
      setData(response);
      setStatus("found");
      return response;
    } catch (lookupError) {
      if (lookupError instanceof PadronNotFoundError) {
        setStatus("not_found");
        setError(lookupError.message);
        return null;
      }

      setStatus("error");
      setError(
        lookupError instanceof Error
          ? lookupError.message
          : "Ocurrio un error al consultar el padron.",
      );
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setData(null);
    setError(null);
  }, []);

  return {
    data,
    error,
    lookup,
    reset,
    status,
  };
}

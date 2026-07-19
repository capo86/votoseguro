import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, IdCard, Loader2, LockKeyhole, LogIn, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Theme } from "../../types/theme";
import Button from "../ui/Button";
import ThemeToggle from "../layout/ThemeToggle";

interface LoginPageProps {
  error?: string | null;
  isConfigured: boolean;
  isLoading: boolean;
  logoUrl: string;
  onSignIn: (identifier: string, password: string) => Promise<void>;
  onToggleTheme: () => void;
  theme: Theme;
}

interface LoginFormValues {
  identifier: string;
  password: string;
}

const loginSchema = z.object({
  identifier: z.string().min(5, "Ingresa tu cedula."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
});

function LoginPage({
  error,
  isConfigured,
  isLoading,
  logoUrl,
  onSignIn,
  onToggleTheme,
  theme,
}: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    defaultValues: {
      identifier: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    await onSignIn(values.identifier, values.password);
  };

  return (
    <main className="voto-page grid min-h-screen place-items-center bg-brand-field px-3 py-5 text-brand-ink dark:bg-brand-ink dark:text-white">
      <div className="voto-sunburst" aria-hidden="true" />

      <section className="voto-card relative z-10 w-full max-w-md rounded-panel border border-neutral-200 bg-white/[0.9] p-4 shadow-panel backdrop-blur sm:p-6 dark:border-brand-line dark:bg-neutral-900/[0.92]">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <img
              alt="PPC"
              className="h-14 w-14 rounded-panel bg-white object-contain p-1 ring-2 ring-brand-orange"
              src={logoUrl}
            />
            <div className="min-w-0">
              <p className="truncate font-body text-xs font-black uppercase text-brand-orange">
                VotoSeguro
              </p>
              <h1 className="truncate font-display text-2xl leading-none text-brand-ink dark:text-white">
                Acceso PPC
              </h1>
            </div>
          </div>
          <ThemeToggle onToggle={onToggleTheme} theme={theme} />
        </div>

        <div className="mb-5 voto-meter">
          <div className="voto-meter-ring">
            <ShieldCheck aria-hidden="true" size={34} strokeWidth={2.4} />
          </div>
          <div>
            <p className="font-body text-xs font-black uppercase text-neutral-500 dark:text-orange-100/70">
              Equipo autorizado
            </p>
            <p className="mt-1 font-body text-lg font-black leading-tight text-brand-ink dark:text-white">
              Ingresa con tu cedula y contraseña para acceder.
            </p>
          </div>
        </div>

        {!isConfigured ? (
          <div className="mb-4 flex items-center gap-2 rounded-panel border border-red-300/50 bg-red-50 px-4 py-3 font-body text-sm font-bold text-red-800 dark:border-red-300/30 dark:bg-red-500/10 dark:text-red-100">
            <AlertCircle aria-hidden="true" size={18} strokeWidth={2.6} />
            Falta configurar el acceso al sistema.
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 flex items-center gap-2 rounded-panel border border-red-300/50 bg-red-50 px-4 py-3 font-body text-sm font-bold text-red-800 dark:border-red-300/30 dark:bg-red-500/10 dark:text-red-100">
            <AlertCircle aria-hidden="true" size={18} strokeWidth={2.6} />
            {error}
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label
              className="block font-body text-xs font-black uppercase text-neutral-600 dark:text-orange-100/80"
              htmlFor="identifier"
            >
              Cedula
            </label>
            <div className="relative">
              <IdCard
                aria-hidden="true"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-orange"
                size={19}
                strokeWidth={2.6}
              />
              <input
                autoComplete="username"
                className="min-h-12 w-full rounded-panel border border-neutral-300 border-l-4 border-l-brand-orange bg-white px-4 py-3 pl-12 font-body text-base font-bold text-brand-ink outline-none transition placeholder:text-brand-muted focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/20 dark:bg-brand-field"
                id="identifier"
                inputMode="numeric"
                placeholder="Numero de cedula"
                type="text"
                {...register("identifier")}
              />
            </div>
            {errors.identifier?.message ? (
              <p className="font-body text-sm font-semibold text-red-700 dark:text-red-200">
                {errors.identifier.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              className="block font-body text-xs font-black uppercase text-neutral-600 dark:text-orange-100/80"
              htmlFor="password"
            >
              contraseña
            </label>
            <div className="relative">
              <LockKeyhole
                aria-hidden="true"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-orange"
                size={19}
                strokeWidth={2.6}
              />
              <input
                autoComplete="current-password"
                className="min-h-12 w-full rounded-panel border border-neutral-300 border-l-4 border-l-brand-orange bg-white px-4 py-3 pl-12 pr-12 font-body text-base font-bold text-brand-ink outline-none transition placeholder:text-brand-muted focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/20 dark:bg-brand-field"
                id="password"
                placeholder="Tu contraseña"
                type={showPassword ? "text" : "password"}
                {...register("password")}
              />
              <button
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-2 top-1/2 grid min-h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-neutral-500 transition hover:bg-neutral-100 hover:text-brand-orange focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange dark:hover:bg-black/10"
                onClick={() => setShowPassword((currentValue) => !currentValue)}
                type="button"
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" size={18} strokeWidth={2.6} />
                ) : (
                  <Eye aria-hidden="true" size={18} strokeWidth={2.6} />
                )}
              </button>
            </div>
            {errors.password?.message ? (
              <p className="font-body text-sm font-semibold text-red-700 dark:text-red-200">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <Button
            className="w-full"
            disabled={!isConfigured}
            icon={
              isLoading ? (
                <Loader2 aria-hidden="true" className="animate-spin" size={18} strokeWidth={2.8} />
              ) : (
                <LogIn aria-hidden="true" size={18} strokeWidth={2.8} />
              )
            }
            isLoading={isLoading}
            type="submit"
          >
            Ingresar
          </Button>
        </form>
      </section>
    </main>
  );
}

export default LoginPage;

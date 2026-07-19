import { type ColumnDef } from "@tanstack/react-table";
import { BarChart3, ChevronDown, Loader2, RefreshCcw, Trophy, Vote } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DataGrid from "../components/ui/DataGrid";
import {
  getDashboardTerritoryRows,
  getDashboardTopUsers,
  type DashboardTerritoryRow,
  type DashboardUserRow,
} from "../lib/adminPanelApi";

interface DepartmentSummary {
  cantidad: number;
  departamento: string;
  distritos: DashboardTerritoryRow[];
}

function PanelPage() {
  const [feedback, setFeedback] = useState("Panel administrativo listo.");
  const [isLoading, setIsLoading] = useState(true);
  const [territoryRows, setTerritoryRows] = useState<DashboardTerritoryRow[]>([]);
  const [topUsers, setTopUsers] = useState<DashboardUserRow[]>([]);

  const departmentSummaries = useMemo<DepartmentSummary[]>(() => {
    const grouped = new Map<string, DashboardTerritoryRow[]>();

    territoryRows.forEach((row) => {
      const currentRows = grouped.get(row.departamento) ?? [];
      currentRows.push(row);
      grouped.set(row.departamento, currentRows);
    });

    return Array.from(grouped.entries())
      .map(([departamento, distritos]) => ({
        cantidad: distritos.reduce((total, row) => total + row.cantidad, 0),
        departamento,
        distritos: [...distritos].sort((a, b) => b.cantidad - a.cantidad),
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [territoryRows]);

  const totalCargas = territoryRows.reduce((total, row) => total + row.cantidad, 0);
  const totalDepartamentos = departmentSummaries.length;
  const totalDistritos = territoryRows.length;
  const departmentChartData = departmentSummaries.slice(0, 8).map((department) => ({
    cantidad: department.cantidad,
    nombre: department.departamento,
  }));
  const userChartData = topUsers.map((user) => ({
    cantidad: user.cantidad,
    nombre: shortChartLabel(user.nombre),
  }));

  const territoryColumns = useMemo<ColumnDef<DashboardTerritoryRow>[]>(
    () => [
      {
        accessorKey: "departamento",
        header: "Departamento",
      },
      {
        accessorKey: "distrito",
        header: "Distrito",
      },
      {
        accessorKey: "cantidad",
        header: "Cargas",
        cell: ({ row }) => row.original.cantidad.toLocaleString("es-PY"),
      },
    ],
    [],
  );

  const userColumns = useMemo<ColumnDef<DashboardUserRow>[]>(
    () => [
      {
        accessorKey: "nombre",
        header: "Usuario",
        cell: ({ row }) => (
          <div className="min-w-56">
            <p className="font-display text-lg leading-tight text-brand-ink dark:text-white">
              {row.original.nombre}
            </p>
            <p className="mt-1 font-body text-xs font-black uppercase text-brand-orange">
              Cedula {row.original.cedula}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "cantidad",
        header: "Cargas",
        cell: ({ row }) => row.original.cantidad.toLocaleString("es-PY"),
      },
      {
        id: "territorio",
        header: "Territorio",
        cell: ({ row }) => `${row.original.departamento} / ${row.original.ciudad}`,
      },
      {
        accessorKey: "localidad",
        header: "Localidad",
      },
    ],
    [],
  );

  async function loadDashboard() {
    setIsLoading(true);
    setFeedback("Actualizando metricas.");

    try {
      const [territoryData, userData] = await Promise.all([
        getDashboardTerritoryRows(),
        getDashboardTopUsers(),
      ]);

      setTerritoryRows(territoryData);
      setTopUsers(userData);
      setFeedback(
        territoryData.length
          ? `${territoryData.length} distritos con cargas registradas.`
          : "Todavia no hay cargas de Voto Seguro.",
      );
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudo cargar el panel.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  return (
    <section className="space-y-4">
      <section className="voto-card rounded-panel border border-neutral-200 bg-white/[0.9] p-4 shadow-panel backdrop-blur sm:p-6 dark:border-brand-line dark:bg-neutral-900/[0.92]">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
          <div>
            <p className="font-body text-xs font-black uppercase text-brand-orange">Panel</p>
            <h2 className="mt-1 font-display text-3xl leading-none text-brand-ink sm:text-4xl dark:text-white">
              Dashboard administrativo
            </h2>
            <p className="mt-2 max-w-2xl font-body text-sm font-semibold text-neutral-600 dark:text-orange-50/70">
              Seguimiento de Voto Seguro por territorio y rendimiento de carga por usuario.
            </p>
          </div>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-panel border border-neutral-300 bg-white px-3 py-2 font-body text-sm font-black uppercase text-brand-ink transition hover:border-brand-orange hover:text-brand-orange dark:border-brand-line dark:bg-white/[0.06] dark:text-white"
            onClick={() => void loadDashboard()}
            type="button"
          >
            {isLoading ? (
              <Loader2 aria-hidden="true" className="animate-spin" size={16} strokeWidth={2.7} />
            ) : (
              <RefreshCcw aria-hidden="true" size={16} strokeWidth={2.7} />
            )}
            Actualizar
          </button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <MetricCard icon={<Vote aria-hidden="true" size={24} />} label="Votos seguros" value={totalCargas} />
        <MetricCard icon={<BarChart3 aria-hidden="true" size={24} />} label="Departamentos" value={totalDepartamentos} />
        <MetricCard icon={<ChevronDown aria-hidden="true" size={24} />} label="Distritos" value={totalDistritos} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <ChartPanel
          data={departmentChartData}
          description="Top departamentos por cantidad de Voto Seguro cargado."
          emptyMessage="Sin datos territoriales para graficar."
          isLoading={isLoading}
          title="Departamentos con mas carga"
        />
        <ChartPanel
          data={userChartData}
          description="Usuarios con mayor volumen de registros cargados."
          emptyMessage="Sin usuarios para graficar."
          isLoading={isLoading}
          title="Ranking de usuarios"
        />
      </section>

      <section className="voto-card rounded-panel border border-neutral-200 bg-white/[0.9] p-4 shadow-panel backdrop-blur sm:p-6 dark:border-brand-line dark:bg-neutral-900/[0.92]">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-start">
          <div>
            <p className="font-body text-xs font-black uppercase text-brand-orange">Territorio</p>
            <h3 className="font-display text-2xl text-brand-ink dark:text-white">
              Cargas por departamento
            </h3>
            <p className="mt-2 font-body text-sm font-semibold text-neutral-600 dark:text-orange-50/70">
              {feedback}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {isLoading ? (
            <div className="inline-flex min-h-20 items-center gap-3 rounded-panel border border-neutral-200 bg-white/70 p-4 font-body font-black text-brand-ink dark:border-brand-line dark:bg-black/[0.16] dark:text-white">
              <Loader2 aria-hidden="true" className="animate-spin text-brand-orange" size={22} />
              Cargando dashboard
            </div>
          ) : departmentSummaries.length === 0 ? (
            <div className="rounded-panel border border-neutral-200 bg-white/70 p-4 font-body font-black text-neutral-600 dark:border-brand-line dark:bg-black/[0.16] dark:text-orange-50/70">
              Todavia no hay datos para mostrar.
            </div>
          ) : (
            departmentSummaries.map((department) => (
              <DepartmentBlock department={department} key={department.departamento} />
            ))
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <section className="voto-card rounded-panel border border-neutral-200 bg-white/[0.9] p-4 shadow-panel backdrop-blur sm:p-6 dark:border-brand-line dark:bg-neutral-900/[0.92]">
          <div>
            <p className="font-body text-xs font-black uppercase text-brand-orange">Detalle</p>
            <h3 className="font-display text-2xl text-brand-ink dark:text-white">
              Distritos cargados
            </h3>
          </div>
          <div className="mt-5">
            <DataGrid
              columns={territoryColumns}
              data={territoryRows}
              emptyMessage="Sin distritos cargados."
              getRowKey={(row) => `${row.departamento}-${row.distrito}`}
              isLoading={isLoading}
              loadingMessage="Cargando distritos"
              renderMobileCard={(row) => <TerritoryCard row={row} />}
            />
          </div>
        </section>

        <section className="voto-card rounded-panel border border-neutral-200 bg-white/[0.9] p-4 shadow-panel backdrop-blur sm:p-6 dark:border-brand-line dark:bg-neutral-900/[0.92]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-body text-xs font-black uppercase text-brand-orange">Top 10</p>
              <h3 className="font-display text-2xl text-brand-ink dark:text-white">
                Usuarios que mas cargan
              </h3>
            </div>
            <Trophy aria-hidden="true" className="text-brand-orange" size={28} strokeWidth={2.7} />
          </div>
          <div className="mt-5">
            <DataGrid
              columns={userColumns}
              data={topUsers}
              emptyMessage="Sin usuarios con cargas."
              getRowKey={(row) => row.authUserId ?? `${row.cedula}-${row.nombre}`}
              isLoading={isLoading}
              loadingMessage="Cargando top usuarios"
              renderMobileCard={(row) => <TopUserCard row={row} />}
            />
          </div>
        </section>
      </section>
    </section>
  );
}

interface MetricCardProps {
  icon: JSX.Element;
  label: string;
  value: number;
}

function MetricCard({ icon, label, value }: MetricCardProps) {
  return (
    <article className="voto-card rounded-panel border border-neutral-200 bg-white/[0.9] p-4 shadow-panel backdrop-blur dark:border-brand-line dark:bg-neutral-900/[0.92]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-body text-xs font-black uppercase text-neutral-500 dark:text-orange-100/[0.58]">
            {label}
          </p>
          <p className="mt-1 font-display text-4xl leading-none text-brand-ink dark:text-white">
            {value.toLocaleString("es-PY")}
          </p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-panel bg-brand-orange text-brand-ink">
          {icon}
        </div>
      </div>
    </article>
  );
}

interface ChartDatum {
  cantidad: number;
  nombre: string;
}

interface ChartPanelProps {
  data: ChartDatum[];
  description: string;
  emptyMessage: string;
  isLoading: boolean;
  title: string;
}

function ChartPanel({ data, description, emptyMessage, isLoading, title }: ChartPanelProps) {
  return (
    <section className="voto-card rounded-panel border border-neutral-200 bg-white/[0.9] p-4 shadow-panel backdrop-blur sm:p-6 dark:border-brand-line dark:bg-neutral-900/[0.92]">
      <div>
        <p className="font-body text-xs font-black uppercase text-brand-orange">Grafico</p>
        <h3 className="font-display text-2xl text-brand-ink dark:text-white">{title}</h3>
        <p className="mt-2 font-body text-sm font-semibold text-neutral-600 dark:text-orange-50/70">
          {description}
        </p>
      </div>

      <div className="mt-5 h-[20rem] rounded-panel border border-neutral-200 bg-white/70 p-2 dark:border-brand-line dark:bg-black/[0.16]">
        {isLoading ? (
          <div className="grid h-full place-items-center font-body text-sm font-black text-brand-ink dark:text-white">
            <span className="inline-flex items-center gap-2">
              <Loader2 aria-hidden="true" className="animate-spin text-brand-orange" size={18} />
              Cargando grafico
            </span>
          </div>
        ) : data.length === 0 ? (
          <div className="grid h-full place-items-center px-4 text-center font-body text-sm font-black text-neutral-500 dark:text-orange-50/60">
            {emptyMessage}
          </div>
        ) : (
          <ResponsiveContainer height="100%" width="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ bottom: 8, left: 12, right: 18, top: 8 }}
            >
              <CartesianGrid horizontal={false} stroke="rgba(120, 113, 108, 0.22)" />
              <XAxis
                allowDecimals={false}
                axisLine={false}
                tick={{ fill: "#78716c", fontSize: 11, fontWeight: 800 }}
                tickLine={false}
                type="number"
              />
              <YAxis
                axisLine={false}
                dataKey="nombre"
                tick={{ fill: "#292524", fontSize: 11, fontWeight: 900 }}
                tickLine={false}
                type="category"
                width={92}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(242, 130, 12, 0.1)" }} />
              <Bar
                barSize={18}
                dataKey="cantidad"
                fill="#F2820C"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{
    value?: number | string;
  }>;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-panel border border-neutral-200 bg-white px-3 py-2 font-body text-sm shadow-panel dark:border-brand-line dark:bg-neutral-950">
      <p className="font-black text-brand-ink dark:text-white">{label}</p>
      <p className="mt-1 font-black text-brand-orange">
        {Number(payload[0].value ?? 0).toLocaleString("es-PY")} cargas
      </p>
    </div>
  );
}

interface DepartmentBlockProps {
  department: DepartmentSummary;
}

function DepartmentBlock({ department }: DepartmentBlockProps) {
  return (
    <details className="group rounded-panel border border-neutral-200 bg-white/75 p-4 dark:border-brand-line dark:bg-black/[0.16]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-xl leading-tight text-brand-ink dark:text-white">
            {department.departamento}
          </p>
          <p className="mt-1 font-body text-xs font-black uppercase text-brand-orange">
            {department.distritos.length} distritos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-display text-3xl text-brand-ink dark:text-white">
            {department.cantidad.toLocaleString("es-PY")}
          </span>
          <ChevronDown
            aria-hidden="true"
            className="text-brand-orange transition group-open:rotate-180"
            size={20}
            strokeWidth={2.8}
          />
        </div>
      </summary>

      <div className="mt-4 grid gap-2">
        {department.distritos.map((row) => (
          <div
            className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-panel border border-neutral-200 bg-white/70 px-3 py-2 font-body text-sm font-black text-neutral-700 dark:border-brand-line dark:bg-white/[0.04] dark:text-orange-50/80"
            key={`${row.departamento}-${row.distrito}`}
          >
            <span className="truncate">{row.distrito}</span>
            <span className="text-brand-orange">{row.cantidad.toLocaleString("es-PY")}</span>
          </div>
        ))}
      </div>
    </details>
  );
}

interface TerritoryCardProps {
  row: DashboardTerritoryRow;
}

function TerritoryCard({ row }: TerritoryCardProps) {
  return (
    <article className="rounded-panel border border-neutral-200 bg-white/75 p-4 dark:border-brand-line dark:bg-black/[0.16]">
      <p className="font-display text-xl text-brand-ink dark:text-white">{row.departamento}</p>
      <p className="mt-1 font-body text-sm font-black uppercase text-brand-orange">{row.distrito}</p>
      <p className="mt-3 font-display text-3xl leading-none text-brand-ink dark:text-white">
        {row.cantidad.toLocaleString("es-PY")}
      </p>
    </article>
  );
}

interface TopUserCardProps {
  row: DashboardUserRow;
}

function TopUserCard({ row }: TopUserCardProps) {
  return (
    <article className="rounded-panel border border-neutral-200 bg-white/75 p-4 dark:border-brand-line dark:bg-black/[0.16]">
      <p className="font-display text-xl leading-tight text-brand-ink dark:text-white">{row.nombre}</p>
      <p className="mt-1 font-body text-xs font-black uppercase text-brand-orange">
        Cedula {row.cedula}
      </p>
      <div className="mt-3 grid gap-2 text-sm font-semibold text-neutral-700 dark:text-orange-50/80">
        <span>{row.departamento} / {row.ciudad}</span>
        <span>Localidad: {row.localidad}</span>
      </div>
      <p className="mt-3 font-display text-3xl leading-none text-brand-ink dark:text-white">
        {row.cantidad.toLocaleString("es-PY")}
      </p>
    </article>
  );
}

function shortChartLabel(value: string) {
  const normalized = value.trim();

  if (normalized.length <= 18) {
    return normalized;
  }

  return `${normalized.slice(0, 17)}...`;
}

export default PanelPage;

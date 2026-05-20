import { useEffect, useMemo } from "react";
import {
  Briefcase,
  Database,
  LayoutTemplate,
  PlusCircle,
  Upload,
  PlayCircle,
  User,
} from "lucide-react";

import { useAuthStore } from "../store";
import { useDesignerStore } from "../designer/store";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export function DashboardView() {
  const setPage = useAuthStore((state) => state.setPage);
  const user = useAuthStore((state) => state.user);

  const members = useDesignerStore((state) => state.members);
  const savedDesigns = useDesignerStore((state) => state.savedDesigns);

  const loadMembersFromDb = useDesignerStore(
    (state) => state.loadMembersFromDb
  );

  const loadTemplatesFromDb = useDesignerStore(
    (state) => state.loadTemplatesFromDb
  );

  const loadFoldersFromDb = useDesignerStore(
    (state) => state.loadFoldersFromDb
  );

  const syncLocalData = useDesignerStore(
    (state) => state.syncLocalData
  );

  const organizationType = useDesignerStore(
    (state) => state.organizationType
  );

  useEffect(() => {
    void loadMembersFromDb().then(() => {
      void loadTemplatesFromDb().then(() => {
        void loadFoldersFromDb().then(() => {
          void syncLocalData();
        });
      });
    });
  }, [
    loadMembersFromDb,
    loadTemplatesFromDb,
    loadFoldersFromDb,
    syncLocalData,
  ]);

  const deptLabel = useMemo(
    () =>
      organizationType === "education"
        ? "Class"
        : "Department",
    [organizationType]
  );

  const deptLabelPlural = useMemo(
    () =>
      organizationType === "education"
        ? "Classes"
        : "Departments",
    [organizationType]
  );

  const chartData = useMemo(() => {
    const depts: Record<string, number> = {};

    members.forEach((m) => {
      const d = m.department || "Unassigned";
      depts[d] = (depts[d] || 0) + 1;
    });

    return Object.entries(depts)
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [members]);

  return (
    <div className="w-full min-w-0 h-full flex flex-col overflow-x-hidden overflow-y-auto custom-scrollbar bg-[#fdfaf5] p-4 sm:p-6 lg:p-10 gap-5 lg:gap-8">

      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 min-w-0">

        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-stone-900 tracking-tight leading-tight break-words">
            Welcome back
            {user
              ? `, ${user.workspaceName ||
              user.email.split("@")[0]
              }`
              : ""}
          </h1>

          <p className="text-stone-900 font-bold mt-1 text-sm sm:text-base lg:text-lg">
            Here is your workspace overview.
          </p>
        </div>

        <div data-tour="dashboard-new-design" className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full xl:w-auto">

          <button
            onClick={() => setPage("designer")}
            className="w-full sm:w-auto h-12 lg:h-14 bg-gradient-to-br from-[#1a5d1a] to-[#2d7a2d] text-white flex items-center justify-center gap-2 lg:gap-3 rounded-2xl px-4 lg:px-8 hover:scale-105 transition-all active:scale-95 font-black text-sm sm:text-base lg:text-lg whitespace-nowrap"
          >
            <PlusCircle className="h-4 sm:h-5 w-4 sm:w-5" />
            New Design
          </button>

          <button
            onClick={() => setPage("upload")}
            className="w-full sm:w-auto h-12 lg:h-14 bg-white text-[#1a5d1a] border-2 border-stone-100 flex items-center justify-center gap-2 lg:gap-3 rounded-2xl px-4 lg:px-8 hover:border-[#1a5d1a]/20 transition-all active:scale-95 font-black text-sm sm:text-base lg:text-lg whitespace-nowrap"
          >
            <Upload className="h-4 sm:h-5 w-4 sm:w-5" />
            Upload Data
          </button>
        </div>
      </div>

      {/* METRICS */}
      <div data-tour="dashboard-metrics" className="grid gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">

        <Metric
          label="Active Templates"
          value={savedDesigns.length}
          icon={LayoutTemplate}
        />

        <Metric
          label="Total Members"
          value={members.length}
          icon={Database}
        />

        <Metric
          label={deptLabelPlural}
          value={chartData.length}
          icon={Briefcase}
        />
      </div>

      {/* CHART + RECENT MEMBERS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6 min-w-0">

        {/* CHART CARD */}
        <div className="xl:col-span-2 bg-white rounded-[24px] lg:rounded-[32px] p-4 sm:p-6 lg:p-8 border border-white flex flex-col min-w-0 overflow-hidden min-h-[320px]">

          <h2 className="font-black text-xl lg:text-2xl text-stone-900 mb-4 lg:mb-6 shrink-0 flex items-center gap-3">
            <div className="w-1.5 lg:w-2 h-6 lg:h-8 bg-[#1a5d1a] rounded-full" />
            Members by {deptLabel}
          </h2>

          <div className="w-full h-[260px] sm:h-[320px] lg:h-full min-h-[260px]">

            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                    tick={{
                      fill: "#a8a29e",
                      fontSize: 10,
                      fontWeight: "bold",
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#a8a29e",
                      fontSize: 12,
                      fontWeight: "bold",
                    }}
                  />

                  <Tooltip
                    cursor={{
                      fill: "#fdfaf5",
                    }}
                    contentStyle={{
                      borderRadius: "20px",
                      border: "none",
                      boxShadow:
                        "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                      padding: "12px",
                    }}
                  />

                  <Bar
                    dataKey="count"
                    radius={[10, 10, 0, 0]}
                    maxBarSize={60}
                  >
                    {chartData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          index === 0
                            ? "#1a5d1a"
                            : "#2d7a2d"
                        }
                        opacity={1 - index * 0.1}
                      />
                    ))}
                  </Bar>

                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-stone-900 font-bold text-center px-4">
                No member data available
              </div>
            )}
          </div>
        </div>

        {/* RECENT MEMBERS */}
        <div className="bg-white rounded-[24px] lg:rounded-[32px] p-4 sm:p-6 lg:p-8 border border-white flex flex-col min-w-0 overflow-hidden min-h-[320px]">

          <div className="flex items-center justify-between mb-4 lg:mb-6 shrink-0 gap-3">

            <h2 className="font-black text-xl lg:text-2xl text-stone-900">
              Recent Members
            </h2>

            <button
              className="text-sm text-[#1a5d1a] hover:underline font-black transition-all shrink-0"
              onClick={() => setPage("upload")}
            >
              View All
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar flex flex-col">

            <div className="flex flex-col gap-3">

              {members.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center min-w-0 gap-3 lg:gap-4 bg-[#fdfaf5] hover:bg-white hover:scale-[1.02] border border-stone-100 rounded-[24px] lg:rounded-[28px] p-3 transition-all group"
                >

                  {m.profileImage ? (
                    <img
                      src={m.profileImage}
                      alt=""
                      className="h-10 lg:h-12 w-10 lg:w-12 rounded-2xl object-cover shrink-0 bg-white border-2 border-white group-hover:rotate-3 transition-transform"
                    />
                  ) : (
                    <div className="h-10 lg:h-12 w-10 lg:w-12 rounded-2xl bg-white flex items-center justify-center shrink-0 border-2 border-white text-stone-300">
                      <User className="h-6 w-6" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">

                    <p className="text-sm lg:text-base font-black text-stone-900 truncate tracking-tight">
                      {m.firstName} {m.lastName}
                    </p>

                    <p className="text-[10px] font-bold text-stone-900 truncate tracking-widest uppercase mt-0.5">
                      {m.idNumber ||
                        m.employeeId ||
                        "No ID"}
                    </p>
                  </div>
                </div>
              ))}

              {members.length === 0 && (
                <div className="flex h-full items-center justify-center text-stone-900 font-bold py-10 text-center px-4">
                  No members found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QUICK LINKS */}
      <div data-tour="dashboard-quicklinks" className="grid gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">

        <QuickLink
          icon={LayoutTemplate}
          label="Manage Designs"
          desc="Edit or create templates"
          onClick={() => setPage("designer")}
        />

        <QuickLink
          icon={Database}
          label="Manage Data"
          desc="Upload and preview data"
          onClick={() => setPage("upload")}
        />

        <QuickLink
          icon={PlayCircle}
          label="Bulk Generate"
          desc="Create print-ready files"
          onClick={() => setPage("generate")}
        />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof LayoutTemplate;
}) {
  return (
    <div className="bg-white p-5 lg:p-6 rounded-[24px] lg:rounded-[32px] border border-white flex items-center gap-4 lg:gap-5 hover:scale-[1.02] transition-all group min-w-0">

      <div className="flex h-14 lg:h-16 w-14 lg:w-16 shrink-0 items-center justify-center rounded-2xl lg:rounded-[24px] bg-[#fdfaf5] text-[#1a5d1a] group-hover:bg-gradient-to-br group-hover:from-[#1a5d1a] group-hover:to-[#2d7a2d] group-hover:text-white transition-all">

        <Icon className="h-6 lg:h-8 w-6 lg:w-8" />
      </div>

      <div className="min-w-0">

        <p className="text-[10px] lg:text-[11px] font-black text-stone-900 uppercase tracking-widest mb-0.5 break-words">
          {label}
        </p>

        <p className="text-3xl lg:text-4xl font-black text-stone-900 tracking-tighter leading-none">
          {value}
        </p>
      </div>
    </div>
  );
}

function QuickLink({
  icon: Icon,
  label,
  desc,
  onClick,
}: {
  icon: typeof LayoutTemplate;
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white p-4 lg:p-6 rounded-[24px] lg:rounded-[32px] border border-white hover:scale-[1.03] transition-all text-left group min-w-0 overflow-hidden"
    >

      <div className="mb-3 lg:mb-4 w-10 lg:w-12 h-10 lg:h-12 bg-[#fdfaf5] rounded-xl flex items-center justify-center text-stone-900 group-hover:bg-[#1a5d1a] group-hover:text-white transition-all">

        <Icon className="h-5 lg:h-6 w-5 lg:w-6" />
      </div>

      <h3 className="font-black text-lg lg:text-xl text-stone-900 mb-0.5 tracking-tight break-words">
        {label}
      </h3>

      <p className="text-[11px] lg:text-xs font-bold text-stone-900 leading-relaxed break-words">
        {desc}
      </p>
    </button>
  );
}
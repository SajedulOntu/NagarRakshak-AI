import { Wrench } from "lucide-react";

const statusMeta = {
  Pending: { color: "#ffb020", progress: 15 },
  "In Progress": { color: "#22d3ee", progress: 55 },
  Completed: { color: "#7cff6b", progress: 100 },
};

const defaultRepairs = [
  { id: "RPR-1042", issue: "Road resurfacing", location: "Mirpur Rd, Sec 10", team: "Field Team A", status: "In Progress" },
  { id: "RPR-1041", issue: "Drainage clearance", location: "Dhanmondi 27", team: "Field Team C", status: "Pending" },
  { id: "RPR-1038", issue: "Streetlight replacement", location: "Gulshan Ave", team: "Field Team B", status: "Completed" },
  { id: "RPR-1035", issue: "Debris removal", location: "Banani Rd 11", team: "Field Team A", status: "Completed" },
];

export default function RepairTracking({ repairs = defaultRepairs }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
        <Wrench size={18} className="text-cyan-400" />
        <span className="font-hud text-sm tracking-wide uppercase">Repair Tracking</span>
      </div>
      <div className="divide-y divide-white/5">
        {repairs.map((r) => {
          const meta = statusMeta[r.status];
          return (
            <div key={r.id} className="px-5 py-4 hover:bg-white/[0.03] transition">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-sm font-medium">{r.issue}</div>
                  <div className="text-xs text-gray-500">{r.location} · <span className="font-hud">{r.id}</span> · {r.team}</div>
                </div>
                <span className="text-[10px] font-hud px-2.5 py-1 rounded-full shrink-0"
                  style={{ background: `${meta.color}22`, color: meta.color }}>
                  {r.status.toUpperCase()}
                </span>
              </div>
              <div className="mt-2.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${meta.progress}%`, background: meta.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

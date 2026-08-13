import { motion } from "framer-motion";
import { BellRing, AlertOctagon, AlertTriangle, Info } from "lucide-react";

const severityMeta = {
  Critical: { icon: AlertOctagon, color: "#ff3b5c" },
  Warning: { icon: AlertTriangle, color: "#ffb020" },
  Info: { icon: Info, color: "#22d3ee" },
};

const defaultAlerts = [
  { severity: "Critical", message: "Major road collapse detected — Mirpur Rd, Sec 10", time: "2 min ago", unread: true },
  { severity: "Warning", message: "Rising waterlogging levels — Dhanmondi 27", time: "9 min ago", unread: true },
  { severity: "Info", message: "Drone DJI-04 battery below 30%", time: "18 min ago", unread: false },
  { severity: "Warning", message: "Streetlight outage cluster — Gulshan Ave", time: "40 min ago", unread: false },
];

export default function AlertSystem({ alerts = defaultAlerts }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
        <BellRing size={18} className="text-cyan-400" />
        <span className="font-hud text-sm tracking-wide uppercase">Alert System</span>
        <span className="ml-auto text-[10px] font-hud px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
          {alerts.filter((a) => a.unread).length} NEW
        </span>
      </div>
      <div className="divide-y divide-white/5">
        {alerts.map((a, i) => {
          const meta = severityMeta[a.severity];
          const Icon = meta.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.03] transition">
              <Icon size={16} style={{ color: meta.color }} className="mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm">{a.message}</div>
                <div className="text-[10px] text-gray-500 font-hud mt-0.5">{a.time}</div>
              </div>
              {a.unread && <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: meta.color }} />}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

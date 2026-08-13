import { motion } from "framer-motion";
import { Construction, AlertTriangle, CheckCircle2, AlertOctagon, Layers } from "lucide-react";

const typeMeta = {
  Pothole: { icon: Construction, color: "#f97316" },
  "Damaged Manhole": { icon: AlertTriangle, color: "#ffb020" },
  "Covered Manhole": { icon: CheckCircle2, color: "#22d3ee" },
  "Uncovered Manhole": { icon: AlertOctagon, color: "#ff3b5c" },
  "Patch Road": { icon: Layers, color: "#7cff6b" },
};

const defaultDetections = [
  { type: "Uncovered Manhole", location: "Mirpur Road, Sec 10", confidence: 97, time: "2 min ago" },
  { type: "Pothole", location: "Dhanmondi 27", confidence: 91, time: "9 min ago" },
  { type: "Damaged Manhole", location: "Gulshan Ave, Blk B", confidence: 85, time: "24 min ago" },
  { type: "Patch Road", location: "Banani Rd 11", confidence: 93, time: "38 min ago" },
  { type: "Covered Manhole", location: "Jatrabari Circle", confidence: 89, time: "51 min ago" },
];

export default function DetectionResults({ detections = defaultDetections }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
        <Construction size={18} className="text-cyan-400" />
        <span className="font-hud text-sm tracking-wide uppercase">AI Detection Results</span>
      </div>

      <div className="divide-y divide-white/5">
        {detections.map((d, i) => {
          const meta = typeMeta[d.type] || typeMeta.Pothole;
          const Icon = meta.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition">
              <div className="p-2 rounded-lg shrink-0" style={{ background: `${meta.color}22` }}>
                <Icon size={16} style={{ color: meta.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{d.type}</div>
                <div className="text-xs text-gray-500 truncate">{d.location}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold" style={{ color: meta.color }}>{d.confidence}%</div>
                <div className="text-[10px] text-gray-500 font-hud">{d.time}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

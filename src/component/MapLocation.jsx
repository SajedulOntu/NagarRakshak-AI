import { MapPin } from "lucide-react";

const defaultPins = [
  { label: "Mirpur Rd", x: 30, y: 35, color: "#ff3b5c" },
  { label: "Dhanmondi", x: 55, y: 60, color: "#22d3ee" },
  { label: "Gulshan Ave", x: 70, y: 25, color: "#ffb020" },
  { label: "Banani Rd", x: 40, y: 75, color: "#7cff6b" },
];

export default function MapLocation({ pins = defaultPins }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
        <MapPin size={18} className="text-cyan-400" />
        <span className="font-hud text-sm tracking-wide uppercase">Map Location</span>
      </div>
      <div className="relative aspect-video hud-grid-bg bg-black/40 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-40 h-40 rounded-full border border-cyan-500/20" />
          <div className="absolute w-64 h-64 rounded-full border border-cyan-500/10" />
        </div>
        {pins.map((p, i) => (
          <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            <span className="w-3 h-3 rounded-full animate-pulse-dot" style={{ background: p.color, boxShadow: `0 0 12px ${p.color}` }} />
            <span className="mt-1 font-hud text-[10px] text-gray-300 bg-black/50 px-1.5 py-0.5 rounded whitespace-nowrap">
              {p.label}
            </span>
          </div>
        ))}
      </div>
      <div className="px-5 py-2 text-[11px] text-gray-500 font-hud border-t border-white/10">
        Live map integration (Google Maps / Mapbox) pending — showing detection coordinates as placeholder pins.
      </div>
    </div>
  );
}

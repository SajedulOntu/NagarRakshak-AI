import { motion } from "framer-motion";
import { Video, Wifi, Battery, Gauge, MapPin } from "lucide-react";

export default function LiveDroneFeed({
  droneName = "DJI Mini 4K",
  connected = true,
  altitude = "42m",
  gps = "23.8103, 90.4125",
  battery = 78,
}) {
  const batteryColor = battery > 50 ? "#7cff6b" : battery > 20 ? "#ffb020" : "#ff3b5c";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Video size={18} className="text-cyan-400" />
          <span className="font-hud text-sm tracking-wide uppercase">{droneName} · Live Stream</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-hud">
          <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: connected ? "#7cff6b" : "#ff3b5c" }} />
          <span style={{ color: connected ? "#7cff6b" : "#ff3b5c" }}>{connected ? "CONNECTED" : "OFFLINE"}</span>
        </div>
      </div>

      <div className="relative aspect-video bg-black/60 overflow-hidden">
        <div className="absolute inset-0 hud-grid-bg opacity-40" />
        <motion.div animate={{ opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 2.5, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-500">
          <Video size={40} />
          <span className="font-hud text-xs tracking-widest">{connected ? "AWAITING VIDEO FEED" : "NO SIGNAL"}</span>
        </div>
        <div className="absolute top-3 left-3 font-hud text-[11px] text-cyan-300 bg-black/40 px-2 py-1 rounded">
          REC ● {new Date().toLocaleTimeString()}
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1 font-hud text-[11px] text-gray-300 bg-black/40 px-2 py-1 rounded">
          <Wifi size={12} /> {connected ? "STRONG" : "LOST"}
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10">
        <div className="p-4 flex flex-col items-center gap-1">
          <Gauge size={16} className="text-cyan-400" />
          <span className="text-sm font-bold">{altitude}</span>
          <span className="text-[10px] text-gray-500 font-hud uppercase">Altitude</span>
        </div>
        <div className="p-4 flex flex-col items-center gap-1">
          <MapPin size={16} className="text-cyan-400" />
          <span className="text-sm font-bold font-hud">{gps}</span>
          <span className="text-[10px] text-gray-500 font-hud uppercase">GPS</span>
        </div>
        <div className="p-4 flex flex-col items-center gap-1">
          <Battery size={16} style={{ color: batteryColor }} />
          <span className="text-sm font-bold" style={{ color: batteryColor }}>{battery}%</span>
          <span className="text-[10px] text-gray-500 font-hud uppercase">Battery</span>
        </div>
      </div>
    </div>
  );
}

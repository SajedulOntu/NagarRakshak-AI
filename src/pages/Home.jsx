import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Drone,
  ScanEye,
  Building2,
  BellRing,
  Radar,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: ScanEye,
    title: "AI Hazard Detection",
    desc: "Computer vision models scan drone footage in real time to flag potholes, road damage, and infrastructure faults automatically.",
    color: "#22d3ee",
  },
  {
    icon: Building2,
    title: "Multi-Authority Access",
    desc: "Super Admin, DNCC, WASA, and Maintenance teams each get a dedicated dashboard tuned to their responsibilities.",
    color: "#ffb020",
  },
  {
    icon: BellRing,
    title: "Instant Alerts",
    desc: "The moment an issue is detected, the right authority is notified with location, severity, and imagery attached.",
    color: "#ff3b5c",
  },
  {
    icon: Radar,
    title: "Live Fleet Monitoring",
    desc: "Track every drone mission as it happens — coverage zones, flight status, and mission history in one feed.",
    color: "#7cff6b",
  },
];

const stats = [
  { label: "Drone Missions Logged", value: "2,456+" },
  { label: "Issues Auto-Detected", value: "128" },
  { label: "Authorities Connected", value: "4" },
  { label: "Avg. Response Time", value: "< 2 hrs" },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#020617] hud-grid-bg text-white overflow-hidden">

      {/* Nav */}
      <div className="border-b border-white/10 backdrop-blur-xl bg-white/[0.03] relative z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚁</span>
            <span className="font-display font-bold tracking-wide bg-gradient-to-r from-cyan-400 via-white to-blue-400 text-transparent bg-clip-text">
              NAGARRAKSHAK AI
            </span>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="px-5 py-2 rounded-lg border border-cyan-400/40 text-cyan-300 text-sm font-hud hover:bg-cyan-400/10 transition"
          >
            Access Portal
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-20 relative">

        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"
        />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="text-center relative z-10"
        >
          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="flex justify-center mb-8"
          >
            <div className="p-6 rounded-full bg-cyan-500/20" style={{ boxShadow: "0 0 50px -10px #22d3ee" }}>
              <Drone size={70} className="text-cyan-400" />
            </div>
          </motion.div>

          <div className="flex justify-center items-center gap-2 mb-5 text-green-400 text-sm font-hud">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-dot" />
            SYSTEM ONLINE
          </div>

          <h1 className="font-display text-5xl sm:text-6xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            NAGARRAKSHAK AI
          </h1>

          <h2 className="mt-6 text-xl sm:text-2xl text-gray-300 max-w-2xl mx-auto">
            AI-Powered Drone Based Urban Infrastructure Monitoring
          </h2>

          <p className="mt-5 text-gray-400 max-w-2xl mx-auto">
            Detect road hazards, pinpoint locations, and automatically notify DNCC & WASA authorities — before small problems become city-wide ones.
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/login")}
            className="mt-10 px-10 py-4 rounded-xl bg-cyan-500 text-black font-bold transition inline-flex items-center gap-2"
            style={{ boxShadow: "0 0 35px -6px #22d3ee" }}
          >
            Launch Dashboard
            <ArrowRight size={18} />
          </motion.button>
        </motion.div>
      </div>

      {/* Stats strip */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="p-5 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl text-center"
            >
              <div className="text-2xl sm:text-3xl font-display font-bold text-cyan-300">
                {stat.value}
              </div>
              <div className="text-gray-400 text-xs mt-1 font-hud tracking-wide uppercase">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Feature cards */}
      <div className="max-w-6xl mx-auto px-6 pb-28">
        <motion.h3
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-hud text-center text-gray-400 text-xs tracking-[0.3em] uppercase mb-10"
        >
          System Capabilities
        </motion.h3>

        <div className="grid sm:grid-cols-2 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative p-7 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden group"
              >
                <div
                  className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl opacity-25 group-hover:opacity-45 transition-opacity"
                  style={{ background: f.color }}
                />
                <div
                  className="p-3 rounded-xl inline-flex relative z-10"
                  style={{ background: `${f.color}22` }}
                >
                  <Icon size={26} style={{ color: f.color }} />
                </div>
                <h4 className="mt-4 text-lg font-bold relative z-10">{f.title}</h4>
                <p className="mt-2 text-gray-400 text-sm relative z-10">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

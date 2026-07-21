import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("DNCC");
  const [role, setRole] = useState("Manager");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleCreateAccount = () => {
    if (!name.trim() || !email.trim()) {
      setError("Please fill in your name and email before continuing.");
      return;
    }

    // No backend wired up yet — this is where you'd POST to your API.
    // For now we just log the payload and move on to Login.
    console.log("New account:", { name, email, organization, role });

    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#020617] flex justify-center items-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8"
      >
        <div className="flex justify-center mb-5">
          <div className="p-5 bg-cyan-500/20 rounded-full">
            <UserPlus size={50} className="text-cyan-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-white">
          Create Organization Account
        </h1>

        <p className="text-center text-gray-400 mt-2">
          Super Admin User Management
        </p>

        <div className="mt-8">
          <label className="text-gray-300">Full Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name"
            className="w-full mt-2 p-3 rounded-xl bg-black/30 outline-none text-white border border-white/10 focus:border-white/30 transition"
          />
        </div>

        <div className="mt-5">
          <label className="text-gray-300">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="official email"
            className="w-full mt-2 p-3 rounded-xl bg-black/30 outline-none text-white border border-white/10 focus:border-white/30 transition"
          />
        </div>

        <div className="mt-5">
          <label className="text-gray-300">Organization</label>
          <select
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            className="w-full mt-2 p-3 rounded-xl bg-black/30 text-white border border-white/10"
          >
            <option>DNCC</option>
            <option>WASA</option>
            <option>Maintenance Team</option>
          </select>
        </div>

        <div className="mt-5">
          <label className="text-gray-300">User Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full mt-2 p-3 rounded-xl bg-black/30 text-white border border-white/10"
          >
            <option>Manager</option>
            <option>Engineer</option>
            <option>Field Worker</option>
          </select>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreateAccount}
          className="mt-8 w-full py-4 rounded-xl bg-cyan-500 text-black font-bold transition"
        >
          CREATE ACCOUNT
        </motion.button>

        <div className="mt-5 text-center text-gray-400 text-sm">
          Creating: <span className="text-cyan-400">{organization}</span>
        </div>
      </motion.div>
    </div>
  );
}

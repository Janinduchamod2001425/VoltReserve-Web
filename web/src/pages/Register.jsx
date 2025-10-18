/* eslint-disable no-unused-vars */
import { useState } from "react";
import api from "../api";
import { motion } from "framer-motion";
import { UserPlus, Mail, Lock, User, Shield, AlertCircle } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("StationOperator");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!email || !password) {
      toast.error("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.post("/auth/register", {
        email,
        password,
        role,
      });
      toast.success(`✅ User created: ${data.email} (${data.role})`);
      setEmail("");
      setPassword("");
      setRole("StationOperator");
    } catch (ex) {
      toast.error(ex?.response?.data ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto mt-24 bg-gray-800 text-white p-6 rounded-3xl shadow-xl border border-gray-700">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1f2937",
            color: "white",
            border: "1px solid #374151",
          },
        }}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
            className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center"
          >
            <UserPlus className="w-6 h-6 text-black" />
          </motion.div>
          <div>
            <h3 className="text-2xl font-bold text-green-400">
              Register New User
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Create system user accounts
            </p>
          </div>
        </div>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm font-medium text-green-400 bg-green-400/20 border border-green-400/30 px-4 py-2 rounded-full"
        >
          <Shield className="w-4 h-4 inline mr-2" />
          Backoffice Only
        </motion.span>
      </motion.div>

      {/* Horizontal Form */}
      <form onSubmit={submit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Mail className="w-4 h-4 text-green-400" />
              Email Address
            </label>
            <div className="relative">
              <input
                className="w-full p-3 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all duration-200 pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@voltreserve.local"
                type="email"
                required
              />
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </motion.div>

          {/* Password Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Lock className="w-4 h-4 text-green-400" />
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                className="w-full p-3 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all duration-200 pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter strong password"
                required
              />
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </motion.div>

          {/* Role Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <User className="w-4 h-4 text-green-400" />
              User Role
            </label>
            <div className="relative">
              <select
                className="w-full p-3 rounded-xl bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all duration-200 pl-10 appearance-none"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="StationOperator">Station Operator</option>
                <option value="Backoffice">Backoffice</option>
              </select>
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Role Description */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-700/50 rounded-xl p-4 border border-gray-600"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-gray-300">
              Role Permissions
            </span>
          </div>
          <p className="text-sm text-gray-400">
            {role === "StationOperator"
              ? "Station Operators can manage charging stations, view bookings, and handle station operations."
              : "Backoffice users have full system access including user management, station configuration, and administrative functions."}
          </p>
        </motion.div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 text-black font-bold py-3 rounded-xl hover:bg-green-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
        >
          {loading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="w-5 h-5 border-2 border-black border-t-transparent rounded-full"
              />
              Creating User...
            </>
          ) : (
            <>
              <UserPlus className="w-5 h-5" />
              Create User Account
            </>
          )}
        </motion.button>
      </form>

      {/* Quick Guidelines */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-400"
      >
        <div className="text-center p-3 bg-gray-700/30 rounded-lg">
          <Mail className="w-4 h-4 mx-auto mb-1 text-green-400" />
          <p>Use official company emails</p>
        </div>
        <div className="text-center p-3 bg-gray-700/30 rounded-lg">
          <Lock className="w-4 h-4 mx-auto mb-1 text-green-400" />
          <p>Strong passwords required</p>
        </div>
        <div className="text-center p-3 bg-gray-700/30 rounded-lg">
          <User className="w-4 h-4 mx-auto mb-1 text-green-400" />
          <p>Assign appropriate roles</p>
        </div>
      </motion.div>
    </div>
  );
}

/* eslint-disable no-unused-vars */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { auth } from "../api";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, LogIn, Eye, EyeOff } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@voltreserve.local");
  const [password, setPassword] = useState("Admin@123");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!email || !password) {
      toast.error("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.post("/auth/login", { email, password });
      auth.set(data.token, data.email, data.role);
      toast.success("Welcome back!");
      setTimeout(() => {
        nav("/");
      }, 1000);
    } catch (ex) {
      toast.error(
        ex?.response?.data ?? "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto sm:mt-20 bg-gray-800 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-700">
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
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
            className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center"
          >
            <Zap className="w-6 h-6 text-black" />
          </motion.div>
          <h1 className="text-3xl font-bold text-green-400">VoltReserve</h1>
        </div>
        <p className="text-gray-400">Sign in to your administrator account</p>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-2xl font-bold text-white text-center mb-8 flex items-center justify-center gap-2"
      >
        <LogIn className="w-6 h-6 text-green-400" />
        Welcome Back
      </motion.h2>

      <form onSubmit={submit} className="space-y-6">
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
              className="w-full p-4 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all duration-200 pl-12"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              type="email"
            />
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </motion.div>

        {/* Password Field */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-2"
        >
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Lock className="w-4 h-4 text-green-400" />
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full p-4 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all duration-200 pl-12 pr-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-400 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </motion.div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 text-black font-bold py-4 rounded-xl hover:bg-green-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
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
              Signing In...
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              Sign In
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
}

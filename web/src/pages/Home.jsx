/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import api, { auth } from "../api";
import { motion } from "framer-motion";
import {
  Zap,
  User,
  Shield,
  Battery,
  Users,
  Settings,
  Mail,
  Clock,
  Activity,
  Key,
  Database,
} from "lucide-react";

export default function Home() {
  const [me, setMe] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        setMe(data);
      } catch (e) {
        setErr(e?.response?.data ?? "Failed to load /auth/me");
      }
    })();
  }, []);

  if (err) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-4 sm:p-6 rounded-lg bg-red-50/10 border border-red-500 text-red-400 text-base sm:text-lg">
        {String(err)}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 mt-10">
      <div className="max-w-7xl w-full space-y-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-left gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg"
            >
              <Zap className="w-10 h-10 text-black" />
            </motion.div>
            <div className="text-left">
              <h1 className="text-5xl sm:text-6xl font-bold text-green-400 leading-tight">
                VoltReserve
              </h1>
              <p className="text-xl text-gray-800 font-semibold mt-2">
                EV Charging Management System
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          {/* User Info Card - Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 rounded-3xl border border-gray-700 p-8 shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                <User className="w-7 h-7 text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">User Profile</h2>
                <p className="text-gray-400">Your account information</p>
              </div>
            </div>

            {me ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-5 bg-gray-700/60 rounded-xl border border-gray-600">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Email Address</p>
                      <p className="text-lg font-semibold text-green-400">
                        {me.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-5 bg-gray-700/60 rounded-xl border border-gray-600">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">User Role</p>
                      <p className="text-lg font-bold text-green-300">
                        {me.role}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-5 bg-gray-700/60 rounded-xl border border-gray-600">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Account Status</p>
                      <p className="text-lg font-bold text-green-300">Active</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-10 h-10 border-3 border-green-400 border-t-transparent rounded-full"
                />
              </div>
            )}
          </motion.div>

          {/* Role Features Card - Middle */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800 rounded-3xl border border-gray-700 p-8 shadow-2xl xl:col-span-2"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                <Settings className="w-7 h-7 text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">System Access</h2>
                <p className="text-gray-400">Your permissions & capabilities</p>
              </div>
            </div>

            {auth.role() === "Backoffice" ? (
              <div className="space-y-6">
                <div className="flex items-start gap-6 p-6 bg-green-500/10 border border-green-400/20 rounded-2xl">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold text-green-400 text-xl mb-3">
                      Backoffice Administrator
                    </h3>
                    <p className="text-gray-300 text-lg leading-relaxed">
                      Full system access including user management, station
                      configuration, and administrative functions. You can
                      register new users, manage system settings, and oversee
                      all operational aspects.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-700/60 p-4 rounded-xl border border-gray-600 text-center group hover:border-green-400 transition-colors">
                    <User className="w-8 h-8 text-green-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <span className="text-gray-300 font-medium">
                      User Management
                    </span>
                  </div>
                  <div className="bg-gray-700/60 p-4 rounded-xl border border-gray-600 text-center group hover:border-green-400 transition-colors">
                    <Battery className="w-8 h-8 text-green-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <span className="text-gray-300 font-medium">
                      Station Control
                    </span>
                  </div>
                  <div className="bg-gray-700/60 p-4 rounded-xl border border-gray-600 text-center group hover:border-green-400 transition-colors">
                    <Settings className="w-8 h-8 text-green-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <span className="text-gray-300 font-medium">
                      System Config
                    </span>
                  </div>
                  <div className="bg-gray-700/60 p-4 rounded-xl border border-gray-600 text-center group hover:border-green-400 transition-colors">
                    <Shield className="w-8 h-8 text-green-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <span className="text-gray-300 font-medium">
                      Admin Access
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start gap-6 p-6 bg-blue-500/10 border border-blue-400/20 rounded-2xl">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Battery className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-400 text-xl mb-3">
                      Station Operator
                    </h3>
                    <p className="text-gray-300 text-lg leading-relaxed">
                      Operational access for managing charging stations, viewing
                      bookings, and handling daily EV operations. Focus on
                      station maintenance, customer service, and ensuring
                      optimal charging performance.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-700/60 p-4 rounded-xl border border-gray-600 text-center group hover:border-blue-400 transition-colors">
                    <Battery className="w-8 h-8 text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <span className="text-gray-300 font-medium">
                      Station Ops
                    </span>
                  </div>
                  <div className="bg-gray-700/60 p-4 rounded-xl border border-gray-600 text-center group hover:border-blue-400 transition-colors">
                    <Users className="w-8 h-8 text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <span className="text-gray-300 font-medium">
                      Customer Service
                    </span>
                  </div>
                  <div className="bg-gray-700/60 p-4 rounded-xl border border-gray-600 text-center group hover:border-blue-400 transition-colors">
                    <Zap className="w-8 h-8 text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <span className="text-gray-300 font-medium">
                      Power Management
                    </span>
                  </div>
                  <div className="bg-gray-700/60 p-4 rounded-xl border border-gray-600 text-center group hover:border-blue-400 transition-colors">
                    <Settings className="w-8 h-8 text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <span className="text-gray-300 font-medium">
                      Maintenance
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick Stats Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <div className="bg-gray-800 rounded-2xl p-6 text-center border border-gray-700 group hover:border-green-400 transition-all duration-300">
            <Clock className="w-8 h-8 text-green-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-3xl font-bold text-white mb-1">24/7</p>
            <p className="text-gray-400 font-medium">Service Availability</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-6 text-center border border-gray-700 group hover:border-green-400 transition-all duration-300">
            <Activity className="w-8 h-8 text-green-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-3xl font-bold text-white mb-1">100%</p>
            <p className="text-gray-400 font-medium">System Uptime</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-6 text-center border border-gray-700 group hover:border-green-400 transition-all duration-300">
            <Key className="w-8 h-8 text-green-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-3xl font-bold text-white mb-1">Secure</p>
            <p className="text-gray-400 font-medium">Access Control</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-6 text-center border border-gray-700 group hover:border-green-400 transition-all duration-300">
            <Database className="w-8 h-8 text-green-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-3xl font-bold text-white mb-1">Protected</p>
            <p className="text-gray-400 font-medium">Data Security</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

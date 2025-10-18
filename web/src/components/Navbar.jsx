/* eslint-disable no-unused-vars */
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom"; // Added useLocation
import { auth } from "../api";
import {
  Menu,
  X,
  User,
  Plus,
  Users,
  Zap,
  Calendar,
  LogOut,
  UserCheck,
  Battery,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";

export default function Navbar() {
  const nav = useNavigate();
  const location = useLocation(); // Get current location
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Helper function to check if a path is active
  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const logout = () => {
    Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#10b981", // green-500
      cancelButtonColor: "#000000",
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel",
      background: "#000000",
      color: "#ffffff",
      customClass: {
        popup: "rounded-2xl border border-gray-700",
        title: "text-white font-semibold",
        confirmButton: "rounded-lg font-medium px-4 py-2",
        cancelButton:
          "rounded-lg font-medium px-4 py-2 text-white hover:bg-gray-800",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        auth.clear();
        nav("/login");
        setIsMenuOpen(false);

        Swal.fire({
          title: "Logged Out!",
          text: "You have been successfully logged out.",
          icon: "success",
          confirmButtonColor: "#10b981",
          background: "#000000",
          color: "#ffffff",
          customClass: {
            popup: "rounded-2xl border border-gray-700",
          },
        });
      }
    });
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const menuVariants = {
    closed: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    open: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  const itemVariants = {
    closed: { opacity: 0, x: -20 },
    open: { opacity: 1, x: 0 },
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-black text-white px-4 sm:px-6 py-3 shadow-md z-50">
      <div className="flex items-center justify-between">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to="/"
            className="text-xl sm:text-2xl font-bold text-green-400 tracking-wide flex items-center gap-2"
            onClick={closeMenu}
          >
            <Zap className="w-6 h-6" />
            VoltReserve
          </Link>
        </motion.div>

        {/* Desktop Links - Always visible for non-auth, conditional for auth */}
        {!auth.isAuthed() ? (
          <motion.div
            className="hidden sm:block"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link
              to="/login"
              className={`hover:text-green-400 rounded-xl transition-colors font-medium bg-green-500 px-3 py-1 flex items-center gap-2 ${
                isActivePath("/login") ? "text-black" : "text-white"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span className="">Login</span>
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Desktop Links */}
            <div className="hidden sm:flex items-center gap-6">
              <motion.span
                className="text-sm text-gray-200 flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <User className="w-4 h-4 text-green-400" />
                {auth.email()}{" "}
                <span className="text-green-400 font-semibold">
                  ({auth.role()})
                </span>
              </motion.span>

              {auth.isBackoffice() && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Link
                      to="/register"
                      className={`hover:text-green-400 transition-colors font-medium flex items-center gap-2 ${
                        isActivePath("/register")
                          ? "text-green-400"
                          : "text-white"
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      Register User
                    </Link>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Link
                      to="/owners"
                      className={`hover:text-green-400 transition-colors font-medium flex items-center gap-2 ${
                        isActivePath("/owners")
                          ? "text-green-400"
                          : "text-white"
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      EV Owners
                    </Link>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Link
                      to="stations"
                      className={`hover:text-green-400 transition-colors font-medium flex items-center gap-2 ${
                        isActivePath("/stations")
                          ? "text-green-400"
                          : "text-white"
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      Stations
                    </Link>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Link
                      to="/bookings"
                      className={`hover:text-green-400 transition-colors font-medium flex items-center gap-2 ${
                        isActivePath("/bookings")
                          ? "text-green-400"
                          : "text-white"
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      Bookings
                    </Link>
                  </motion.div>
                </>
              )}

              {auth.isStationOperator() && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Link
                    to="/my_stations"
                    className={`hover:text-green-400 transition-colors font-medium flex items-center gap-2 ${
                      isActivePath("/my_stations")
                        ? "text-green-400"
                        : "text-white"
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    My Stations
                  </Link>
                </motion.div>
              )}

              <motion.button
                onClick={logout}
                className="bg-green-500 text-black font-semibold px-3 py-1 rounded-xl hover:bg-green-400 transition-colors flex items-center gap-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              className="sm:hidden p-2 text-green-400"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
          </>
        )}
      </div>

      {/* Mobile Menu for Authenticated Users */}
      <AnimatePresence>
        {auth.isAuthed() && isMenuOpen && (
          <motion.div
            className="sm:hidden absolute top-full left-0 right-0 bg-black border-t border-gray-700 z-50 overflow-hidden"
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            <div className="px-4 py-4 space-y-4">
              <motion.div
                className="text-sm text-gray-200 py-2 border-b border-gray-700 flex items-center gap-2"
                variants={itemVariants}
                transition={{ delay: 0.1 }}
              >
                <User className="w-4 h-4 text-green-400" />
                {auth.email()}{" "}
                <span className="text-green-400 font-semibold">
                  ({auth.role()})
                </span>
              </motion.div>

              {auth.isBackoffice() && (
                <>
                  <motion.div
                    variants={itemVariants}
                    transition={{ delay: 0.2 }}
                  >
                    <Link
                      to="/register"
                      className={`block transition-colors font-medium py-2 flex items-center gap-2 ${
                        isActivePath("/register")
                          ? "text-green-400"
                          : "text-white hover:text-green-400"
                      }`}
                      onClick={closeMenu}
                    >
                      <Plus className="w-4 h-4" />
                      Register User
                    </Link>
                  </motion.div>
                  <motion.div
                    variants={itemVariants}
                    transition={{ delay: 0.3 }}
                  >
                    <Link
                      to="/owners"
                      className={`block transition-colors font-medium py-2 flex items-center gap-2 ${
                        isActivePath("/owners")
                          ? "text-green-400"
                          : "text-white hover:text-green-400"
                      }`}
                      onClick={closeMenu}
                    >
                      <Users className="w-4 h-4" />
                      EV Owners
                    </Link>
                  </motion.div>
                  <motion.div
                    variants={itemVariants}
                    transition={{ delay: 0.4 }}
                  >
                    <Link
                      to="/stations"
                      className={`block transition-colors font-medium py-2 flex items-center gap-2 ${
                        isActivePath("/stations")
                          ? "text-green-400"
                          : "text-white hover:text-green-400"
                      }`}
                      onClick={closeMenu}
                    >
                      <Zap className="w-4 h-4" />
                      Stations
                    </Link>
                  </motion.div>
                </>
              )}

              <motion.div variants={itemVariants} transition={{ delay: 0.5 }}>
                <Link
                  to="/bookings"
                  className={`block transition-colors font-medium py-2 flex items-center gap-2 ${
                    isActivePath("/bookings")
                      ? "text-green-400"
                      : "text-white hover:text-green-400"
                  }`}
                  onClick={closeMenu}
                >
                  <Calendar className="w-4 h-4" />
                  Bookings
                </Link>
              </motion.div>

              <motion.button
                onClick={logout}
                className="w-full bg-green-500 text-black font-semibold px-3 py-2 rounded-2xl hover:bg-green-400 transition-colors flex items-center gap-2 justify-center"
                variants={itemVariants}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu for Non-Authenticated Users */}
      {!auth.isAuthed() && (
        <motion.div
          className="sm:hidden mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Link
            to="/login"
            className={`hover:text-green-400 transition-colors font-medium block text-center flex items-center gap-2 justify-center ${
              isActivePath("/login") ? "text-green-400" : "text-white"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Login
          </Link>
        </motion.div>
      )}
    </nav>
  );
}

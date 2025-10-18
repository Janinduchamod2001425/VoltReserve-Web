/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from "react";
import api, { auth } from "../api";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Edit3,
  Trash2,
  Power,
  Search,
  UserPlus,
  Car,
  Battery,
  Phone,
  Mail,
  User,
  IdCard,
  X,
  Save,
  Ban,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
} from "lucide-react";
import Swal from "sweetalert2";

export default function Owners() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter state
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Create form state
  const [cNic, setCNic] = useState("");
  const [cFirst, setCFirst] = useState("");
  const [cLast, setCLast] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [cMake, setCMake] = useState("");
  const [cModel, setCModel] = useState("");
  const [cCap, setCCap] = useState("");

  // Editing state
  const [editingOwner, setEditingOwner] = useState(null);
  const [eFirst, setEFirst] = useState("");
  const [eLast, setELast] = useState("");
  const [ePhone, setEPhone] = useState("");
  const [eMake, setEMake] = useState("");
  const [eModel, setEModel] = useState("");
  const [eCap, setECap] = useState("");

  const canUse = useMemo(() => auth.isBackoffice(), []);

  useEffect(() => {
    if (canUse) loadOwners();
  }, [canUse]);

  // Filter owners based on search and status
  const filteredOwners = useMemo(() => {
    return owners.filter((owner) => {
      // Search filter
      const matchesSearch =
        owner.nic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.email.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "ACTIVE"
          ? owner.isActive
          : statusFilter === "INACTIVE"
          ? !owner.isActive
          : true;

      return matchesSearch && matchesStatus;
    });
  }, [owners, searchTerm, statusFilter]);

  // Counts for filter tabs
  const counts = useMemo(() => {
    return {
      ALL: owners.length,
      ACTIVE: owners.filter((o) => o.isActive).length,
      INACTIVE: owners.filter((o) => !o.isActive).length,
    };
  }, [owners]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredOwners.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOwners = filteredOwners.slice(startIndex, endIndex);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // ---- API helpers ----
  async function loadOwners() {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/owners");
      const normalized = (data ?? []).map((o) => ({
        nic: o.nic ?? o.Nic,
        firstName: o.firstName ?? o.FirstName,
        lastName: o.lastName ?? o.LastName,
        email: o.email ?? o.Email,
        phone: o.phone ?? o.Phone,
        isActive: o.isActive ?? o.IsActive,
        vehicle: o.vehicle ?? o.Vehicle,
      }));
      setOwners(normalized);
    } catch (e) {
      toast.error(e?.response?.data ?? "Failed to load owners");
    } finally {
      setLoading(false);
    }
  }

  async function createOwner(e) {
    e.preventDefault();

    // Validation
    if (
      !cNic.trim() ||
      !cFirst.trim() ||
      !cLast.trim() ||
      !cEmail.trim() ||
      !cPhone.trim() ||
      !cPassword
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      const payload = {
        nic: cNic.trim(),
        firstName: cFirst.trim(),
        lastName: cLast.trim(),
        email: cEmail.trim(),
        phone: cPhone.trim(),
        password: cPassword,
        vehicle:
          cMake || cModel || cCap
            ? {
                make: cMake,
                model: cModel,
                batteryCapacityKWh: Number(cCap || 0),
              }
            : null,
      };
      await api.post("/admin/owners", payload);
      toast.success("Owner created successfully!");
      await loadOwners();
      setShowCreateForm(false);
      // Clear form
      setCNic("");
      setCFirst("");
      setCLast("");
      setCEmail("");
      setCPhone("");
      setCPassword("");
      setCMake("");
      setCModel("");
      setCCap("");
    } catch (e2) {
      toast.error(e2?.response?.data ?? "Failed to create owner");
    }
  }

  function startEdit(owner) {
    setEditingOwner(owner);
    setEFirst(owner.firstName || "");
    setELast(owner.lastName || "");
    setEPhone(owner.phone || "");
    setEMake(owner.vehicle?.make || "");
    setEModel(owner.vehicle?.model || "");
    setECap(owner.vehicle?.batteryCapacityKWh ?? "");
  }

  function cancelEdit() {
    setEditingOwner(null);
  }

  async function saveEdit() {
    try {
      const payload = {
        firstName: eFirst,
        lastName: eLast,
        phone: ePhone,
        vehicle:
          eMake || eModel || eCap
            ? {
                make: eMake,
                model: eModel,
                batteryCapacityKWh: Number(eCap || 0),
              }
            : null,
      };
      await api.put(
        `/admin/owners/${encodeURIComponent(editingOwner.nic)}`,
        payload
      );
      toast.success("Owner updated successfully!");
      setEditingOwner(null);
      await loadOwners();
    } catch (e3) {
      toast.error(e3?.response?.data ?? "Failed to update owner");
    }
  }

  async function toggleActive(o) {
    const action = o.isActive ? "deactivate" : "activate";

    Swal.fire({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Owner?`,
      text: `Are you sure you want to ${action} ${o.firstName} ${o.lastName}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#000000",
      confirmButtonText: `Yes, ${action}`,
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
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          if (o.isActive) {
            await api.post(
              `/admin/owners/${encodeURIComponent(o.nic)}/deactivate`
            );
            toast("Owner deactivated", {
              icon: <Ban className="w-5 h-5 text-red-500" />,
            });
          } else {
            await api.post(
              `/admin/owners/${encodeURIComponent(o.nic)}/activate`
            );
            toast("Owner activated", {
              icon: <CheckCircle className="w-5 h-5 text-green-500" />,
            });
          }
          await loadOwners();
        } catch (e4) {
          toast.error(e4?.response?.data ?? "Failed to update status");
        }
      }
    });
  }

  async function removeOwner(o) {
    Swal.fire({
      title: "Delete Owner?",
      text: `This will permanently delete ${o.firstName} ${o.lastName} (${o.nic}). This action cannot be undone!`,
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#000000",
      confirmButtonText: "Yes, delete",
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
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/admin/owners/${encodeURIComponent(o.nic)}`);
          toast.success("Owner deleted successfully!");
          await loadOwners();
        } catch (e5) {
          toast.error(e5?.response?.data ?? "Failed to delete owner");
        }
      }
    });
  }

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  if (!canUse) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto mt-12 bg-red-50/10 border border-red-500 text-red-300 p-6 rounded-2xl"
      >
        <div className="flex items-center gap-3">
          <Ban className="w-6 h-6" />
          <span>Forbidden: Backoffice role required.</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 mt-12">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1f2937",
            color: "white",
            border: "1px solid #374151",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "white",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "white",
            },
          },
        }}
      />

      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-green-400 flex items-center gap-3">
              <Users className="w-8 h-8" />
              EV Owner Management
            </h1>
            <p className="text-gray-800 mt-2 font-semibold">
              Manage EV owners, their vehicles, and account status
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateForm(true)}
            className="bg-green-500 text-black font-bold px-6 py-3 rounded-3xl hover:bg-green-400 transition-all duration-200 flex items-center gap-2 mt-4 lg:mt-0"
          >
            <UserPlus className="w-5 h-5" />
            Add New EV Owner
          </motion.button>
        </motion.div>

        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className=" rounded-3xl border border-gray-700 overflow-hidden mb-6"
        >
          <div className="p-6 border-b border-gray-700">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-900 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search owners by NIC, name, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-[500px] pl-10 pr-4 py-3 bg-gray-100 border-2 border-gray-600 rounded-3xl text-black font-medium placeholder-gray-600 focus:outline-none focus:border-gray-400 transition-colors"
                  />
                </div>

                {/* Refresh Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={loadOwners}
                  className="inline-flex items-center gap-2 border-2 border-gray-600 bg-white text-black px-4 py-3 rounded-3xl hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </motion.button>
              </div>

              {/* Results Count */}
              <div className="text-gray-800 text-sm">
                Showing {Math.min(currentOwners.length, itemsPerPage)} of{" "}
                {filteredOwners.length} owners
                {searchTerm && ` for "${searchTerm}"`}
              </div>
            </div>
          </div>

          {/* Status Filter Tabs with Stats Cards */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              {/* Status Filter Tabs on the left */}
              <div className="flex items-center gap-2">
                {[
                  { key: "ALL", label: "All" },
                  { key: "ACTIVE", label: "Active" },
                  { key: "INACTIVE", label: "Inactive" },
                ].map((tab) => {
                  const active = statusFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setStatusFilter(tab.key)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-colors ${
                        active
                          ? "bg-green-500 text-black border-green-500"
                          : "bg-gray-800 text-gray-300 border-gray-600 hover:border-gray-500"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-xs font-bold rounded-full px-2 py-0.5 ${
                          active
                            ? "bg-black/20 text-black"
                            : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {counts[tab.key] ?? 0}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Stats Cards on the right */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-2xl border border-gray-700">
                  <Users className="w-4 h-4 text-green-400" />
                  <div className="flex items-center gap-2">
                    <p className="text-gray-400 text-xs">Total:</p>
                    <p className="text-sm font-bold text-white">
                      {owners.length}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-2xl border border-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <div className="flex items-center gap-2">
                    <p className="text-gray-400 text-xs">Active:</p>
                    <p className="text-sm font-bold text-white">
                      {owners.filter((o) => o.isActive).length}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-2xl border border-gray-700">
                  <Car className="w-4 h-4 text-green-400" />
                  <div className="flex items-center gap-2">
                    <p className="text-gray-400 text-xs">Vehicles:</p>
                    <p className="text-sm font-bold text-white">
                      {owners.filter((o) => o.vehicle).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Helper Text */}
          <div className="p-4 bg-gray-100">
            <div className="text-sm text-gray-800 font-medium italic">
              Showing{" "}
              <span className="text-green-600">
                {statusFilter === "ALL"
                  ? "ALL"
                  : statusFilter === "ACTIVE"
                  ? "ACTIVE"
                  : "INACTIVE"}
              </span>{" "}
              owners
            </div>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-900 rounded-3xl border border-gray-700 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Owner
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Vehicle
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full"
                        />
                      </div>
                      <p className="text-gray-400 mt-2">Loading owners...</p>
                    </td>
                  </tr>
                ) : currentOwners.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>
                        No owners found
                        {searchTerm && ` matching "${searchTerm}"`}
                        {statusFilter !== "ALL" &&
                          ` with status ${statusFilter.toLowerCase()}`}
                      </p>
                    </td>
                  </tr>
                ) : (
                  currentOwners.map((o) => (
                    <motion.tr
                      key={o.nic}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-750 transition-colors"
                    >
                      {/* Owner Info */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-400 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-black" />
                            </div>
                            <div>
                              <p className="font-semibold text-white">
                                {o.firstName} {o.lastName}
                              </p>
                              <p className="text-sm text-gray-400 font-mono">
                                {o.nic}
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-300">
                            <Mail className="w-4 h-4 text-green-400" />
                            <span className="font-semibold">{o.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Phone className="w-4 h-4" />
                            <span className="text-sm">{o.phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Vehicle Info */}
                      <td className="px-6 py-4">
                        {o.vehicle ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-white">
                              <Car className="w-4 h-4 text-green-400" />
                              <span>
                                {o.vehicle.make} {o.vehicle.model}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <Battery className="w-4 h-4 text-yellow-400" />
                              <span>{o.vehicle.batteryCapacityKWh} kWh</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500 italic">
                            No vehicle
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                            o.isActive
                              ? "bg-green-400/20 font-semibold text-green-300 border border-green-400"
                              : "bg-orange-500/20 font-semibold text-orange-300 border border-orange-500/30"
                          }`}
                        >
                          {o.isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <Ban className="w-3 h-3" />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => startEdit(o)}
                            className="p-2 bg-green-500 text-black rounded-lg hover:bg-green-400 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleActive(o)}
                            className={`p-2 rounded-lg transition-colors ${
                              o.isActive
                                ? "bg-yellow-500 text-black hover:bg-yellow-400"
                                : "bg-green-500 text-black hover:bg-green-400"
                            }`}
                            title={o.isActive ? "Deactivate" : "Activate"}
                          >
                            <Power className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => removeOwner(o)}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredOwners.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-t border-gray-700 bg-gray-900">
              <div className="text-gray-400 text-sm mb-4 sm:mb-0">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, filteredOwners.length)} of{" "}
                {filteredOwners.length} entries
              </div>

              <div className="flex items-center gap-2">
                {/* First Page */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-gray-700 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                  title="First page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </motion.button>

                {/* Previous Page */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-gray-700 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </motion.button>

                {/* Page Numbers */}
                <div className="flex gap-1 mx-2">
                  {getPageNumbers().map((page) => (
                    <motion.button
                      key={page}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => goToPage(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? "bg-green-500 text-black"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {page}
                    </motion.button>
                  ))}
                </div>

                {/* Next Page */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-gray-700 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.button>

                {/* Last Page */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-gray-700 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                  title="Last page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Create Owner Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-3xl border border-gray-700 w-full max-w-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-green-400" />
                  <h2 className="text-lg font-bold text-white">
                    Create New EV Owner
                  </h2>
                </div>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-white"
                >
                  Close
                </button>
              </div>

              {/* Form */}
              <form onSubmit={createOwner} className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  {/* Column 1 - Personal Information */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-green-400 border-b border-gray-600 pb-1">
                      Personal Information
                    </h3>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                        <IdCard className="w-3 h-3" />
                        NIC *
                      </label>
                      <input
                        className="w-full p-2 text-sm rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
                        value={cNic}
                        onChange={(e) => setCNic(e.target.value)}
                        placeholder="Enter NIC"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        First Name *
                      </label>
                      <input
                        className="w-full p-2 text-sm rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
                        value={cFirst}
                        onChange={(e) => setCFirst(e.target.value)}
                        placeholder="First name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Last Name *
                      </label>
                      <input
                        className="w-full p-2 text-sm rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
                        value={cLast}
                        onChange={(e) => setCLast(e.target.value)}
                        placeholder="Last name"
                        required
                      />
                    </div>
                  </div>

                  {/* Column 2 - Contact Information */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-green-400 border-b border-gray-600 pb-1">
                      Contact Information
                    </h3>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        Email *
                      </label>
                      <input
                        type="email"
                        className="w-full p-2 text-sm rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
                        value={cEmail}
                        onChange={(e) => setCEmail(e.target.value)}
                        placeholder="Email address"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        Phone *
                      </label>
                      <input
                        className="w-full p-2 text-sm rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
                        value={cPhone}
                        onChange={(e) => setCPhone(e.target.value)}
                        placeholder="Phone number"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Password *
                      </label>
                      <input
                        type="password"
                        className="w-full p-2 text-sm rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
                        value={cPassword}
                        onChange={(e) => setCPassword(e.target.value)}
                        placeholder="Password"
                        required
                      />
                    </div>
                  </div>

                  {/* Column 3 - Vehicle Information */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-green-400 border-b border-gray-600 pb-1">
                      Vehicle Information
                    </h3>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                        <Car className="w-3 h-3" />
                        Vehicle Make
                      </label>
                      <input
                        className="w-full p-2 text-sm rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
                        value={cMake}
                        onChange={(e) => setCMake(e.target.value)}
                        placeholder="Make"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                        <Car className="w-3 h-3" />
                        Vehicle Model
                      </label>
                      <input
                        className="w-full p-2 text-sm rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
                        value={cModel}
                        onChange={(e) => setCModel(e.target.value)}
                        placeholder="Model"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                        <Battery className="w-3 h-3" />
                        Battery (kWh)
                      </label>
                      <input
                        type="number"
                        className="w-full p-2 text-sm rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
                        value={cCap}
                        onChange={(e) => setCCap(e.target.value)}
                        placeholder="Capacity"
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>

                {/* Helper Text */}
                <div className="mt-3 p-2 bg-gray-700/50 rounded-lg border border-gray-600">
                  <div className="flex items-center gap-1 text-gray-300 text-xs">
                    <AlertCircle className="w-3 h-3 text-yellow-400" />
                    <span>Vehicle information is optional</span>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-sm bg-gray-700 text-white rounded-2xl hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 text-sm bg-green-500 text-black font-bold rounded-2xl hover:bg-green-400 transition-colors flex items-center gap-1"
                  >
                    <UserPlus className="w-4 h-4" />
                    Create Owner
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Owner Modal */}
      <AnimatePresence>
        {editingOwner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={cancelEdit}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-3xl border border-gray-700 w-full max-w-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-green-400" />
                  <h2 className="text-lg font-bold text-white">
                    Edit EV Owner
                  </h2>
                </div>
                <button
                  onClick={cancelEdit}
                  className="px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-white"
                >
                  Close
                </button>
              </div>

              {/* Form */}
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  {/* Column 1 - Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-green-400 border-b border-gray-600 pb-1">
                      Personal Information
                    </h3>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                        <IdCard className="w-3 h-3" />
                        NIC
                      </label>
                      <input
                        className="w-full p-2 text-sm rounded-lg bg-gray-600 border border-gray-500 text-gray-300 cursor-not-allowed"
                        value={editingOwner.nic}
                        readOnly
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        First Name *
                      </label>
                      <input
                        className="w-full p-2 text-sm rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
                        value={eFirst}
                        onChange={(e) => setEFirst(e.target.value)}
                        placeholder="First name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Last Name *
                      </label>
                      <input
                        className="w-full p-2 text-sm rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
                        value={eLast}
                        onChange={(e) => setELast(e.target.value)}
                        placeholder="Last name"
                        required
                      />
                    </div>
                  </div>

                  {/* Column 2 - Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-green-400 border-b border-gray-600 pb-1">
                      Contact Information
                    </h3>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        Email
                      </label>
                      <input
                        className="w-full p-2 text-sm rounded-lg bg-gray-600 border border-gray-500 text-gray-300 cursor-not-allowed"
                        value={editingOwner.email}
                        readOnly
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        Phone *
                      </label>
                      <input
                        className="w-full p-2 text-sm rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
                        value={ePhone}
                        onChange={(e) => setEPhone(e.target.value)}
                        placeholder="Phone number"
                        required
                      />
                    </div>

                    {/* Status Display */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                        <Power className="w-3 h-3" />
                        Status
                      </label>
                      <div className="p-2 bg-gray-600 rounded-lg border border-gray-500 text-gray-300 cursor-not-allowed">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">
                            {editingOwner.isActive ? "Active" : "Inactive"}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              editingOwner.isActive
                                ? "bg-green-400/20 font-semibold text-green-300 border border-green-400"
                                : "bg-orange-500/20 font-semibold text-orange-200 border border-orange-500/30"
                            }`}
                          >
                            {editingOwner.isActive ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <Ban className="w-3 h-3" />
                                Inactive
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 3 - Vehicle Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-green-400 border-b border-gray-600 pb-1">
                      Vehicle Information
                    </h3>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                        <Car className="w-3 h-3" />
                        Vehicle Make
                      </label>
                      <input
                        className="w-full p-2 text-sm rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
                        value={eMake}
                        onChange={(e) => setEMake(e.target.value)}
                        placeholder="Make"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                        <Car className="w-3 h-3" />
                        Vehicle Model
                      </label>
                      <input
                        className="w-full p-2 text-sm rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
                        value={eModel}
                        onChange={(e) => setEModel(e.target.value)}
                        placeholder="Model"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                        <Battery className="w-3 h-3" />
                        Battery (kWh)
                      </label>
                      <input
                        type="number"
                        className="w-full p-2 text-sm rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
                        value={eCap}
                        onChange={(e) => setECap(e.target.value)}
                        placeholder="Capacity"
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>

                {/* Helper Text */}
                <div className="mt-4 p-2 bg-gray-700/50 rounded-lg border border-gray-600">
                  <div className="flex items-center gap-1 text-gray-300 text-xs">
                    <AlertCircle className="w-3 h-3 text-blue-400" />
                    <span>
                      Leave vehicle fields empty to remove vehicle information
                    </span>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 text-sm bg-gray-700 text-white rounded-2xl hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={saveEdit}
                    className="px-4 py-2 text-sm bg-green-500 text-black font-bold rounded-2xl hover:bg-green-400 transition-colors flex items-center gap-1"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

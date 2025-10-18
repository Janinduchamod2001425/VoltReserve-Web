import { useEffect, useMemo, useState } from "react";
import api, { auth } from "../api";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit3,
  Trash2,
  Power,
  Search,
  Building2,
  X,
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Save,
} from "lucide-react";
import Swal from "sweetalert2";

export default function Stations() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Create form state
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("AC");
  const [slots, setSlots] = useState(0);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [scheduleSlots, setScheduleSlots] = useState(0);

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [eName, setEName] = useState("");
  const [eLocation, setELocation] = useState("");
  const [eType, setEType] = useState("AC");
  const [eSlots, setESlots] = useState(0);
  const [eStartTime, setEStartTime] = useState("");
  const [eEndTime, setEEndTime] = useState("");
  const [eScheduleSlots, setEScheduleSlots] = useState(0);

  // Track in-flight toggle
  const [togglingId, setTogglingId] = useState(null);

  const canUse = useMemo(() => auth.isBackoffice(), []);

  useEffect(() => {
    if (canUse) loadStations();
  }, [canUse]);

  const filteredStations = useMemo(
    () =>
      stations.filter(
        (s) =>
          s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.location?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [stations, searchTerm]
  );

  const totalPages = Math.ceil(filteredStations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStations = filteredStations.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  function toInputDateTime(value) {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    return local;
  }

  // API
  async function loadStations() {
    setLoading(true);
    try {
      const { data } = await api.get("/stations");
      setStations(data ?? []);
    } catch (e) {
      toast.error(e?.response?.data ?? "Failed to load stations");
    } finally {
      setLoading(false);
    }
  }

  async function createStation(e) {
    e.preventDefault();
    if (!name.trim() || !location.trim()) {
      toast.error("Please fill required fields");
      return;
    }
    try {
      const payload = {
        name: name.trim(),
        location: location.trim(),
        type,
        availableSlots: Number(slots),
        schedules: [
          {
            startTime,
            endTime,
            slotsAvailable: Number(scheduleSlots),
          },
        ],
      };
      await api.post("/stations", payload);
      toast.success("🎉 Station created successfully!");
      await loadStations();
      setShowCreateForm(false);
      setName("");
      setLocation("");
      setSlots(0);
      setType("AC");
      setStartTime("");
      setEndTime("");
      setScheduleSlots(0);
    } catch (e2) {
      toast.error(e2?.response?.data ?? "Failed to create station");
    }
  }

  function startEdit(station) {
    setEditingId(station.id);
    setEName(station.name);
    setELocation(station.location);
    setEType(station.type);
    setESlots(station.availableSlots);
    const firstSchedule =
      station.schedules && station.schedules.length > 0
        ? station.schedules[0]
        : null;
    setEStartTime(
      firstSchedule ? toInputDateTime(firstSchedule.startTime) : ""
    );
    setEEndTime(firstSchedule ? toInputDateTime(firstSchedule.endTime) : "");
    setEScheduleSlots(firstSchedule ? firstSchedule.slotsAvailable : 0);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id) {
    try {
      const original = stations.find((st) => st.id === id); // ADDED: original record
      const locationChanged =
        original &&
        original.location?.trim().toLowerCase() !==
          eLocation.trim().toLowerCase();

      const payload = {
        name: eName,
        location: eLocation,
        type: eType,
        availableSlots: Number(eSlots),
      };

      // Preserve existing coords if location unchanged
      if (original && !locationChanged) {
        payload.latitude = original.latitude;
        payload.longitude = original.longitude;
      }

      if (eStartTime && eEndTime) {
        payload.schedules = [
          {
            startTime: eStartTime,
            endTime: eEndTime,
            slotsAvailable: Number(eScheduleSlots),
          },
        ];
      }
      await api.put(`/stations/${id}`, payload);
      toast.success("✅ Station updated successfully!");
      setEditingId(null);
      await loadStations();
    } catch (e3) {
      toast.error(e3?.response?.data ?? "Failed to update station");
    }
  }

  async function toggleActive(s) {
    const action = s.isActive ? "deactivate" : "activate";
    Swal.fire({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Station?`,
      text: `Are you sure you want to ${action} ${s.name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#000000",
      confirmButtonText: `Yes, ${action}`,
      cancelButtonText: "Cancel",
      background: "#000000",
      color: "#ffffff",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        setTogglingId(s.id);
        if (s.isActive) {
          await api.post(`/stations/${s.id}/deactivate`);
          toast("Station deactivated", { icon: "❌" });
        } else {
          await api.post(`/stations/${s.id}/activate`);
          toast("Station activated", { icon: "✅" });
        }
        await loadStations();
      } catch (e4) {
        if (e4?.response?.status === 409) {
          const msg =
            e4.response.data?.message ||
            e4.response.data ||
            "Cannot change station state";
          toast.error(msg);
        } else {
          toast.error(e4?.response?.data ?? "Failed to update status");
        }
      } finally {
        setTogglingId(null);
      }
    });
  }

  async function removeStation(s) {
    Swal.fire({
      title: "Delete Station?",
      text: `This will permanently delete ${s.name}. This action cannot be undone!`,
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#000000",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      background: "#000000",
      color: "#ffffff",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/stations/${s.id}`);
          toast.success("🗑️ Station deleted successfully!");
          await loadStations();
        } catch (e5) {
          // Normalize server response into a string to avoid React trying to render an object
          const resp = e5?.response?.data;
          let msg;
          if (resp) {
            if (typeof resp === "string") msg = resp;
            else if (resp.message) msg = resp.message;
            else {
              try {
                msg = JSON.stringify(resp);
              } catch {
                msg = "Failed to delete station";
              }
            }
          } else {
            msg = "Failed to delete station";
          }
          toast.error(msg);
        }
      }
    });
  }

  const goToPage = (page) => setCurrentPage(page);
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const goToNextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    for (let i = startPage; i <= endPage; i++) pages.push(i);
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
      <Toaster position="top-right" />
      <div className="max-w-8xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-green-400 flex items-center gap-3">
              <Building2 className="w-8 h-8" />
              EV Charging Stations
            </h1>
            <p className="text-gray-800 mt-2 font-semibold">
              Manage charging stations and their availability
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateForm(true)}
            className="bg-green-500 text-black font-bold px-6 py-3 rounded-3xl hover:bg-green-400 transition-all duration-200 flex items-center gap-2 mt-4 lg:mt-0"
          >
            <Plus className="w-5 h-5" /> Add New Station
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-gray-800 rounded-3xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm">Total Stations</p>
            <p className="text-3xl font-bold text-white mt-2">
              {stations.length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-3xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm">Active Stations</p>
            <p className="text-3xl font-bold text-white mt-2">
              {stations.filter((s) => s.isActive).length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-3xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm">Available Slots Total</p>
            <p className="text-3xl font-bold text-white mt-2">
              {stations.reduce((sum, s) => sum + (s.availableSlots || 0), 0)}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-3xl border border-gray-700 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-700">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search stations by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-[500px] pl-10 pr-4 py-3 bg-gray-900 border border-gray-600 rounded-3xl text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                />
              </div>
              <div className="text-gray-400 text-sm">
                Showing {Math.min(currentStations.length, itemsPerPage)} of{" "}
                {filteredStations.length} stations
                {searchTerm && ` for "${searchTerm}"`}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Station
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Capacity
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Start Time
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    End Time
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Scheduled Slots
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
                    <td
                      colSpan="9"
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      Loading stations...
                    </td>
                  </tr>
                ) : currentStations.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      No stations found{" "}
                      {searchTerm && ` matching "${searchTerm}"`}
                    </td>
                  </tr>
                ) : (
                  currentStations.map((s) => {
                    const firstSchedule =
                      s.schedules && s.schedules.length > 0
                        ? s.schedules[0]
                        : null;
                    const isEditing = editingId === s.id;
                    return (
                      <motion.tr
                        key={s.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-750 transition-colors"
                      >
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <input
                              className="p-2 rounded-lg bg-gray-700 border border-gray-600 text-white w-full"
                              value={eName}
                              onChange={(e) => setEName(e.target.value)}
                            />
                          ) : (
                            <span className="text-white font-semibold">
                              {s.name}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <input
                              className="p-2 rounded-lg bg-gray-700 border border-gray-600 text-white w-full"
                              value={eLocation}
                              onChange={(e) => setELocation(e.target.value)}
                            />
                          ) : (
                            <span className="text-gray-300">{s.location}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <select
                              className="p-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
                              value={eType}
                              onChange={(e) => setEType(e.target.value)}
                            >
                              <option value="AC">AC</option>
                              <option value="DC">DC</option>
                            </select>
                          ) : (
                            <span className="text-gray-300">{s.type}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <input
                              type="number"
                              className="p-2 rounded-lg bg-gray-700 border border-gray-600 text-white w-24"
                              value={eSlots}
                              onChange={(e) => setESlots(e.target.value)}
                            />
                          ) : (
                            <span className="text-gray-300">
                              {s.availableSlots}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <input
                              type="datetime-local"
                              className="p-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
                              value={eStartTime}
                              onChange={(e) => setEStartTime(e.target.value)}
                            />
                          ) : (
                            <span className="text-gray-300">
                              {firstSchedule
                                ? new Date(
                                    firstSchedule.startTime
                                  ).toLocaleString()
                                : "-"}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <input
                              type="datetime-local"
                              className="p-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
                              value={eEndTime}
                              onChange={(e) => setEEndTime(e.target.value)}
                            />
                          ) : (
                            <span className="text-gray-300">
                              {firstSchedule
                                ? new Date(
                                    firstSchedule.endTime
                                  ).toLocaleString()
                                : "-"}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <input
                              type="number"
                              className="p-2 rounded-lg bg-gray-700 border border-gray-600 text-white w-24"
                              value={eScheduleSlots}
                              onChange={(e) =>
                                setEScheduleSlots(e.target.value)
                              }
                            />
                          ) : (
                            <span className="text-gray-300">
                              {firstSchedule
                                ? firstSchedule.slotsAvailable
                                : "-"}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                              s.isActive
                                ? "bg-green-400/20 text-green-400 border border-green-400/30"
                                : "bg-gray-600 text-gray-300 border border-gray-500"
                            }`}
                          >
                            {s.isActive ? (
                              <>
                                <CheckCircle className="w-3 h-3" /> Active
                              </>
                            ) : (
                              <>
                                <Ban className="w-3 h-3" /> Inactive
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          {!isEditing ? (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => startEdit(s)}
                                className="p-2 bg-green-500 text-black rounded-lg hover:bg-green-400"
                              >
                                <Edit3 className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => toggleActive(s)}
                                disabled={togglingId === s.id}
                                className={`p-2 rounded-lg ${
                                  s.isActive
                                    ? "bg-yellow-500 text-black hover:bg-yellow-400"
                                    : "bg-green-500 text-black hover:bg-green-400"
                                }`}
                              >
                                <Power className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => removeStation(s)}
                                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </>
                          ) : (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => saveEdit(s.id)}
                                className="px-3 py-2 bg-green-500 text-black rounded-lg flex items-center gap-1"
                              >
                                <Save className="w-4 h-4" /> Save
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={cancelEdit}
                                className="px-3 py-2 bg-gray-600 text-white rounded-lg"
                              >
                                <X className="w-4 h-4" /> Cancel
                              </motion.button>
                            </>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredStations.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-t border-gray-700 bg-gray-900">
              <div className="text-gray-400 text-sm mb-4 sm:mb-0">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, filteredStations.length)} of{" "}
                {filteredStations.length} entries
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-gray-700 text-gray-300 disabled:opacity-30"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </motion.button>
                <motion.button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-gray-700 text-gray-300 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </motion.button>
                {getPageNumbers().map((page) => (
                  <motion.button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium ${
                      currentPage === page
                        ? "bg-green-500 text-black"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    {page}
                  </motion.button>
                ))}
                <motion.button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-gray-700 text-gray-300 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
                <motion.button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-gray-700 text-gray-300 disabled:opacity-30"
                >
                  <ChevronsRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-3xl border border-gray-700 w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <Plus className="w-6 h-6 text-green-400" /> Create Station
                </h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={createStation} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-300">Name *</label>
                    <input
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Location *</label>
                    <input
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Type *</label>
                    <select
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      <option value="AC">AC</option>
                      <option value="DC">DC</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Capacity *</label>
                    <input
                      type="number"
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                      value={slots}
                      onChange={(e) => setSlots(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">
                      Start Time *
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">End Time *</label>
                    <input
                      type="datetime-local"
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">
                      Schedule Slots *
                    </label>
                    <input
                      type="number"
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                      value={scheduleSlots}
                      onChange={(e) => setScheduleSlots(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-3 bg-gray-700 text-white rounded-xl"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 bg-green-500 text-black font-bold rounded-xl flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> Create Station
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

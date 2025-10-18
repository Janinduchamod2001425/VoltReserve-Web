import { useEffect, useMemo, useState } from "react";
import api, { auth } from "../api";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Building2,
  Battery,
  X,
  Save,
  Ban,
  CheckCircle,
} from "lucide-react";

export default function MyStations() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state
  const [openStation, setOpenStation] = useState(null);
  const [scheduleEdits, setScheduleEdits] = useState([]);

  // Role check (re-evaluate on each render so login updates are picked up)
  const canView = (() => {
    const isOp =
      typeof auth.isStationOperator === "function"
        ? auth.isStationOperator()
        : false;
    const isBo =
      typeof auth.isBackoffice === "function" ? auth.isBackoffice() : false;
    return isOp || isBo;
  })();

  useEffect(() => {
    if (canView) loadStations();
  }, [canView]);

  const filteredStations = useMemo(
    () =>
      stations.filter(
        (s) =>
          s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.location?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [stations, searchTerm]
  );

  function sumScheduleSlots(station) {
    return (station.schedules ?? []).reduce(
      (acc, sch) =>
        acc +
        (typeof sch?.slotsAvailable === "number" ? sch.slotsAvailable : 0),
      0
    );
  }

  async function loadStations() {
    setLoading(true);
    try {
      const { data } = await api.get("/stations");
      setStations(data ?? []);
    } catch (e) {
      toast.error(readErr(e, "Failed to load stations"));
    } finally {
      setLoading(false);
    }
  }

  function openAvailabilityModal(station) {
    setOpenStation(station);
    const edits = (station.schedules ?? []).map((sch) =>
      typeof sch?.slotsAvailable === "number" ? sch.slotsAvailable : 0
    );
    setScheduleEdits(edits);
  }

  function closeAvailabilityModal() {
    setOpenStation(null);
    setScheduleEdits([]);
  }

  function setEditValue(idx, val) {
    // Normalize input to non-negative integer
    const raw = Number(val || 0);
    const n = Math.max(0, Number.isFinite(raw) ? Math.floor(raw) : 0);

    // determine station capacity (support both camelCase and PascalCase)
    const maxSlots =
      openStation?.availableSlots ??
      openStation?.AvailableSlots ??
      Number.MAX_SAFE_INTEGER;

    const clamped = Math.min(n, maxSlots);
    if (n > maxSlots) {
      toast.error(`Cannot set more than station capacity (${maxSlots}).`);
    }

    setScheduleEdits((prev) => {
      const next = [...prev];
      next[idx] = clamped;
      return next;
    });
  }

  function readErr(e, fallback) {
    if (typeof e?.response?.data === "string") return e.response.data;
    if (e?.response?.data?.title) return e.response.data.title;
    if (e?.message) return e.message;
    return fallback;
  }

  async function patchScheduleSlots(stationId, scheduleId, slots) {
    return api.patch(
      `/stations/${stationId}/schedules/${scheduleId}/slots`,
      JSON.stringify(slots),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  async function updateOneSchedule(scheduleId, index) {
    if (!openStation) return;
    const newSlots = Number(scheduleEdits[index] ?? 0);

    const maxSlots =
      openStation?.availableSlots ??
      openStation?.AvailableSlots ??
      Number.MAX_SAFE_INTEGER;

    if (newSlots > maxSlots) {
      toast.error(
        `Cannot update: value exceeds station capacity (${maxSlots}).`
      );
      return;
    }

    try {
      await patchScheduleSlots(openStation.id, scheduleId, newSlots);
      toast.success("Availability updated");
      const updatedStation = {
        ...openStation,
        schedules: (openStation.schedules ?? []).map((s) =>
          s.id === scheduleId ? { ...s, slotsAvailable: newSlots } : s
        ),
      };
      setOpenStation(updatedStation);
      setStations((prev) =>
        prev.map((st) => (st.id === updatedStation.id ? updatedStation : st))
      );
    } catch (e) {
      toast.error(readErr(e, "Failed to update availability"));
    }
  }

  if (!canView) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto mt-12 bg-red-50/10 border border-red-500 text-red-300 p-6 rounded-2xl"
      >
        <div className="flex items-center gap-3">
          <Ban className="w-6 h-6" />
          <span>Forbidden: Operator or Backoffice role required.</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <Toaster position="top-right" />
      <div className="max-w-8xl mx-auto">
        {/* Header */}
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
              View stations and update live availability per schedule
            </p>
          </div>
        </motion.div>

        {/* Stats Cards */}
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
            <p className="text-gray-400 text-sm">Schedule Slots Total</p>
            <p className="text-3xl font-bold text-white mt-2">
              {stations.reduce((sum, s) => sum + sumScheduleSlots(s), 0)}
            </p>
          </div>
        </motion.div>

        {/* Search and Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-3xl border border-gray-700 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-700">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search stations by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-600 rounded-3xl text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
              />
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
                    Schedule Slots
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
                      colSpan="6"
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      Loading stations...
                    </td>
                  </tr>
                ) : filteredStations.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      No stations found{" "}
                      {searchTerm && ` matching "${searchTerm}"`}
                    </td>
                  </tr>
                ) : (
                  filteredStations.map((s) => {
                    const totalSchSlots = sumScheduleSlots(s);
                    return (
                      <motion.tr
                        key={s.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-750 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="text-white font-semibold">
                            {s.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-300">{s.location}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-300">{s.type}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-300">
                            {totalSchSlots}
                            <span className="text-xs text-gray-500 ml-1">
                              ({s.schedules?.length || 0} sch)
                            </span>
                          </span>
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
                        <td className="px-6 py-4">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openAvailabilityModal(s)}
                            className="px-3 py-2 bg-green-500 text-black rounded-lg flex items-center gap-2"
                          >
                            <Battery className="w-4 h-4" />
                            Manage Availability
                          </motion.button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Availability Modal */}
      <AnimatePresence>
        {openStation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={closeAvailabilityModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-3xl border border-gray-700 w-full max-w-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <Battery className="w-6 h-6 text-green-400" />
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Manage Availability
                    </h2>
                    <p className="text-gray-400 text-sm">
                      {openStation.name} • {openStation.location}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeAvailabilityModal}
                  className="p-2 hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                {(openStation.schedules ?? []).length === 0 ? (
                  <div className="text-gray-400 text-center py-10">
                    No schedules configured for this station.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(openStation.schedules ?? []).map((sch, idx) => (
                      <div
                        key={sch.id}
                        className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 bg-gray-900 rounded-2xl border border-gray-700"
                      >
                        <div className="flex-1">
                          <p className="text-white font-semibold">
                            Schedule #{idx + 1}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {sch?.startTime && sch?.endTime
                              ? `${sch.startTime} - ${sch.endTime}`
                              : "Configured window"}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min={0}
                            value={scheduleEdits[idx] ?? 0}
                            max={
                              openStation
                                ? openStation.availableSlots ??
                                  openStation.AvailableSlots ??
                                  undefined
                                : undefined
                            }
                            onChange={(e) => setEditValue(idx, e.target.value)}
                            className="w-28 p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                          />
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => updateOneSchedule(sch.id, idx)}
                            className="px-4 py-3 bg-green-500 text-black font-bold rounded-xl flex items-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            Update
                          </motion.button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer (Save All removed) */}
              {(openStation.schedules ?? []).length > 0 && (
                <div className="flex justify-end p-6 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={closeAvailabilityModal}
                    className="px-6 py-3 bg-gray-700 text-white rounded-xl"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

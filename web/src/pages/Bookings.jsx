/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from "react";
import api, { auth } from "../api";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";
import { QRCodeCanvas } from "qrcode.react"; 
import {
  Calendar,
  RefreshCw,
  Plus,
  Edit3,
  Trash2,
  Clock,
  Search,
  Filter,
  XCircle,
  AlertTriangle,
  User,
  MapPin,
  Zap,
  CheckCircle2,
  QrCode,
  X,      
  Save  
} from "lucide-react";

/** Date -> nice local string */
function fmt(dt) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt;
  }
}

/** Format .NET TimeSpan-like values to "HH:mm" */
function fmtTimeOfDay(t) {
  if (!t) return "";
  if (typeof t === "string") {
    const parts = t.split(".");
    const hms = parts.length > 1 ? parts[1] : parts[0];
    const [h = "00", m = "00"] = hms.split(":");
    return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
  }
  if (typeof t === "object") {
    const h = String(t.hours ?? t.Hours ?? 0).padStart(2, "0");
    const m = String(t.minutes ?? t.Minutes ?? 0).padStart(2, "0");
    return `${h}:${m}`;
  }
  return String(t).slice(0, 5);
}

const statusChips = {
  Pending:
    "bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 px-3 py-1 rounded-full text-xs font-semibold",
  Approved:
    "bg-green-500/15 text-green-300 border border-green-500/30 px-3 py-1 rounded-full text-xs font-semibold",
  Cancelled:
    "bg-gray-500/20 text-gray-300 border border-gray-400/30 px-3 py-1 rounded-full text-xs font-semibold",
  Completed:
    "bg-blue-500/15 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-semibold",
};

export default function Bookings() {
  const canUse = auth.isBackoffice();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // stations
  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(true);

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");

  // extra filters for Approved tab
  const [filterStation, setFilterStation] = useState("");
  const [filterSlot, setFilterSlot] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // create modal
  const [showCreate, setShowCreate] = useState(false);
  const [cNic, setCNic] = useState("");
  const [cUserId, setCUserId] = useState("");

  // station-derived fields
  const [cStationId, setCStationId] = useState("");
  const [cStationName, setCStationName] = useState("");
  const [cType, setCType] = useState("AC");
  const [cSlot, setCSlot] = useState(1);
  const [cDate, setCDate] = useState("");
  const [cStart, setCStart] = useState("");
  const [cEnd, setCEnd] = useState("");

  // edit modal
  const [editing, setEditing] = useState(null);
  const [eStationId, setEStationId] = useState("");
  const [eStationName, setEStationName] = useState("");
  const [eType, setEType] = useState("AC");
  const [eSlot, setESlot] = useState(1);
  const [eDate, setEDate] = useState("");
  const [eStart, setEStart] = useState("");
  const [eEnd, setEEnd] = useState("");

  //  QR modal state
  const [showQR, setShowQR] = useState(false);
  const [qrBooking, setQrBooking] = useState(null);

  // -------- data loaders --------
  async function loadBookings() {
    setLoading(true);
    try {
      const { data } = await api.get("/Booking");
      setBookings(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e?.response?.data ?? "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }

  async function loadStations() {
    setStationsLoading(true);
    try {
      const { data } = await api.get("/Stations");
      const onlyActive = (Array.isArray(data) ? data : []).filter((s) => s.isActive);
      setStations(onlyActive);
    } catch (e) {
      toast.error(e?.response?.data ?? "Failed to load stations");
    } finally {
      setStationsLoading(false);
    }
  }

  useEffect(() => {
    if (canUse) {
      loadBookings();
      loadStations();
    }
  }, [canUse]);

  // counts for tabs
  const counts = useMemo(() => {
    const c = { ALL: bookings.length, Pending: 0, Approved: 0, Cancelled: 0, Completed: 0 };
    for (const b of bookings) if (c[b.status] !== undefined) c[b.status] += 1;
    return c;
  }, [bookings]);

  // filtering logic
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (bookings ?? [])
      .filter((b) => (status === "ALL" ? true : String(b.status) === status))
      .filter((b) => {
        if (!term) return true;
        return (
          (b.nic ?? "").toLowerCase().includes(term) ||
          (b.stationId ?? "").toLowerCase().includes(term) ||
          (b.stationName ?? "").toLowerCase().includes(term) ||
          (b.type ?? "").toLowerCase().includes(term)
        );
      })
      .filter((b) => {
        if (status !== "Approved") return true;
        const stationOk = filterStation
          ? (b.stationName ?? "").toLowerCase().includes(filterStation.toLowerCase())
          : true;
        const slotOk = filterSlot ? b.selectedSlot === Number(filterSlot) : true;
        const dateOk = filterDate
          ? new Date(b.reservationDate).toISOString().slice(0, 10) === filterDate
          : true;
        return stationOk && slotOk && dateOk;
      })
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }, [bookings, q, status, filterStation, filterSlot, filterDate]);

  // helper: current selected station (create form)
  const selectedCreateStation = useMemo(
    () => stations.find((s) => s.id === cStationId) || null,
    [stations, cStationId]
  );

  function onPickCreateStation(stationId) {
    setCStationId(stationId);
    const st = stations.find((s) => s.id === stationId);
    if (st) {
      setCStationName(st.name || "");
      setCType(st.type || "AC");
      if (cSlot < 1) setCSlot(1);
    } else {
      setCStationName("");
    }
  }

  // approve booking
  async function approveBooking(b) {
    try {
      await api.patch(`/Booking/${b.id}/approve`);
       toast.success(`✅ Booking approved — QR emailed to ${b.nic}`);
      await loadBookings();
      setStatus("Approved");
    } catch (ex) {
      toast.error(ex?.response?.data ?? "Approve failed");
    }
  }

  // ---------- create ----------
  async function submitCreate(e) {
    e.preventDefault();
    if (!cNic || !cStationId || !cDate || !cStart || !cEnd || !cSlot) {
      toast.error("NIC, Station, Date/Time, Start, End and Slot are required");
      return;
    }
    if (cStart >= cEnd) {
      toast.error("Start time must be before end time");
      return;
    }

    const when = new Date(cDate);
    const payload = {
      nic: cNic,
      userId: cUserId,
      stationId: cStationId,
      stationName: cStationName,
      type: cType,
      reservationDate: when.toISOString(),
      startTime: `${cStart}:00`,
      endTime: `${cEnd}:00`,
      selectedSlot: Number(cSlot),
      status: "Pending",
    };
    try {
      await api.post("/Booking", payload);
      toast.success("✅ Booking created");
      setShowCreate(false);
      setCNic("");
      setCUserId("");
      setCStationId("");
      setCStationName("");
      setCType("AC");
      setCSlot(1);
      setCDate("");
      setCStart("");
      setCEnd("");
      await loadBookings();
    } catch (ex) {
      toast.error(ex?.response?.data ?? "Create failed");
    }
  }

  // ---------- edit ----------
  function startEdit(b) {
    setEditing(b);
    setEStationId(b.stationId || "");
    setEStationName(b.stationName || "");
    setEType(b.type || "AC");
    setESlot(b.selectedSlot || 1);
    const dt = new Date(b.reservationDate);
    const pad = (n) => String(n).padStart(2, "0");
    const local = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(
      dt.getHours()
    )}:${pad(dt.getMinutes())}`;
    setEDate(local);
    setEStart(fmtTimeOfDay(b.startTime));
    setEEnd(fmtTimeOfDay(b.endTime));
  }

  function onPickEditStation(stationId) {
    setEStationId(stationId);
    const st = stations.find((s) => s.id === stationId);
    if (st) {
      setEStationName(st.name || "");
      setEType(st.type || "AC");
      if (eSlot < 1) setESlot(1);
    } else {
      setEStationName("");
    }
  }

  async function submitEdit(e) {
    e.preventDefault();
    if (!editing) return;
    if (!eDate || !eStart || !eEnd) {
      toast.error("Date, Start and End times are required");
      return;
    }
    if (eStart >= eEnd) {
      toast.error("Start time must be before end time");
      return;
    }

    const when = new Date(eDate).toISOString();
    const payload = {
      stationId: eStationId,
      stationName: eStationName,
      type: eType,
      selectedSlot: Number(eSlot),
      reservationDate: when,
      startTime: `${eStart}:00`,
      endTime: `${eEnd}:00`,
      status: editing.status,
    };
    try {
      await api.put(`/Booking/${editing.id}`, payload);
      toast.success("✏️ Booking updated");
      setEditing(null);
      await loadBookings();
    } catch (ex) {
      toast.error(ex?.response?.data ?? "Update failed");
    }
  }

  // ---------- cancel ----------
  async function cancelBooking(b) {
    const res = await Swal.fire({
      title: "Cancel booking?",
      text: `NIC ${b.nic} • ${b.stationName || b.stationId} • ${fmt(b.reservationDate)}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel",
      confirmButtonColor: "#ef4444",
      background: "#000000",
      color: "#ffffff",
      customClass: { popup: "rounded-2xl border border-gray-700" },
    });
    if (!res.isConfirmed) return;
    try {
      await api.delete(`/Booking/${b.id}`);
      toast.success(`❌ Booking cancelled — email sent to ${b.nic}`);
      await loadBookings();
    } catch (ex) {
      toast.error(ex?.response?.data ?? "Cancel failed");
    }
  }

  //  open QR modal
  function openQRModal(b) {
    setQrBooking(b);
    setShowQR(true);
  }

  if (!canUse) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto mt-12 bg-red-50/10 border border-red-500 text-red-300 p-6 rounded-2xl"
      >
        <div className="flex items-center gap-3">
          <XCircle className="w-6 h-6" />
          <span>Forbidden: Backoffice role required to view bookings.</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 mt-12 md:mt-16">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#1f2937", color: "white", border: "1px solid #374151" },
        }}
      />

      <div className="max-w-8xl mx-auto">
        {/* header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6"
        >
          <div>
            <h2 className="text-3xl font-bold text-green-500 flex items-center gap-3">
              <Calendar className="w-8 h-8" />
              Booking Management
            </h2>
            <p className="text-gray-800 mt-1 font-semibold">
              Create, approve, update, cancel, and search bookings.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by NIC / Station / Type"
                className="pl-9 pr-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="py-2 px-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="ALL">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                loadBookings();
                loadStations();
              }}
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 bg-green-500 text-black font-semibold px-4 py-2 rounded-xl"
            >
              <Plus className="w-4 h-4" />
              New Booking
            </motion.button>
          </div>
        </motion.div>

        {/* STATUS TABS */}
        <div className="mb-3 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {[
              { key: "ALL", label: "All" },
              { key: "Pending", label: "Pending" },
              { key: "Approved", label: "Approved" },
              { key: "Cancelled", label: "Cancelled" },
              { key: "Completed", label: "Completed" },
            ].map((t) => {
              const active = status === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setStatus(t.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-colors ${
                    active
                      ? "bg-gray-900 text-white border-gray-700"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <span>{t.label}</span>
                  <span
                    className={`text-xs font-bold rounded-full px-2 py-0.5 ${
                      active ? "bg-green-500 text-black" : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {t.key === "ALL" ? counts.ALL : counts[t.key] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Extra filters for Approved bookings */}
        {status === "Approved" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-gray-100 p-4 rounded-2xl border border-gray-300"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Filter Approved Bookings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600">Station Name</label>
                <input
                  type="text"
                  placeholder="e.g., Galle Station"
                  value={filterStation}
                  onChange={(e) => setFilterStation(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Slot</label>
                <input
                  type="number"
                  placeholder="e.g., 1"
                  value={filterSlot}
                  onChange={(e) => setFilterSlot(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Reservation Date</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* helper line */}
        <div className="text-sm text-gray-600 font-medium mb-2">
          Showing <span className="text-green-600">{status === "ALL" ? "ALL" : status}</span> bookings
        </div>

        {/* TABLE SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 text-white rounded-3xl border border-gray-800 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/60">
                <tr>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-gray-300">NIC</th>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-gray-300">Station</th>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-gray-300">Type/Slot</th>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-gray-300">When</th>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full mx-auto mb-3"
                      />
                      Loading bookings…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                      <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-60" />
                      No bookings found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((b) => (
                    <tr key={b.id}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-green-400" />
                          <div className="font-semibold">{b.nic}</div>
                        </div>
                        <div className="text-xs text-gray-400">{b.userId}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-400" />
                          <div className="font-medium">{b.stationName || "-"}</div>
                        </div>
                        <div className="text-xs text-gray-400">{b.stationId}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-green-400" />
                          <span>{b.type}</span>
                        </div>
                        <div className="text-xs text-gray-400">Slot #{b.selectedSlot}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-green-400" />
                          <span>{fmt(b.reservationDate)}</span>
                        </div>
                        {b.startTime && b.endTime && (
                          <div className="text-xs text-gray-400">
                            Window: {fmtTimeOfDay(b.startTime)}–{fmtTimeOfDay(b.endTime)}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">Created {fmt(b.createdAt)}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={statusChips[b.status] || statusChips.Pending}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* ✅ QR button only visible while viewing the Approved tab */}
                          {status === "Approved" && (
                            <button
                              className="px-3 py-1 rounded-lg bg-indigo-500 text-white hover:bg-indigo-400 transition-colors inline-flex items-center gap-1"
                              onClick={() => openQRModal(b)}
                              title="QR Code"
                            >
                              <QrCode className="w-4 h-4" /> QR
                            </button>
                          )}
                          {status === "Pending" && (
                            <button
                              className="px-3 py-1 rounded-lg bg-emerald-500 text-black hover:bg-emerald-400 transition-colors inline-flex items-center gap-1"
                              onClick={() => approveBooking(b)}
                              title="Approve"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Approve
                            </button>
                          )}
                          <button
                            className="px-3 py-1 rounded-lg bg-green-500 text-black hover:bg-green-400 transition-colors inline-flex items-center gap-1"
                            onClick={() => startEdit(b)}
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" /> Edit
                          </button>
                          <button
                            className="px-3 py-1 rounded-lg bg-red-500 text-white hover:bg-red-400 transition-colors inline-flex items-center gap-1"
                            onClick={() => cancelBooking(b)}
                            title="Cancel"
                          >
                            <Trash2 className="w-4 h-4" /> Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
        {/*  Create Booking Modal */}
<AnimatePresence>
  {showCreate && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={() => setShowCreate(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-3xl border border-gray-700 w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Plus className="w-6 h-6 text-green-400" /> Create Booking
          </h2>
          <button
            onClick={() => setShowCreate(false)}
            className="p-2 hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submitCreate} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-300">Owner Email / NIC *</label>
              <input
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                value={cNic}
                onChange={(e) => setCNic(e.target.value)}
                placeholder="e.g. user@email.com"
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-300">User ID (optional)</label>
              <input
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                value={cUserId}
                onChange={(e) => setCUserId(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-gray-300">Station *</label>
              <select
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                value={cStationId}
                onChange={(e) => onPickCreateStation(e.target.value)}
                required
              >
                <option value="">Select Station</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-300">Connector Type *</label>
              <input
    type="text"
    className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-gray-300"
    value={cType || ""}
    readOnly
  />
            </div>

            <div>
              <label className="text-sm text-gray-300">Slot # *</label>
              <label className="text-sm text-gray-300">Slot # *</label>
  <select
    className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
    value={cSlot}
    onChange={(e) => setCSlot(e.target.value)}
    disabled={!cStationId}
    required
  >
    <option value="">Select Slot</option>
    {(() => {
      const st = stations.find((s) => s.id === cStationId);
      if (!st || !st.availableSlots) return null;
      return Array.from({ length: st.availableSlots }, (_, i) => (
        <option key={i + 1} value={i + 1}>
          Slot {i + 1}
        </option>
      ));
    })()}
  </select>
            </div>

            <div>
              <label className="text-sm text-gray-300">Date *</label>
              <input
                type="date"
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                value={cDate}
                onChange={(e) => setCDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-300">Start Time *</label>
              <input
                type="time"
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                value={cStart}
                onChange={(e) => setCStart(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-300">End Time *</label>
              <input
                type="time"
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                value={cEnd}
                onChange={(e) => setCEnd(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
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
              <Plus className="w-5 h-5" /> Create Booking
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

{/* ✅ Edit Booking Modal — styled like Stations modals */}
<AnimatePresence>
  {editing && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={() => setEditing(null)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-3xl border border-gray-700 w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Edit3 className="w-6 h-6 text-green-400" /> Edit Booking
          </h2>
          <button
            onClick={() => setEditing(null)}
            className="p-2 hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submitEdit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-300">Station *</label>
              <select
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                value={eStationId}
                onChange={(e) => onPickEditStation(e.target.value)}
                required
              >
                <option value="">Select Station</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-300">Connector Type *</label>
              <input
    type="text"
    className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-gray-300"
    value={cType || ""}
    readOnly
  />
            </div>

            <div>
              <label className="text-sm text-gray-300">Slot # *</label>
              <select
    className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
    value={eSlot}
    onChange={(e) => setESlot(e.target.value)}
    disabled={!eStationId}
    required
  >
    <option value="">Select Slot</option>
    {(() => {
      const st = stations.find((s) => s.id === eStationId);
      if (!st || !st.availableSlots) return null;
      return Array.from({ length: st.availableSlots }, (_, i) => (
        <option key={i + 1} value={i + 1}>
          Slot {i + 1}
        </option>
      ));
    })()}
  </select>
            </div>

            <div>
              <label className="text-sm text-gray-300">Date & Time *</label>
              <input
                type="datetime-local"
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                value={eDate}
                onChange={(e) => setEDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-300">Start Time *</label>
              <input
                type="time"
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                value={eStart}
                onChange={(e) => setEStart(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-300">End Time *</label>
              <input
                type="time"
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                value={eEnd}
                onChange={(e) => setEEnd(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={() => setEditing(null)}
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
              <Save className="w-5 h-5" /> Save Changes
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
      </div>

      {/*  QR Modal */}
      <AnimatePresence>
        {showQR && qrBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            onClick={() => setShowQR(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white text-black p-6 rounded-2xl max-w-sm w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-4">Booking QR Code</h3>
              <QRCodeCanvas
                value={JSON.stringify({
                  nic: qrBooking.nic,
                  station: qrBooking.stationName,
                  slot: qrBooking.selectedSlot,
                  date: fmt(qrBooking.reservationDate),
                  start: fmtTimeOfDay(qrBooking.startTime),
                  end: fmtTimeOfDay(qrBooking.endTime),
                  status: qrBooking.status,
                })}
                size={220}
                bgColor="#ffffff"
                fgColor="#000000"
                level="M"
                includeMargin
              />
              <div className="text-sm mt-4 text-gray-700 text-left space-y-1">
                <p><strong>NIC:</strong> {qrBooking.nic}</p>
                <p><strong>Station:</strong> {qrBooking.stationName}</p>
                <p><strong>Slot:</strong> {qrBooking.selectedSlot}</p>
                <p><strong>Date:</strong> {fmt(qrBooking.reservationDate)}</p>
                <p><strong>Time:</strong> {fmtTimeOfDay(qrBooking.startTime)} – {fmtTimeOfDay(qrBooking.endTime)}</p>
              </div>
              <button
                onClick={() => setShowQR(false)}
                className="mt-5 px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-700"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

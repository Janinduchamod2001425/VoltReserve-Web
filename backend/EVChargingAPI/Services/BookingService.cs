/*
 * File: BookingService.cs
 * Description: Domain/business logic for reservations (create, update, cancel, approve, queries).
 * Author: Kavinda S.G.D
 * Last Modified: 2025-10-10
 * Notes: Uses MongoDB driver; ensures UTC storage and schedule validations.
 */




using EVChargingAPI.Models;
using EVChargingAPI.Data;
using MongoDB.Driver;
using MongoDB.Bson;

namespace EVChargingAPI.Services
{
    /// <summary>Encapsulates booking business rules & persistence.</summary>
    public class BookingService
    {
        private readonly IMongoCollection<Reservation> _reservations;
        private readonly IMongoCollection<Station> _stations;

        public BookingService(MongoDbContext context)
        {
            // Step 1: Store Mongo collections
            _reservations = context.Reservations;
            _stations = context.Stations;
        }

        
        // Helpers
        

        /// <summary>Checks if a string is a valid Mongo ObjectId.</summary>
        private static bool LooksLikeObjectId(string? s) =>
            !string.IsNullOrWhiteSpace(s) && ObjectId.TryParse(s, out _);

         /// <summary>Find a station by Id (ObjectId) or by name.</summary>
        private async Task<Station?> FindStationByAnyAsync(string raw, CancellationToken ct)
        {
             // Step 1: Resolve by Id then by name (case-insensitive)
            if (string.IsNullOrWhiteSpace(raw)) return null;

            if (LooksLikeObjectId(raw))
                return await _stations.Find(s => s.Id == raw).FirstOrDefaultAsync(ct);

            return await _stations
                .Find(s => s.Name.ToLower() == raw.Trim().ToLower())
                .FirstOrDefaultAsync(ct);
        }

        /// <summary>Ensure DateTime stored as UTC.</summary>
        private static DateTime EnsureUtc(DateTime dt) =>
            dt.Kind switch
            {
                DateTimeKind.Utc => dt,
                DateTimeKind.Local => dt.ToUniversalTime(),
                _ => DateTime.SpecifyKind(dt, DateTimeKind.Utc)
            };


        /// <summary>Checks if a slot is already reserved at the given moment.</summary>
        private async Task<bool> HasConflictAsync(string stationId, int slot, DateTime whenUtc, string? excludeId, CancellationToken ct)
        {
            // Step 1: Build conflict filter (exclude Cancelled/Completed and optionally a reservation)
            var filter = Builders<Reservation>.Filter.And(
                Builders<Reservation>.Filter.Eq(r => r.StationId, stationId),
                Builders<Reservation>.Filter.Eq(r => r.SelectedSlot, slot),
                Builders<Reservation>.Filter.Eq(r => r.ReservationDate, whenUtc),
                Builders<Reservation>.Filter.Nin(r => r.Status, new[] { ReservationStatus.Cancelled, ReservationStatus.Completed })
            );

            if (!string.IsNullOrWhiteSpace(excludeId))
                filter &= Builders<Reservation>.Filter.Ne(r => r.Id, excludeId);

            return await _reservations.Find(filter).AnyAsync(ct);
        }

        
        
         /// <summary>Pick active schedule for a given date/time, or first schedule.</summary>
        private static Schedule? GetActiveSchedule(Station station, DateTime reservationDate)
        {
            // Step 1: Try schedule that covers the time; otherwise fallback to first
            if (station.Schedules == null || station.Schedules.Count == 0)
                return null;

            // Pick the schedule that covers the booking time or fallback to first
            foreach (var s in station.Schedules)
            {
                if (reservationDate.TimeOfDay >= s.StartTime.TimeOfDay &&
                    reservationDate.TimeOfDay <= s.EndTime.TimeOfDay)
                {
                    return s;
                }
            }

            return station.Schedules.FirstOrDefault();
        }

        /// <summary>Validate a booking interval falls within a station schedule.</summary>
        private static (bool ok, string msg) ValidateWithinSchedule(Schedule? sched, TimeSpan bookingStart, TimeSpan bookingEnd)
{
    // Step 1: Bounds and ordering checks vs schedule window (local TOD)
    if (sched == null)
        return (false, "Station has no valid schedule defined.");

    var openStart = sched.StartTime.ToLocalTime().TimeOfDay;
    var openEnd = sched.EndTime.ToLocalTime().TimeOfDay;

    if (bookingStart < openStart || bookingEnd > openEnd)
        return (false, $"Booking must be within {openStart:hh\\:mm}–{openEnd:hh\\:mm}.");

    if (bookingStart >= bookingEnd)
        return (false, "Start time must be before end time.");

    return (true, "OK");
}

        
        // CREATE
        
        /// <summary>Create a booking after validating time window, slot availability and schedule.</summary>
        public async Task<(bool Success, string Message, Reservation? Data)>
            CreateBookingAsync(Reservation res, CancellationToken ct = default)
        {
             // Step 1: Validate inputs, schedule and conflicts; then insert normalized record
            var nowUtc = DateTime.UtcNow;
            var whenUtc = EnsureUtc(res.ReservationDate);

            if (whenUtc <= nowUtc)
                return (false, "Reservation time must be in the future.", null);

            if (whenUtc > nowUtc.AddDays(7))
                return (false, "Reservation must be within 7 days from today.", null);

            if (string.IsNullOrWhiteSpace(res.Nic))
                return (false, "Owner NIC is required.", null);

            if (string.IsNullOrWhiteSpace(res.StationId))
                return (false, "StationId (code/name/id) is required.", null);

            var station = await FindStationByAnyAsync(res.StationId, ct);
            if (station is null)
                return (false, "Station not found.", null);

            if (!station.IsActive)
                return (false, "Station is inactive.", null);

            if (res.SelectedSlot < 1 || res.SelectedSlot > station.AvailableSlots)
                return (false, $"Slot must be between 1 and {station.AvailableSlots}.", null);

            //  Validate booking time fits within station schedule
            var sched = GetActiveSchedule(station, whenUtc);
            var (ok, msg) = ValidateWithinSchedule(sched, res.StartTime, res.EndTime);
            if (!ok)
                return (false, msg, null);

            //  Conflict check
            var conflict = await HasConflictAsync(station.Id!, res.SelectedSlot, whenUtc, null, ct);
            if (conflict)
                return (false, "Slot is not available at the selected time.", null);

            // Normalize and save
            res.StationId = station.Id!;
            res.StationName = station.Name;
            res.Type = res.Type?.ToUpperInvariant() == "DC" ? "DC" : "AC";
            res.Status = ReservationStatus.Pending;
            res.CreatedAt = nowUtc;
            res.UpdatedAt = nowUtc;
            res.ReservationDate = whenUtc;

            await _reservations.InsertOneAsync(res, cancellationToken: ct);
            return (true, "Booking created successfully.", res);
        }

        
        // UPDATE
        
        /// <summary>Update an existing booking with validations and conflict checks.</summary>
        public async Task<(bool Success, string Message, Reservation? Data)>
            UpdateBookingAsync(string id, Reservation updated, CancellationToken ct = default)
        {
            var existing = await _reservations.Find(r => r.Id == id).FirstOrDefaultAsync(ct);
            if (existing == null)
                return (false, "Booking not found.", null);

            var nowUtc = DateTime.UtcNow;
            if (existing.ReservationDate <= nowUtc.AddHours(12))
                return (false, "Cannot update less than 12 hours before the reservation.", null);

            var newStationRaw = string.IsNullOrWhiteSpace(updated.StationId)
                ? existing.StationId
                : updated.StationId;

            var station = await FindStationByAnyAsync(newStationRaw, ct);
            if (station is null)
                return (false, "Station not found.", null);

            if (!station.IsActive)
                return (false, "Station inactive.", null);

            var newDateTime = updated.ReservationDate == default
                ? existing.ReservationDate
                : updated.ReservationDate;

            var whenUtc = EnsureUtc(newDateTime);

            if (whenUtc <= nowUtc)
                return (false, "Reservation time must be in the future.", null);
            if (whenUtc > nowUtc.AddDays(7))
                return (false, "Reservation must be within 7 days from today.", null);

            var newSlot = updated.SelectedSlot == 0 ? existing.SelectedSlot : updated.SelectedSlot;
            var newStart = updated.StartTime != default ? updated.StartTime : existing.StartTime;
            var newEnd = updated.EndTime != default ? updated.EndTime : existing.EndTime;

            //  Validate within station schedule
            var sched = GetActiveSchedule(station, whenUtc);
            var (ok, msg) = ValidateWithinSchedule(sched, newStart, newEnd);
            if (!ok)
                return (false, msg, null);

            var conflict = await HasConflictAsync(station.Id!, newSlot, whenUtc, existing.Id, ct);
            if (conflict)
                return (false, "Slot is not available at the selected time.", null);

            var update = Builders<Reservation>.Update
                .Set(x => x.StationId, station.Id)
                .Set(x => x.StationName, station.Name)
                .Set(x => x.Type, updated.Type?.ToUpperInvariant() == "DC" ? "DC" : "AC")
                .Set(x => x.SelectedSlot, newSlot)
                .Set(x => x.ReservationDate, whenUtc)
                .Set(x => x.StartTime, newStart)
                .Set(x => x.EndTime, newEnd)
                .Set(x => x.Status, updated.Status != 0 ? updated.Status : existing.Status)
                .Set(x => x.UpdatedAt, nowUtc);

            await _reservations.UpdateOneAsync(r => r.Id == id, update, cancellationToken: ct);

            existing.StationId = station.Id;
            existing.StationName = station.Name;
            existing.Type = updated.Type?.ToUpperInvariant() == "DC" ? "DC" : "AC";
            existing.SelectedSlot = newSlot;
            existing.ReservationDate = whenUtc;
            existing.StartTime = newStart;
            existing.EndTime = newEnd;
            existing.UpdatedAt = nowUtc;
            existing.Status = updated.Status != 0 ? updated.Status : existing.Status;

            return (true, "Booking updated successfully.", existing);
        }

        
        // CANCEL
        
        /// <summary>Cancel a booking (cannot cancel within 12 hours of reservation).</summary>
        public async Task<(bool Success, string Message, Reservation? Data)>
            CancelBookingAsync(string id, CancellationToken ct = default)
        {
            var existing = await _reservations.Find(r => r.Id == id).FirstOrDefaultAsync(ct);
            if (existing == null)
                return (false, "Booking not found.", null);

            var nowUtc = DateTime.UtcNow;
            if (existing.ReservationDate <= nowUtc.AddHours(12))
                return (false, "Cannot cancel less than 12 hours before reservation.", null);

            var update = Builders<Reservation>.Update
                .Set(r => r.Status, ReservationStatus.Cancelled)
                .Set(r => r.UpdatedAt, nowUtc);

            await _reservations.UpdateOneAsync(r => r.Id == id, update, cancellationToken: ct);

            existing.Status = ReservationStatus.Cancelled;
            existing.UpdatedAt = nowUtc;

            return (true, "Booking cancelled.", existing);
        }

        
        // QUERIES & APPROVE
        
        public async Task<List<Reservation>> GetAllAsync(CancellationToken ct = default) =>
            await _reservations.Find(_ => true)
                .SortByDescending(r => r.ReservationDate)
                .ToListAsync(ct);

        public async Task<List<Reservation>> GetByNicAsync(string nic, CancellationToken ct = default) =>
            await _reservations.Find(r => r.Nic == nic)
                .SortByDescending(r => r.ReservationDate)
                .ToListAsync(ct);

        public async Task<Reservation?> GetByIdAsync(string id, CancellationToken ct = default) =>
            await _reservations.Find(r => r.Id == id)
                .FirstOrDefaultAsync(ct);

        public async Task<(bool Success, string Message, Reservation? Data)>
            ApproveBookingAsync(string id, CancellationToken ct = default)
        {
            var existing = await _reservations.Find(r => r.Id == id).FirstOrDefaultAsync(ct);
            if (existing == null)
                return (false, "Booking not found.", null);

            if (existing.Status == ReservationStatus.Cancelled)
                return (false, "Cannot approve a cancelled booking.", null);

            var nowUtc = DateTime.UtcNow;

            var update = Builders<Reservation>.Update
                .Set(r => r.Status, ReservationStatus.Approved)
                .Set(r => r.UpdatedAt, nowUtc);

            await _reservations.UpdateOneAsync(r => r.Id == id, update, cancellationToken: ct);

            existing.Status = ReservationStatus.Approved;
            existing.UpdatedAt = nowUtc;

            return (true, "Booking approved.", existing);
        }
    }
}

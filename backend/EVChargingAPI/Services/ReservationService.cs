using EVChargingAPI.Data;
using EVChargingAPI.Models;
using MongoDB.Driver;

namespace EVChargingAPI.Services
{
    public class ReservationService
    {
        private readonly MongoDbContext _db;
        public ReservationService(MongoDbContext db) => _db = db;

        public async Task<Reservation> CreateAsync(Reservation req)
        {
            req.CreatedAt = DateTime.UtcNow;
            req.UpdatedAt = req.CreatedAt;
            req.Status = ReservationStatus.Pending;

            await _db.Reservations.InsertOneAsync(req);
            return req;
        }

        public async Task<Reservation?> GetByIdAsync(string id) =>
            await _db.Reservations.Find(r => r.Id == id).FirstOrDefaultAsync();

        public async Task<List<Reservation>> ListByUserAsync(string userId) =>
            await _db.Reservations.Find(r => r.UserId == userId).SortByDescending(r => r.CreatedAt).ToListAsync();

        public async Task<Reservation> UpdateAsync(string id, Action<Reservation> apply)
        {
            var res = await GetByIdAsync(id);
            if (res is null) throw new InvalidOperationException("Reservation not found");
            apply(res);
            res.UpdatedAt = DateTime.UtcNow;
            await _db.Reservations.ReplaceOneAsync(r => r.Id == id, res);
            return res;
        }

        public async Task CancelAsync(string id)
        {
            var update = Builders<Reservation>.Update
                .Set(r => r.Status, ReservationStatus.Cancelled)
                .Set(r => r.UpdatedAt, DateTime.UtcNow);
            await _db.Reservations.UpdateOneAsync(r => r.Id == id, update);
        }

        public async Task<(int pending, int approved)> CountByStatusForUserAsync(string userId)
        {
            var pendingCount = (int)await _db.Reservations.CountDocumentsAsync(r => r.UserId == userId && r.Status == ReservationStatus.Pending);
            var approvedCount = (int)await _db.Reservations.CountDocumentsAsync(r => r.UserId == userId && r.Status == ReservationStatus.Approved);
            return (pendingCount, approvedCount);
        }
    }
}

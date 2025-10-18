using EVChargingAPI.Data;
using EVChargingAPI.Models;
using MongoDB.Driver;

namespace EVChargingAPI.Services
{
    public class OwnerService
    {
        private readonly MongoDbContext _db;
        public OwnerService(MongoDbContext db) => _db = db;

        public async Task<Owner?> GetByEmailAsync(string email) =>
            await _db.Owners.Find(o => o.Email == email).FirstOrDefaultAsync();

        public async Task<Owner?> GetByNicAsync(string nic) =>
            await _db.Owners.Find(o => o.Nic == nic).FirstOrDefaultAsync();

        public async Task<Owner?> GetByPhoneAsync(string phone) =>
            await _db.Owners.Find(o => o.Phone == phone).FirstOrDefaultAsync();

        public async Task<Owner?> GetByIdAsync(string id) =>
            await _db.Owners.Find(o => o.Id == id).FirstOrDefaultAsync();

        public async Task<Owner> RegisterAsync(RegisterOwnerRequest req)
        {
            // validate uniqueness
            if (await GetByNicAsync(req.Nic) is not null) throw new InvalidOperationException("NIC already exists");
            if (await GetByEmailAsync(req.Email) is not null) throw new InvalidOperationException("Email already exists");
            if (await GetByPhoneAsync(req.Phone) is not null) throw new InvalidOperationException("Phone already exists");

            var hash = BCrypt.Net.BCrypt.HashPassword(req.Password);
            var owner = new Owner
            {
                Nic = req.Nic,
                FirstName = req.FirstName,
                LastName = req.LastName,
                Email = req.Email,
                Phone = req.Phone,
                PasswordHash = hash,
                IsActive = true,
                Vehicle = req.Vehicle is null ? null : new Vehicle
                {
                    Make = req.Vehicle.Make,
                    Model = req.Vehicle.Model,
                    BatteryCapacityKWh = req.Vehicle.BatteryCapacityKWh
                }
            };

            await _db.Owners.InsertOneAsync(owner);
            return owner;
        }

        public async Task<Owner> UpdateAsync(string ownerId, Models.UpdateOwnerRequest req)
        {
            var owner = await GetByIdAsync(ownerId);
            if (owner is null) throw new InvalidOperationException("Owner not found");

            // If phone changed, ensure uniqueness
            if (!string.Equals(owner.Phone, req.Phone, StringComparison.OrdinalIgnoreCase))
            {
                if (!string.IsNullOrWhiteSpace(req.Phone))
                {
                    var other = await GetByPhoneAsync(req.Phone!);
                    if (other is not null && other.Id != ownerId) throw new InvalidOperationException("Phone already exists");
                }
            }

            owner.FirstName = req.FirstName ?? owner.FirstName;
            owner.LastName = req.LastName ?? owner.LastName;
            owner.Phone = req.Phone ?? owner.Phone;

            if (req.Vehicle is not null)
            {
                owner.Vehicle ??= new Vehicle();
                owner.Vehicle.Make = req.Vehicle.Make ?? owner.Vehicle.Make;
                owner.Vehicle.Model = req.Vehicle.Model ?? owner.Vehicle.Model;
                owner.Vehicle.BatteryCapacityKWh = req.Vehicle.BatteryCapacityKWh <= 0 ? owner.Vehicle.BatteryCapacityKWh : req.Vehicle.BatteryCapacityKWh;
            }

            await _db.Owners.ReplaceOneAsync(o => o.Id == ownerId, owner);
            return owner;
        }

        public async Task ChangePasswordAsync(string ownerId, string currentPassword, string newPassword)
        {
            var owner = await GetByIdAsync(ownerId);
            if (owner is null) throw new InvalidOperationException("Owner not found");
            if (!VerifyPassword(owner, currentPassword)) throw new InvalidOperationException("Current password is incorrect");

            var hash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            var update = Builders<Owner>.Update.Set(o => o.PasswordHash, hash);
            await _db.Owners.UpdateOneAsync(o => o.Id == ownerId, update);
        }

        public async Task DeactivateAsync(string ownerId)
        {
            var update = Builders<Owner>.Update.Set(o => o.IsActive, false);
            await _db.Owners.UpdateOneAsync(o => o.Id == ownerId, update);
        }

        public bool VerifyPassword(Owner owner, string plainPassword) =>
            BCrypt.Net.BCrypt.Verify(plainPassword, owner.PasswordHash);



        public async Task SetActiveByNicAsync(string nic, bool active)
        {
            var update = Builders<Owner>.Update.Set(o => o.IsActive, active);
            var res = await _db.Owners.UpdateOneAsync(o => o.Nic == nic, update);
            if (res.MatchedCount == 0) throw new InvalidOperationException("Owner not found");
        }

        public async Task DeleteByNicAsync(string nic)
        {
            var res = await _db.Owners.DeleteOneAsync(o => o.Nic == nic);
            if (res.DeletedCount == 0) throw new InvalidOperationException("Owner not found");
        }
            
        public async Task<List<Owner>> GetAllAsync() =>
            await _db.Owners.Find(_ => true).ToListAsync();

    }
}

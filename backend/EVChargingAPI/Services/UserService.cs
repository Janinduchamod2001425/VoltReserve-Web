using EVChargingAPI.Data;
using EVChargingAPI.Models;
using MongoDB.Driver;

namespace EVChargingAPI.Services
{
    public class UserService
    {
        private readonly MongoDbContext _db;
        public UserService(MongoDbContext db) => _db = db;

        public async Task<User?> GetByEmailAsync(string email) =>
            await _db.Users.Find(u => u.Email == email).FirstOrDefaultAsync();

        public async Task<User> CreateAsync(string email, string plainPassword, UserRole role)
        {
            var already = await GetByEmailAsync(email);
            if (already is not null) throw new InvalidOperationException("Email already exists");

            var hash = BCrypt.Net.BCrypt.HashPassword(plainPassword);
            var user = new User { Email = email, PasswordHash = hash, Role = role, IsActive = true };
            await _db.Users.InsertOneAsync(user);
            return user;
        }

        public async Task<User?> GetByIdAsync(string id) =>
            await _db.Users.Find(u => u.Id == id).FirstOrDefaultAsync();

        public bool VerifyPassword(User user, string plain) =>
            BCrypt.Net.BCrypt.Verify(plain, user.PasswordHash);

        public async Task ChangePasswordAsync(string userId, string currentPassword, string newPassword)
        {
            var user = await GetByIdAsync(userId);
            if (user is null) throw new InvalidOperationException("User not found");
            if (!VerifyPassword(user, currentPassword)) throw new InvalidOperationException("Current password is incorrect");

            var hash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            var upd = Builders<User>.Update.Set(u => u.PasswordHash, hash);
            await _db.Users.UpdateOneAsync(u => u.Id == userId, upd);
        }

    }
}



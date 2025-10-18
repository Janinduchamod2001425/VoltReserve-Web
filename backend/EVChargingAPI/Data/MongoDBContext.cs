using EVChargingAPI.Models;
using MongoDB.Driver;

namespace EVChargingAPI.Data
{
    public class MongoDbContext
    {
        private readonly IMongoDatabase _database;

        public MongoDbContext(MongoDbSettings settings)
        {
            var client = new MongoClient(settings.ConnectionString);
            _database = client.GetDatabase(settings.DatabaseName);

            // Ensure required indexes
            EnsureIndexes();
        }

        // Collections
        public IMongoCollection<Station> Stations => _database.GetCollection<Station>("Stations");
        public IMongoCollection<User> Users => _database.GetCollection<User>("Users");
    public IMongoCollection<Owner> Owners => _database.GetCollection<Owner>("Owners");
    public IMongoCollection<Reservation> Reservations => _database.GetCollection<Reservation>("Reservations");
        // public IMongoCollection<Owner> Owners => _database.GetCollection<Owner>("Owners");
        // public IMongoCollection<Booking> Bookings => _database.GetCollection<Booking>("Bookings");

        private void EnsureIndexes()
        {
            // Users: unique email
            var users = Users;
            var emailIdx = new CreateIndexModel<User>(
                Builders<User>.IndexKeys.Ascending(u => u.Email),
                new CreateIndexOptions { Unique = true, Name = "ux_users_email" }
            );
            users.Indexes.CreateOne(emailIdx);

            // Owners: unique nic, email, phone
            var owners = Owners;
            var nicIdx = new CreateIndexModel<Owner>(
                Builders<Owner>.IndexKeys.Ascending(o => o.Nic),
                new CreateIndexOptions { Unique = true, Name = "ux_owners_nic" }
            );
            var ownerEmailIdx = new CreateIndexModel<Owner>(
                Builders<Owner>.IndexKeys.Ascending(o => o.Email),
                new CreateIndexOptions { Unique = true, Name = "ux_owners_email" }
            );
            var ownerPhoneIdx = new CreateIndexModel<Owner>(
                Builders<Owner>.IndexKeys.Ascending(o => o.Phone),
                new CreateIndexOptions { Unique = true, Name = "ux_owners_phone" }
            );
            owners.Indexes.CreateMany(new[] { nicIdx, ownerEmailIdx, ownerPhoneIdx });

            // Reservations: index by userId and reservationDate for fast lookup
            var reservations = Reservations;
            var byUser = new CreateIndexModel<Reservation>(
                Builders<Reservation>.IndexKeys.Ascending(r => r.UserId).Ascending(r => r.ReservationDate),
                new CreateIndexOptions { Name = "ix_reservations_user_resdate" }
            );
            var byStationDate = new CreateIndexModel<Reservation>(
                Builders<Reservation>.IndexKeys.Ascending(r => r.StationId).Ascending(r => r.ReservationDate),
                new CreateIndexOptions { Name = "ix_reservations_station_resdate" }
            );
            reservations.Indexes.CreateMany(new[] { byUser, byStationDate });

            // Add more indexes here as needed for other collections
        }
    }
}

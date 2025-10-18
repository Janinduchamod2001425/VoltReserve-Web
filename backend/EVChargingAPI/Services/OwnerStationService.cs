using EVChargingAPI.Data;
using EVChargingAPI.Models;
using MongoDB.Driver;

namespace EVChargingAPI.Services
{
    public class OwnerStationService
    {
        private readonly IMongoCollection<Station> _stations;

        public OwnerStationService(MongoDbContext ctx)
        {
            _stations = ctx.Stations;
        }

        public List<OwnerStationSummary> GetActiveStations()
        {
            var filter = Builders<Station>.Filter.Eq(s => s.IsActive, true);
            var projection = Builders<Station>.Projection.Expression(s => new OwnerStationSummary
            {
                Id = s.Id,
                Name = s.Name,
                Location = s.Location,
                Type = s.Type,
                AvailableSlots = s.Schedules != null ? s.Schedules.Sum(sc => sc.SlotsAvailable) : 0
            });

            return _stations.Find(filter).Project(projection).ToList();
        }
    }
}

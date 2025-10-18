/*
    StationService
    Description: Service/data-access layer for EV charging stations backed by MongoDB.
    Responsibilities:
    - CRUD operations (sync/async) for Station documents.
    - Ensures each Schedule has a stable GUID Id.
    - Supports partial updates (PATCH) with JsonElement 
    - Updates schedule slot counts within a station.
    - Performs nearby search using a Haversine distance calculation.
    Dependencies: MongoDbContext (IMongoCollection<Station>).
*/

using EVChargingAPI.Data;
using EVChargingAPI.Models;
using MongoDB.Driver;

namespace EVChargingAPI.Services
{
    public class StationService
    {
        private readonly IMongoCollection<Station> _stations;

        public StationService(MongoDbContext context)
        {
            _stations = context.Stations;
        }

        // Get all stations
        public List<Station> GetAll() =>
            _stations.Find(s => true).ToList();

        // Get station by Id
        public Station? GetById(string id) =>
            _stations.Find(s => s.Id == id).FirstOrDefault();

        //Create new station 
        public async Task<Station> CreateAsync(Station station)
        {
            // Ensure each schedule has a unique ID
            foreach (var schedule in station.Schedules)
            {
                if (string.IsNullOrEmpty(schedule.Id))
                    schedule.Id = Guid.NewGuid().ToString();
            }

            // Default latitude/longitude if missing
            if (station.Latitude == 0 && station.Longitude == 0)
            {
                station.Latitude = 0;
                station.Longitude = 0;
            }

            await _stations.InsertOneAsync(station);
            return station;
        }

        //Update (Async) — replace the whole document
        public async Task UpdateAsync(string id, Station updatedStation)
        {
            foreach (var schedule in updatedStation.Schedules)
            {
                if (string.IsNullOrEmpty(schedule.Id))
                    schedule.Id = Guid.NewGuid().ToString();
            }

            await _stations.ReplaceOneAsync(s => s.Id == id, updatedStation);
        }

        //Sync version (still used by some controller endpoints)
        public void Update(string id, Station updatedStation)
        {
            foreach (var schedule in updatedStation.Schedules)
            {
                if (string.IsNullOrEmpty(schedule.Id))
                    schedule.Id = Guid.NewGuid().ToString();
            }

            _stations.ReplaceOne(s => s.Id == id, updatedStation);
        }

        // Delete a station
        public void Delete(string id) =>
            _stations.DeleteOne(s => s.Id == id);

        //Partial update (PATCH)
        public void UpdatePartial(string id, Dictionary<string, object> updates)
        {
            var updateDef = new List<UpdateDefinition<Station>>();

            foreach (var entry in updates)
            {
                object value = entry.Value;

                // Convert JsonElement → proper .NET type
                if (value is System.Text.Json.JsonElement jsonElement)
                {
                    switch (jsonElement.ValueKind)
                    {
                        case System.Text.Json.JsonValueKind.String:
                            value = jsonElement.GetString();
                            break;
                        case System.Text.Json.JsonValueKind.Number:
                            if (jsonElement.TryGetInt32(out int intValue))
                                value = intValue;
                            else if (jsonElement.TryGetDouble(out double doubleValue))
                                value = doubleValue;
                            break;
                        case System.Text.Json.JsonValueKind.True:
                        case System.Text.Json.JsonValueKind.False:
                            value = jsonElement.GetBoolean();
                            break;
                        case System.Text.Json.JsonValueKind.Null:
                            value = null;
                            break;
                    }
                }

                updateDef.Add(Builders<Station>.Update.Set(entry.Key, value));
            }

            var combinedUpdate = Builders<Station>.Update.Combine(updateDef);
            _stations.UpdateOne(s => s.Id == id, combinedUpdate);
        }

        //Update slots for a specific schedule
        public bool UpdateScheduleSlots(string stationId, string scheduleId, int newSlots)
        {
            var station = GetById(stationId);
            if (station == null) return false;

            var schedule = station.Schedules.FirstOrDefault(s => s.Id == scheduleId);
            if (schedule == null) return false;

            schedule.SlotsAvailable = newSlots;

            Update(stationId, station);
            return true;
        }

        //Get nearby stations by coordinates (for mobile)
        public List<Station> GetNearbyStations(double latitude, double longitude, double radiusKm = 10)
        {
            const double EarthRadiusKm = 6371.0;

            return _stations.AsQueryable()
                .Where(s =>
                     s.Latitude.HasValue && s.Longitude.HasValue &&
                    (EarthRadiusKm * 2 * Math.Asin(Math.Sqrt(
                        Math.Pow(Math.Sin((s.Latitude.Value - latitude) * Math.PI / 180 / 2), 2) +
                        Math.Cos(latitude * Math.PI / 180) * Math.Cos(s.Latitude.Value * Math.PI / 180) *
                        Math.Pow(Math.Sin((s.Longitude.Value - longitude) * Math.PI / 180 / 2), 2)
                    ))) <= radiusKm)
                .ToList();
        }
    }
}


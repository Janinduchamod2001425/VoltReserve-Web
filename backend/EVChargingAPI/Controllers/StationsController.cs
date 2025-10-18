/*
    StationsController
    Description: Exposes CRUD, activation/deactivation, scheduling, and public discovery endpoints for EV charging stations.
    Security: Uses [AuthorizeBackoffice] and [AuthorizeOperatorOrBackoffice] custom policies. Public endpoints are [AllowAnonymous].
    Data: Relies on StationService for station CRUD and MongoDbContext for cross-entity checks (e.g., reservations).
    External: Uses Google Geocoding API to derive coordinates from a station’s address. API key loaded from IConfiguration["GoogleMaps:ApiKey"].
*/

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using EVChargingAPI.Models;
using EVChargingAPI.Services;
using EVChargingAPI.Security;
using EVChargingAPI.Data;
using MongoDB.Driver;
using System.Text.Json;

namespace EVChargingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StationsController : ControllerBase
    {
        private readonly StationService _stationService;
        private readonly ICurrentUser _me;
        private readonly MongoDbContext _db;
        private readonly IConfiguration _config; //to get Google API key

        public StationsController(StationService stationService, MongoDbContext db, ICurrentUser me, IConfiguration config)
        {
            _stationService = stationService;
            _db = db;
            _me = me;
            _config = config;
        }


        // BACKOFFICE WORKER ENDPOINTS
        [HttpGet]
        [AuthorizeOperatorOrBackoffice]
        public ActionResult<List<Station>> GetStations() =>
            _stationService.GetAll();

        [HttpGet("{id:length(24)}")]
        [AuthorizeBackoffice]
        public ActionResult<Station> GetStation(string id)
        {
            var station = _stationService.GetById(id);
            if (station == null)
                return NotFound();
            return station;
        }

        // Helper method to fetch coordinates using Google Geocoding API
        private async Task<(double lat, double lng)> GetCoordinatesFromAddress(string address)
        {
            using var client = new HttpClient();

            string apiKey = _config["GoogleMaps:ApiKey"] ?? throw new Exception("Google Maps API key not configured");
            string url = $"https://maps.googleapis.com/maps/api/geocode/json?address={Uri.EscapeDataString(address)}&key={apiKey}";

            var response = await client.GetAsync(url);
            if (!response.IsSuccessStatusCode)
                throw new Exception("Failed to get coordinates from Google API");

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            if (!doc.RootElement.TryGetProperty("results", out var results) || results.GetArrayLength() == 0)
                throw new Exception("Invalid location");

            var location = results[0].GetProperty("geometry").GetProperty("location");
            double lat = location.GetProperty("lat").GetDouble();
            double lng = location.GetProperty("lng").GetDouble();

            return (lat, lng);
        }

        //POST api/stations - Backoffice only (auto geolocation)
        [HttpPost]
        [AuthorizeBackoffice]
        public async Task<ActionResult<Station>> CreateStation([FromBody] Station station)
        {
            try
            {
                //fetch coordinates based on location
                var (lat, lng) = await GetCoordinatesFromAddress(station.Location);
                station.Latitude = lat;
                station.Longitude = lng;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WARN] Failed to geocode: {ex.Message}");
                station.Latitude = 0;
                station.Longitude = 0;
            }

            await _stationService.CreateAsync(station);
            return CreatedAtAction(nameof(GetStation), new { id = station.Id }, station);
        }

        //Backoffice only (recalculate geolocation if location changed)
        [HttpPut("{id:length(24)}")]
        [AuthorizeBackoffice]
        public async Task<IActionResult> UpdateStation(string id, [FromBody] Station updatedStation)
        {
            var existing = _stationService.GetById(id);
            if (existing == null)
                return NotFound();

            updatedStation.Id = id;

            // If location changed, re-fetch coordinates
            if (!string.Equals(existing.Location, updatedStation.Location, StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    var (lat, lng) = await GetCoordinatesFromAddress(updatedStation.Location);
                    updatedStation.Latitude = lat;
                    updatedStation.Longitude = lng;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[WARN] Failed to geocode update: {ex.Message}");
                    updatedStation.Latitude = existing.Latitude;
                    updatedStation.Longitude = existing.Longitude;
                }
            }

            await _stationService.UpdateAsync(id, updatedStation);
            return NoContent();
        }

        //Partially updates a station by applying provided field changes (backoffice).
        [HttpPatch("{id:length(24)}")]
        [AuthorizeBackoffice]
        public IActionResult UpdateStationPartial(string id, [FromBody] Dictionary<string, object> updates)
        {
            var existing = _stationService.GetById(id);
            if (existing == null)
                return NotFound();

            _stationService.UpdatePartial(id, updates);
            return NoContent();
        }

        // Updates station capacity (backoffice).
        [HttpPatch("{id:length(24)}/capacity")]
        [AuthorizeBackoffice]
        public IActionResult UpdateStationCapacity(string id, [FromBody] int newCapacity)
        {
            var station = _stationService.GetById(id);
            if (station == null)
                return NotFound();

            if (newCapacity < 0)
                return BadRequest("Capacity cannot be negative.");

            station.AvailableSlots = newCapacity;
            _stationService.Update(id, station);

            return Ok(new { station.Id, station.AvailableSlots });
        }

        [HttpDelete("{id:length(24)}")]
        [AuthorizeBackoffice]
        public async Task<IActionResult> DeleteStation(string id)
        {
            var existing = _stationService.GetById(id);
            if (existing == null)
                return NotFound();

            var now = DateTime.UtcNow;
            var hasBlocking = await _db.Reservations
                .Find(r =>
                    r.StationId == id &&
                    (r.Status == ReservationStatus.Pending || r.Status == ReservationStatus.Approved) &&
                    r.ReservationDate >= now)
                .AnyAsync();

            if (hasBlocking)
                return Conflict(new
                {
                    message = "Cannot delete: station has pending or approved future reservations."
                });

            _stationService.Delete(id);
            return NoContent();
        }

        // STATION OPERATOR ENDPOINTS
        // Updates available slots for a specific schedule
        [HttpPatch("{id:length(24)}/schedules/{scheduleId}/slots")]
        [AuthorizeOperatorOrBackoffice]
        public IActionResult UpdateScheduleSlots(string id, string scheduleId, [FromBody] int newSlots)
        {
            var station = _stationService.GetById(id);
            if (station == null)
                return NotFound();

            var schedule = station.Schedules.FirstOrDefault(s => s.Id == scheduleId);
            if (schedule == null)
                return NotFound("Schedule not found.");

            if (newSlots < 0)
                return BadRequest("Available slots cannot be negative.");

            if (newSlots > station.AvailableSlots)
                return BadRequest("Available slots cannot exceed station capacity.");

            schedule.SlotsAvailable = newSlots;
            _stationService.Update(id, station);

            return Ok(schedule);
        }

        // ACTIVATE / DEACTIVATE
        // Deactivates a station if there are no pending/approved future reservations
        [HttpPost("{id:length(24)}/deactivate")]
        [AuthorizeBackoffice]
        public async Task<IActionResult> DeactivateStation(string id)
        {
            var station = _stationService.GetById(id);
            if (station == null) return NotFound();

            if (!station.IsActive)
                return BadRequest("Station already inactive.");

            var now = DateTime.UtcNow;
            var hasBlocking = await _db.Reservations
                .Find(r =>
                    r.StationId == id &&
                    (r.Status == ReservationStatus.Pending || r.Status == ReservationStatus.Approved) &&
                    r.ReservationDate >= now)
                .AnyAsync();

            if (hasBlocking)
                return Conflict(new
                {
                    message = "Cannot deactivate: station has pending or approved future reservations."
                });

            station.IsActive = false;
            _stationService.Update(id, station);
            return Ok(new { station.Id, station.IsActive });
        }

        // Activates a station
        [HttpPost("{id:length(24)}/activate")]
        [AuthorizeBackoffice]
        public IActionResult ActivateStation(string id)
        {
            var station = _stationService.GetById(id);
            if (station == null) return NotFound();

            if (station.IsActive)
                return BadRequest("Station already active.");

            station.IsActive = true;
            _stationService.Update(id, station);
            return Ok(new { station.Id, station.IsActive });
        }


        // PUBLIC ENDPOINTS (for EV Owners)
        // Returns active stations for public discovery
        [HttpGet("public")]
        [AllowAnonymous]
        public ActionResult<List<Station>> GetPublicStations()
        {
            // Return only active stations to owners
            var stations = _stationService.GetAll()
                .Where(s => s.IsActive)
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.Location,
                    s.Type,
                    s.AvailableSlots,
                    s.Latitude,
                    s.Longitude
                })
                .ToList();

            return Ok(stations);
        }

        // Returns stations near the provided coordinate
        [HttpGet("nearby")]
        [AllowAnonymous] 
        public ActionResult<List<Station>> GetNearbyStations(
            [FromQuery] double lat,
            [FromQuery] double lng,
            [FromQuery] double radiusKm = 10)
        {
            if (lat == 0 || lng == 0)
                return BadRequest("Latitude and Longitude are required.");

            var nearbyStations = _stationService.GetNearbyStations(lat, lng, radiusKm);
            return Ok(nearbyStations);
        }


    }
}

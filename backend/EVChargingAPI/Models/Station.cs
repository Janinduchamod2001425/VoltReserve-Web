/*
    Station model
    Description:
    - MongoDB document representing an EV charging station and its time-based schedules.
    Data notes:
    - Type: "AC" or "DC".
    - Latitude/Longitude are nullable and populated via geocoding.
    - AvailableSlots represents station capacity used for validation and schedule limits.
    - Schedule.Id is a GUID string for stable identification of schedule entries.
*/
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EVChargingAPI.Models
{
    public class Station
    {
       
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("name")]
        public string Name { get; set; } = string.Empty;

        [BsonElement("location")]
        public string Location { get; set; } = string.Empty;

        [BsonElement("type")]
        public string Type { get; set; } = "AC"; // "AC" or "DC"

        [BsonElement("availableSlots")]
        public int AvailableSlots { get; set; }

        [BsonElement("isActive")]
        public bool IsActive { get; set; } = true;

        [BsonElement("schedules")]
        public List<Schedule> Schedules { get; set; } = new();

        //for geo location
        [BsonElement("latitude")]
        public double? Latitude { get; set; }
        [BsonElement("longitude")]
        public double? Longitude { get; set; }
    }

    public class Schedule
    {
        public string Id { get; set; } = Guid.NewGuid().ToString(); // shedule id
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public int SlotsAvailable { get; set; }
    }
}
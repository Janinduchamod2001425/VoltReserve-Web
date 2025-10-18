using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EVChargingAPI.Models
{
    public class Vehicle
    {
        [BsonElement("make")]
        public string Make { get; set; } = string.Empty;

        [BsonElement("model")]
        public string Model { get; set; } = string.Empty;

        [BsonElement("batteryCapacityKWh")]
        public double BatteryCapacityKWh { get; set; }
    }
}

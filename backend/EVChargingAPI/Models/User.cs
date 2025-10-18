using System.Text.Json.Serialization;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EVChargingAPI.Models
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum UserRole { Backoffice, StationOperator }

    public class User
    {
        [BsonId, BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("email")]
        public string Email { get; set; } = string.Empty;

        [BsonElement("passwordHash")]
        public string PasswordHash { get; set; } = string.Empty;

        [BsonElement("role")]
        [BsonRepresentation(BsonType.String)]                 // store enum as STRING in Mongo
        [JsonConverter(typeof(JsonStringEnumConverter))]      // show enum as STRING in JSON
        public UserRole Role { get; set; } = UserRole.StationOperator;

        [BsonElement("isActive")]
        public bool IsActive { get; set; } = true;
    }
}

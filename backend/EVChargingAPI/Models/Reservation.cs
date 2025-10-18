using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EVChargingAPI.Models
{
    public enum ReservationStatus { Pending, Approved, Cancelled, Completed }

    public class Reservation
    {
        [BsonId, BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("nic")]
        public string Nic { get; set; } = string.Empty; // owner NIC

        [BsonElement("userId")]
        public string UserId { get; set; } = string.Empty; // owner Id

        [BsonElement("stationId")]
        public string StationId { get; set; } = string.Empty;

        [BsonElement("stationName")]
        public string StationName { get; set; } = string.Empty;

        [BsonElement("type")]
        public string Type { get; set; } = string.Empty;

        [BsonElement("status")]
        [BsonRepresentation(BsonType.String)]
        public ReservationStatus Status { get; set; } = ReservationStatus.Pending;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; }

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; }

        [BsonElement("reservationDate")]
        public DateTime ReservationDate { get; set; }

        [BsonElement("startTime")]
        public TimeSpan StartTime { get; set; }

        [BsonElement("endTime")]
        public TimeSpan EndTime { get; set; }

        [BsonElement("selectedSlot")]
        public int SelectedSlot { get; set; }
    }
}

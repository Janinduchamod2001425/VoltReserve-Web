namespace EVChargingAPI.Models
{
   
    public class OwnerStationSummary
    {
        public string? Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public int AvailableSlots { get; set; }
    }
}

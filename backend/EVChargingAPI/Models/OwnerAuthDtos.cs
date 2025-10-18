namespace EVChargingAPI.Models
{
    public class RegisterOwnerRequest
    {
        public string Nic { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        // Optional vehicle details; if provided, will be stored with owner
        public VehicleDto? Vehicle { get; set; }
    }

    public class OwnerLoginRequest
    {
        // Allow either Email or NIC in this field
        public string Identifier { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class VehicleDto
    {
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public double BatteryCapacityKWh { get; set; }
    }

    // DTO for owner profile updates (all fields optional)
    public class UpdateOwnerRequest
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Phone { get; set; }
        public VehicleDto? Vehicle { get; set; }
    }
}

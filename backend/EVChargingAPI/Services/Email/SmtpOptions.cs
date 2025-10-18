/*
 * File: SmtpOptions.cs
 * Description: Configuration options for SMTP transport.
 * Author: Kavinda S.G.D
 * Last Modified: 2025-10-10
 * Notes: Bind from configuration (e.g., appsettings.json).
 */




namespace EVChargingAPI.Services.Email
{
    /// <summary>SMTP configuration options.</summary>
    public class SmtpOptions
    {
        // Step 1: Define option properties used by EmailSender
        public string Host { get; set; } = "";
        public int Port { get; set; } = 587;
        public bool UseStartTls { get; set; } = true;
        public string User { get; set; } = "";
        public string Pass { get; set; } = "";
        public string FromName { get; set; } = "VoltReserve";
        public string FromEmail { get; set; } = "noreply@voltreserve.local";
    }
}

/*
 * File: BookingApprovedEmail.cs
 * Description: HTML email template for approved bookings. Returns subject, HTML and QR attachment.
 * Author: Kavinda S.G.D
 * Last Modified: 2025-10-10
 * Notes: Formats DateTime and TimeSpan safely for email.
 */



using EVChargingAPI.Models;
using System.Globalization;

namespace EVChargingAPI.Services.Email.Templates
{
    public static class BookingApprovedEmail
    {
        public static (string Subject, string Html, byte[] QrPng, string QrName) Build(Reservation r, byte[] qrPng)
        {
            // Step 1: Prepare subject, safe date/time strings, then compose HTML
            var subject = $"Your EV Charging Booking is Approved - {r.StationName}";
            var whenLocal = r.ReservationDate.ToLocalTime();
            var whenStr = whenLocal.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture);

            //  Handle TimeSpan-based StartTime and EndTime (from Mongo)
            string startStr = "";
            string endStr = "";

            try
            {
                
                startStr = r.StartTime.ToString(@"hh\:mm");
            }
            catch
            {
                startStr = r.StartTime.ToString();
            }

            try
            {
                endStr = r.EndTime.ToString(@"hh\:mm");
            }
            catch
            {
                endStr = r.EndTime.ToString();
            }

            var html = $@"
                <div style='font-family:Arial,Helvetica,sans-serif'>
                  <h2>Booking Approved ✅</h2>
                  <p>Dear customer, your charging reservation has been approved.</p>
                  <ul>
                    <li><b>Station:</b> {r.StationName}</li>
                    <li><b>Type:</b> {r.Type}</li>
                    <li><b>Slot:</b> #{r.SelectedSlot}</li>
                    <li><b>Date/Time:</b> {whenStr}</li>
                    <li><b>Window:</b> {startStr} – {endStr}</li>
                    <li><b>Status:</b> {r.Status}</li>
                  </ul>
                  <p>Please present the attached QR code at the station for verification.</p>
                  <p>Thank you,<br/>VoltReserve</p>
                </div>";

            return (subject, html, qrPng, "booking-qr.png");
        }
    }
}

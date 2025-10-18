/*
 * File: BookingCancelledEmail.cs
 * Description: HTML email template for cancelled bookings.
 * Author: Kavinda S.G.D
 * Last Modified: 2025-10-10
 * Notes: Formats TimeSpan using invariant HH:mm.
 */




using EVChargingAPI.Models;
using System.Globalization;

namespace EVChargingAPI.Services.Email.Templates
{
    public static class BookingCancelledEmail
    {
        //Formats a TimeSpan to HH:mm invariantly
        private static string HHMM(TimeSpan t) =>
            t.ToString(@"hh\:mm", CultureInfo.InvariantCulture); 

        //Builds the email for a cancelled booking
        public static (string Subject, string Html) Build(Reservation r)
        {
             // Step 1: Render key details safely; return subject + html
            var subject  = $"❌ Your EV Charging Booking was Cancelled — {r.StationName}";
            var whenLocal = r.ReservationDate.ToLocalTime();
            var whenStr   = whenLocal.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture);

            //  robust formatting for TimeSpan
            var startStr = HHMM(r.StartTime);
            var endStr   = HHMM(r.EndTime);

            var html = $@"
                <div style='font-family:Arial,Helvetica,sans-serif'>
                  <h2>Booking Cancelled ❌</h2>
                  <p>Dear user, your reservation has been cancelled.</p>
                  <ul>
                    <li><b>Station:</b> {r.StationName}</li>
                    <li><b>Type:</b> {r.Type}</li>
                    <li><b>Slot:</b> #{r.SelectedSlot}</li>
                    <li><b>Date/Time:</b> {whenStr}</li>
                    <li><b>Window:</b> {startStr} – {endStr}</li>
                    <li><b>Status:</b> {r.Status}</li>
                  </ul>
                  <p>If this was unintentional, please make a new booking.</p>
                  <p>Thank you,<br/>VoltReserve</p>
                </div>";

            return (subject, html);
        }
    }
}

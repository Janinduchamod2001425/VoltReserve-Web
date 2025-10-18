/*
 * File: BookingController.cs
 * Description: HTTP endpoints for creating, updating, approving and cancelling reservations.
 * Author: Kavinda S.G.D
 * Last Modified: 2025-10-10
 * Notes: Restricted by BackofficeOnly policy. Sends approval/cancellation emails and embeds QR.
 */




using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EVChargingAPI.Services;
using EVChargingAPI.Models;
using EVChargingAPI.Services.Email;
using EVChargingAPI.Services.Qr;
using EVChargingAPI.Services.Email.Templates;

namespace EVChargingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    
    public class BookingController : ControllerBase
    {
        private readonly BookingService _bookingService;
        private readonly IEmailSender _email;
        private readonly IQrGenerator _qr;

        public BookingController(BookingService bookingService, IEmailSender email, IQrGenerator qr)
        {
             // Step 1: Store injected services
            _bookingService = bookingService;
            _email = email;
            _qr = qr;
        }

        //  Create booking
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Reservation reservation, CancellationToken ct)
        {
             // Step 1: Delegate to service and return result
            var result = await _bookingService.CreateBookingAsync(reservation, ct);
            if (!result.Success) return BadRequest(result.Message);
            return Ok(result.Data);
        }

        //  Update booking
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] Reservation updated, CancellationToken ct)
        {
            var result = await _bookingService.UpdateBookingAsync(id, updated, ct);
            if (!result.Success) return BadRequest(result.Message);
            return Ok(result.Data);
        }

        
        //  Cancel booking

[HttpDelete("{id}")]
public async Task<IActionResult> Cancel(string id, CancellationToken ct)
{
    var existing = await _bookingService.GetByIdAsync(id, ct);
    if (existing == null)
        return NotFound(new { message = $"Booking with id {id} not found" });

    var result = await _bookingService.CancelBookingAsync(id, ct);
    if (!result.Success) return BadRequest(result.Message);

    var r = result.Data!;
    var to = r.Nic?.Trim();
    if (!string.IsNullOrWhiteSpace(to))
    {
        try
        {
            // Use the cancellation email template
            var (subject, html) = BookingCancelledEmail.Build(r);
            await _email.SendAsync(to, subject, html, null, null, ct);
            Console.WriteLine($"[Email] Sent cancellation email to {to}");
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[Email] Cancel email failed for booking {r.Id}: {ex}");
        }
    }

    return Ok(result.Data);
}



        //  Get all bookings
        [HttpGet]
        public async Task<IActionResult> GetAll(CancellationToken ct)
        {
            var all = await _bookingService.GetAllAsync(ct);
            return Ok(all);
        }

        //  Get booking by NIC
        [HttpGet("by-nic/{nic}")]
        public async Task<IActionResult> GetByNic(string nic, CancellationToken ct)
        {
            var bookings = await _bookingService.GetByNicAsync(nic, ct);
            if (bookings == null || bookings.Count == 0)
                return NotFound(new { message = $"No bookings found for NIC {nic}" });
            return Ok(bookings);
        }

        //  Get booking by ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id, CancellationToken ct)
        {
            var booking = await _bookingService.GetByIdAsync(id, ct);
            if (booking == null) return NotFound(new { message = $"Booking with id {id} not found" });
            return Ok(booking);
        }

       // PATCH /api/Booking/{id}/approve
        [HttpPatch("{id}/approve")]
        public async Task<IActionResult> Approve(string id, CancellationToken ct)
        {
            var result = await _bookingService.ApproveBookingAsync(id, ct);
            if (!result.Success) return BadRequest(result.Message);

            var r = result.Data!;
            // nic holds the user email in  DB
            var to = r.Nic?.Trim();
            if (!string.IsNullOrWhiteSpace(to))
            {
                // Build a minimal payload to encode in QR
                var qrPayload = new
                {
                    id = r.Id,
                    nic = r.Nic,
                    stationId = r.StationId,
                    station = r.StationName,
                    slot = r.SelectedSlot,
                    date = r.ReservationDate, // UTC
                    start = r.StartTime.ToString(@"hh\:mm"),
                    end = r.EndTime.ToString(@"hh\:mm"),
                    status = r.Status.ToString()
                };

                try
                {
                    var png = _qr.GeneratePng(qrPayload, 10);
                    var (subject, html, qrPng, qrName) = BookingApprovedEmail.Build(r, png);
                    await _email.SendAsync(to, subject, html, qrPng, qrName, ct);
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine($"Email send failed for booking {r.Id}: {ex}");
                }
            }

            return Ok(r);
        }
    }
}

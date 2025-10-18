using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using EVChargingAPI.Models;
using EVChargingAPI.Services;
using EVChargingAPI.Security;

namespace EVChargingAPI.Controllers
{
    [ApiController]
    [Route("api/owners/reservations")]
    [Authorize(Roles = "Owner")]
    public class ReservationsController : ControllerBase
    {
        private readonly ReservationService _reservations;
        private readonly ICurrentUser _current;

        public ReservationsController(ReservationService reservations, ICurrentUser current)
        {
            _reservations = reservations;
            _current = current;
        }

        public class CreateReservationRequest
        {
            public string StationId { get; set; } = string.Empty;
            public string StationName { get; set; } = string.Empty;
            public string Type { get; set; } = string.Empty;
            public DateTime ReservationDate { get; set; }
            public TimeSpan StartTime { get; set; }
            public TimeSpan EndTime { get; set; }

        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateReservationRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.StationId) || string.IsNullOrWhiteSpace(req.StationName) || string.IsNullOrWhiteSpace(req.Type))
                return BadRequest("Missing station or location information");
            if (req.StartTime >= req.EndTime)
                return BadRequest("Invalid time range");

            var userId = _current.UserId;
            var nic = _current.Email; // current user Email holds owner email; we need NIC — but token sets sub as user id and email claim contains owner email

            var reservation = new Reservation
            {
                UserId = userId ?? string.Empty,
                Nic = nic ?? string.Empty,
                StationId = req.StationId,
                StationName = req.StationName,
                Type = req.Type,
                ReservationDate = req.ReservationDate,
                StartTime = req.StartTime,
                EndTime = req.EndTime,
                SelectedSlot = 1

            };

            var created = await _reservations.CreateAsync(reservation);
            return Ok(created);
        }

        [HttpGet]
        public async Task<IActionResult> List()
        {
            var userId = _current.UserId;
            if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();
            var list = await _reservations.ListByUserAsync(userId);
            return Ok(list);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(string id)
        {
            var res = await _reservations.GetByIdAsync(id);
            if (res is null) return NotFound();
            if (res.UserId != _current.UserId) return Forbid();
            return Ok(res);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, CreateReservationRequest req)
        {
            var res = await _reservations.GetByIdAsync(id);
            if (res is null) return NotFound();
            if (res.UserId != _current.UserId) return Forbid();
            if (req.StartTime >= req.EndTime)
                return BadRequest("Invalid time range");

            var updated = await _reservations.UpdateAsync(id, r =>
            {
                r.ReservationDate = req.ReservationDate;
                r.StartTime = req.StartTime;
                r.EndTime = req.EndTime;
                r.Type = req.Type;
                r.SelectedSlot = 1;
            });

            return Ok(updated);
        }

        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> Cancel(string id)
        {
            var res = await _reservations.GetByIdAsync(id);
            if (res is null) return NotFound();
            if (res.UserId != _current.UserId) return Forbid();

            await _reservations.CancelAsync(id);
            return Ok(new { success = true });
        }

        [HttpGet("stats")]
        public async Task<IActionResult> Stats()
        {
            var userId = _current.UserId;
            if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();
            var (pending, approved) = await _reservations.CountByStatusForUserAsync(userId);
            return Ok(new { pending, approved });
        }
    }
}

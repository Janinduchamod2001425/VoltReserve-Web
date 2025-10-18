// Controllers/StaffMeController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EVChargingAPI.Services;
using EVChargingAPI.Security;

namespace EVChargingAPI.Controllers
{
    [ApiController]
    [Route("api/staff/me")]
    [Authorize(Roles = "Backoffice,StationOperator")]
    public class StaffMeController : ControllerBase
    {
        private readonly UserService _users;
        private readonly ICurrentUser _current;

        public StaffMeController(UserService users, ICurrentUser current)
        {
            _users = users;
            _current = current;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var id = _current.UserId;
            if (string.IsNullOrWhiteSpace(id)) return Unauthorized();

            var user = await _users.GetByIdAsync(id);
            if (user is null) return NotFound();

            // Staff model only stores Email/Role/IsActive
            return Ok(new { user.Email, Role = user.Role.ToString(), user.IsActive });
        }

        public class StaffChangePasswordRequest
        {
            public string CurrentPassword { get; set; } = string.Empty;
            public string NewPassword { get; set; } = string.Empty;
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword(StaffChangePasswordRequest req)
        {
            var id = _current.UserId;
            if (string.IsNullOrWhiteSpace(id)) return Unauthorized();
            if (string.IsNullOrWhiteSpace(req.CurrentPassword) || string.IsNullOrWhiteSpace(req.NewPassword))
                return BadRequest("Missing passwords");

            try
            {
                await _users.ChangePasswordAsync(id, req.CurrentPassword, req.NewPassword);
                return Ok(new { success = true });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}

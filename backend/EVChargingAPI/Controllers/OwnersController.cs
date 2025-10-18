using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using EVChargingAPI.Models;
using EVChargingAPI.Services;
using EVChargingAPI.Security;

namespace EVChargingAPI.Controllers
{
    [ApiController]
    [Route("api/owners/me")]
    [Authorize(Roles = "Owner")]
    public class OwnersController : ControllerBase
    {
        private readonly OwnerService _owners;
        private readonly ICurrentUser _current;

        public OwnersController(OwnerService owners, ICurrentUser current)
        {
            _owners = owners;
            _current = current;
        }

        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            var id = _current.UserId;
            if (string.IsNullOrWhiteSpace(id)) return Unauthorized();

            var owner = await _owners.GetByIdAsync(id);
            if (owner is null) return NotFound();

            return Ok(new { owner.Id, owner.Nic, owner.Email, owner.FirstName, owner.LastName, owner.Phone, owner.IsActive, Vehicle = owner.Vehicle });
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProfile(UpdateOwnerRequest req)
        {
            var id = _current.UserId;
            if (string.IsNullOrWhiteSpace(id)) return Unauthorized();

            try
            {
                var updated = await _owners.UpdateAsync(id, req);
                return Ok(new { updated.Id, updated.Nic, updated.Email, updated.FirstName, updated.LastName, updated.Phone, updated.IsActive, Vehicle = updated.Vehicle });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
        }

        public class ChangePasswordRequest
        {
            public string CurrentPassword { get; set; } = string.Empty;
            public string NewPassword { get; set; } = string.Empty;
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword(ChangePasswordRequest req)
        {
            var id = _current.UserId;
            if (string.IsNullOrWhiteSpace(id)) return Unauthorized();
            if (string.IsNullOrWhiteSpace(req.CurrentPassword) || string.IsNullOrWhiteSpace(req.NewPassword))
                return BadRequest("Missing passwords");

            try
            {
                await _owners.ChangePasswordAsync(id, req.CurrentPassword, req.NewPassword);
                return Ok(new { success = true });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("deactivate")]
        public async Task<IActionResult> Deactivate()
        {
            var id = _current.UserId;
            if (string.IsNullOrWhiteSpace(id)) return Unauthorized();

            await _owners.DeactivateAsync(id);
            return Ok(new { success = true });
        }
    }
}

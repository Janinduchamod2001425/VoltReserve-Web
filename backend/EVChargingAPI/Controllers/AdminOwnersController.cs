using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EVChargingAPI.Models;
using EVChargingAPI.Services;

namespace EVChargingAPI.Controllers
{
    [ApiController]
    [Route("api/admin/owners")]
    [Authorize(Policy = "BackofficeOnly")]
    public class AdminOwnersController : ControllerBase
    {
        private readonly OwnerService _owners;

        public AdminOwnersController(OwnerService owners) => _owners = owners;

        // ✅ Get all owners
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var owners = await _owners.GetAllAsync();
            return Ok(owners.Select(o => new
            {
                o.Nic,
                o.FirstName,
                o.LastName,
                o.Email,
                o.Phone,
                o.IsActive,
                Vehicle = o.Vehicle is null ? null : new { o.Vehicle.Make, o.Vehicle.Model, o.Vehicle.BatteryCapacityKWh }
            }));
        }

        // Create owner (Backoffice initiated)
        [HttpPost]
        public async Task<IActionResult> Create(RegisterOwnerRequest req)
        {
            var created = await _owners.RegisterAsync(req);
            return Ok(new { created.Nic, created.Email, created.FirstName, created.LastName, created.Phone, created.IsActive, created.Vehicle });
        }

        // Get owner by NIC
        [HttpGet("{nic}")]
        public async Task<IActionResult> Get(string nic)
        {
            var o = await _owners.GetByNicAsync(nic);
            return o is null ? NotFound() : Ok(o);
        }

        // Update owner by NIC
        [HttpPut("{nic}")]
        public async Task<IActionResult> Update(string nic, UpdateOwnerRequest req)
        {
            var owner = await _owners.GetByNicAsync(nic);
            if (owner is null) return NotFound();
            var updated = await _owners.UpdateAsync(owner.Id!, req);
            return Ok(updated);
        }

        // Delete owner by NIC
        [HttpDelete("{nic}")]
        public async Task<IActionResult> Delete(string nic)
        {
            var owner = await _owners.GetByNicAsync(nic);
            if (owner is null) return NotFound();
            await _owners.DeleteByNicAsync(nic);
            return NoContent();
        }

        // Activate/Deactivate by NIC
        [HttpPost("{nic}/activate")]
        public async Task<IActionResult> Activate(string nic)
        {
            await _owners.SetActiveByNicAsync(nic, true);
            return Ok(new { success = true });
        }

        [HttpPost("{nic}/deactivate")]
        public async Task<IActionResult> Deactivate(string nic)
        {
            await _owners.SetActiveByNicAsync(nic, false);
            return Ok(new { success = true });
        }
    }
}

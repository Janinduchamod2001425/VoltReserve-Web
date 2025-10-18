using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using EVChargingAPI.Models;
using EVChargingAPI.Services;

namespace EVChargingAPI.Controllers
{
    [ApiController]
    [Route("api/owners/auth")]
    public class OwnersAuthController : ControllerBase
    {
        private readonly OwnerService _owners;
        private readonly JwtService _jwt;

        public OwnersAuthController(OwnerService owners, JwtService jwt)
        {
            _owners = owners;
            _jwt = jwt;
        }

        // Public registration for EV Owners
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register(RegisterOwnerRequest req)
        {
            // Basic validation
            if (string.IsNullOrWhiteSpace(req.Nic) || string.IsNullOrWhiteSpace(req.Email)
                || string.IsNullOrWhiteSpace(req.Phone) || string.IsNullOrWhiteSpace(req.Password))
                return BadRequest("Missing required fields");

            // If vehicle provided, validate its fields
            if (req.Vehicle is not null)
            {
                if (string.IsNullOrWhiteSpace(req.Vehicle.Make) || string.IsNullOrWhiteSpace(req.Vehicle.Model)
                    || req.Vehicle.BatteryCapacityKWh <= 0)
                    return BadRequest("Incomplete or invalid vehicle details");
            }

            try
            {
                var created = await _owners.RegisterAsync(req);
                // do not return password hash
                return Ok(new
                {
                    created.Id,
                    created.Nic,
                    created.Email,
                    created.FirstName,
                    created.LastName,
                    created.Phone,
                    created.IsActive,
                    Vehicle = created.Vehicle is null ? null : new { created.Vehicle.Make, created.Vehicle.Model, created.Vehicle.BatteryCapacityKWh }
                });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(OwnerLoginRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Identifier) || string.IsNullOrWhiteSpace(req.Password))
                return BadRequest("Missing identifier or password");

            // Try by email first, then nic
            Owner? owner = await _owners.GetByEmailAsync(req.Identifier);
            if (owner is null) owner = await _owners.GetByNicAsync(req.Identifier);

            if (owner is null || !owner.IsActive || !_owners.VerifyPassword(owner, req.Password))
                return Unauthorized("Invalid credentials or inactive owner");

            var token = _jwt.GenerateToken(owner);
            return Ok(token);
        }

      [HttpGet("test")]
[AllowAnonymous]
public IActionResult Test()
{
    return Ok("Connection successful!");
}
    }
}
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EVChargingAPI.Models;
using EVChargingAPI.Services;

namespace EVChargingAPI.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly UserService _users;
        private readonly JwtService _jwt;

        public AuthController(UserService users, JwtService jwt)
        {
            _users = users;
            _jwt = jwt;
        }

        // Backoffice creates web users (Backoffice or StationOperator)
        [HttpPost("register")]
        [Authorize(Policy = "BackofficeOnly")]
        public async Task<IActionResult> Register(RegisterUserRequest req)
        {
            var created = await _users.CreateAsync(req.Email, req.Password, req.Role);
            return Ok(new { created.Id, created.Email, Role = created.Role.ToString() });
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(LoginRequest req)
        {
            var user = await _users.GetByEmailAsync(req.Email);
            if (user is null || !user.IsActive || !_users.VerifyPassword(user, req.Password))
                return Unauthorized("Invalid credentials or inactive user");

            var token = _jwt.GenerateToken(user);
            return Ok(token);
        }

        [HttpGet("me")]
        [Authorize] // any authenticated user
        public IActionResult Me()
        {
            var email = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Email
                                  || c.Type.Contains("email"))?.Value;
            var role = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
            return Ok(new { email, role });
        }
    }
}

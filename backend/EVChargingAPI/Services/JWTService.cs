using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EVChargingAPI.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace EVChargingAPI.Services
{
    public class JwtService
    {
        private readonly IConfiguration _cfg;
        public JwtService(IConfiguration cfg) => _cfg = cfg;

        public AuthResponse GenerateToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_cfg["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var expires = DateTime.UtcNow.AddMinutes(double.Parse(_cfg["Jwt:ExpiryMinutes"]!));
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
            };

            var token = new JwtSecurityToken(
                issuer: _cfg["Jwt:Issuer"],
                audience: _cfg["Jwt:Audience"],
                claims: claims,
                expires: expires,
                signingCredentials: creds);

            return new AuthResponse
            {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                Email = user.Email,
                Role = user.Role.ToString(),
                ExpiresAtUtc = expires
            };
        }

        // Generate token for Owner entity
        public AuthResponse GenerateToken(Models.Owner owner)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_cfg["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var expires = DateTime.UtcNow.AddMinutes(double.Parse(_cfg["Jwt:ExpiryMinutes"]!));
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, owner.Id ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Email, owner.Email),
                new Claim(ClaimTypes.Role, "Owner"),
            };

            var token = new JwtSecurityToken(
                issuer: _cfg["Jwt:Issuer"],
                audience: _cfg["Jwt:Audience"],
                claims: claims,
                expires: expires,
                signingCredentials: creds);

            return new AuthResponse
            {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                Email = owner.Email,
                Role = "Owner",
                ExpiresAtUtc = expires
            };
        }
    }
}
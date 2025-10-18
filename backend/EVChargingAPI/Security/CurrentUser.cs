using System.Security.Claims;

namespace EVChargingAPI.Security
{
    public interface ICurrentUser
    {
        string? Email { get; }
        string? Role { get; }
        string? UserId { get; }
        bool IsBackoffice { get; }
        bool IsOperator { get; }
    }

    public class CurrentUser : ICurrentUser
    {
        public CurrentUser(IHttpContextAccessor accessor)
        {
            var user = accessor.HttpContext?.User;

            Email = user?.FindFirst(ClaimTypes.Email)?.Value
                 ?? user?.FindFirst("email")?.Value;

            Role  = user?.FindFirst(ClaimTypes.Role)?.Value;

            UserId = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? user?.FindFirst("sub")?.Value;
        }

        public string? Email { get; }
        public string? Role  { get; }
        public string? UserId { get; }
        public bool IsBackoffice => string.Equals(Role, nameof(EVChargingAPI.Models.UserRole.Backoffice), StringComparison.OrdinalIgnoreCase);
        public bool IsOperator   => string.Equals(Role, nameof(EVChargingAPI.Models.UserRole.StationOperator), StringComparison.OrdinalIgnoreCase);
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace EVChargingAPI.Security
{
    // Shortcut so devs don’t repeat the scheme & remember policy names
    public sealed class AuthorizeBackofficeAttribute : AuthorizeAttribute
    {
        public AuthorizeBackofficeAttribute()
        {
            AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme;
            Policy = RolePolicies.BackofficeOnly;
        }
    }

    public sealed class AuthorizeOperatorOrBackofficeAttribute : AuthorizeAttribute
    {
        public AuthorizeOperatorOrBackofficeAttribute()
        {
            AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme;
            Policy = RolePolicies.OperatorOrBackoffice;
        }
    }
}

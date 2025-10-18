using System.Text;
using System.Security.Claims;                 // <-- add this
using System.IdentityModel.Tokens.Jwt;        // optional but nice when you clear claim maps
using EVChargingAPI.Data;
using EVChargingAPI.Models;
using EVChargingAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MongoDB.Driver;
using EVChargingAPI.Security;
using EVChargingAPI.Services.Email;
using EVChargingAPI.Services.Qr;

var builder = WebApplication.CreateBuilder(args);

// Mongo
builder.Services.Configure<MongoDbSettings>(builder.Configuration.GetSection("MongoDbSettings"));
var mongoSettings = builder.Configuration.GetSection("MongoDbSettings").Get<MongoDbSettings>();
builder.Services.AddSingleton(new MongoDbContext(mongoSettings!));

builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection("Smtp"));

// DI
builder.Services.AddSingleton<StationService>();
builder.Services.AddSingleton<UserService>();
builder.Services.AddSingleton<JwtService>();
builder.Services.AddSingleton<OwnerService>();
builder.Services.AddSingleton<BookingService>();
builder.Services.AddSingleton<ReservationService>();
builder.Services.AddSingleton<OwnerStationService>();
// IHttpContextAccessor is required to read HttpContext in CurrentUser
builder.Services.AddHttpContextAccessor();
// Register your custom CurrentUser accessor
builder.Services.AddScoped<ICurrentUser, CurrentUser>();

builder.Services.AddSingleton<IEmailSender, EmailSender>();
builder.Services.AddSingleton<IQrGenerator, QrGenerator>();

builder.Services.AddControllers()
    .AddJsonOptions(opt =>
    {
        opt.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });


// JWT
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

var jwtKey = builder.Configuration["Jwt:Key"]!;
var jwtIssuer = builder.Configuration["Jwt:Issuer"]!;
var jwtAudience = builder.Configuration["Jwt:Audience"]!;
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme   = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(2),

            // ensure we read the same claim types we wrote in the token
            NameClaimType = JwtRegisteredClaimNames.Email,
            RoleClaimType = ClaimTypes.Role
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var h = ctx.Request.Headers.Authorization.ToString();
                Console.WriteLine(string.IsNullOrWhiteSpace(h)
                    ? "[Auth] No Authorization header."
                    : "[Auth] Authorization header present: " + h[..Math.Min(h.Length, 32)] + "...");
                return Task.CompletedTask;
            },
            OnAuthenticationFailed = ctx =>
            {
                Console.WriteLine("[Auth] JWT validation failed: " + ctx.Exception.Message);
                return Task.CompletedTask;
            }
        };
    });

// AuthZ
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("BackofficeOnly",
        p => p.RequireRole(nameof(UserRole.Backoffice)));
    options.AddPolicy("OperatorOrBackoffice",
        p => p.RequireRole(nameof(UserRole.Backoffice), nameof(UserRole.StationOperator)));
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "EV Charging API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your JWT token}"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { new OpenApiSecurityScheme
            { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
          Array.Empty<string>() }
    });
});

// CORS: allow React dev server
const string DevCors = "DevCors";
builder.Services.AddCors(opts =>
{
    opts.AddPolicy(DevCors, p =>
        p.WithOrigins("http://localhost:5173")   // Vite default
         .AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials()); // if you ever use cookies
});


var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "EV Charging API v1");
        c.RoutePrefix = string.Empty;
    });
}

app.UseCors(DevCors);
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Seed admin
using (var scope = app.Services.CreateScope())
{
    var users = scope.ServiceProvider.GetRequiredService<UserService>();
    var db = scope.ServiceProvider.GetRequiredService<MongoDbContext>();
    try
    {
        var any = await db.Users.EstimatedDocumentCountAsync() > 0;
        if (!any)
            await users.CreateAsync("admin@voltreserve.local", "Admin@123", UserRole.Backoffice);
    }
    catch (MongoWriteException mwx) when (mwx.WriteError?.Code == 11000) { }
}

app.Run();

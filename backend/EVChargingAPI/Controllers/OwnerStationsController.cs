using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using EVChargingAPI.Models;
using EVChargingAPI.Services;

namespace EVChargingAPI.Controllers
{
    [ApiController]
    [Route("api/owners/stations")]
    [Authorize(Roles = "Owner")]
    public class OwnerStationsController : ControllerBase
    {
        private readonly OwnerStationService _service;

        public OwnerStationsController(OwnerStationService service)
        {
            _service = service;
        }

        [HttpGet("active")]
        public ActionResult<List<OwnerStationSummary>> GetActive()
        {
            var list = _service.GetActiveStations();
            return Ok(list);
        }
    }
}

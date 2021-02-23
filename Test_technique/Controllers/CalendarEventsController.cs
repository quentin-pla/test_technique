using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;

namespace Test_technique.Controllers
{
    [ApiController]
    [Route("api/calendar/events")]
    public class CalendarEventsController : ControllerBase
    {
        private IMongoCollection<CalendarEvent> _events;
        public CalendarEventsController(IMongoClient client)
        {
            var database = client.GetDatabase("calendar");
            _events = database.GetCollection<CalendarEvent>("events");
        }

        [HttpGet("")]
        public IEnumerable<CalendarEvent> GetEvents()
        {
            return _events.Find(new BsonDocument()).ToList();
        }

        [HttpGet("{id}")]
        public CalendarEvent GetCalendarEvent(string id)
        {
            return _events.Find(e => e.Id.Equals(ObjectId.Parse(id))).First();
        }
    }
}
using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Serializers;
using MongoDB.Driver;
using Test_technique.Models;

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
            BsonSerializer.RegisterSerializer(typeof(DateTime), DateTimeSerializer.LocalInstance);
        }

        [HttpGet("")]
        public IEnumerable<CalendarEvent> Get()
        {
            return _events.Find(e => true).ToList();
        }

        [HttpGet("{id}")]
        public CalendarEvent Get(string id)
        {
            return _events.Find(e => e.Id.Equals(ObjectId.Parse(id))).First();
        }

        [HttpPost]
        public IActionResult Create([FromBody] CalendarEvent e)
        {
            try
            {
                _events.InsertOne(e);
            }
            catch (MongoWriteException exception)
            {
                return BadRequest(exception.Message);
            }
            return Ok();
        }
        
    }
}
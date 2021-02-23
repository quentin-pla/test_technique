using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Test_technique.Models
{
    [BsonIgnoreExtraElements]
    public class CalendarEvent
    {
        [BsonId]
        public ObjectId Id { get; set; }
        
        public string Title { get; set; }
        
        public DateTime Start { get; set; }
        
        public DateTime End { get; set; }
        
        public bool AllDay { get; set; }
    }
}
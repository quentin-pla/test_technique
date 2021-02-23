using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Test_technique
{
    public class CalendarEvent
    {
        [BsonId]
        public BsonObjectId Id { get; }
        
        public BsonString Title { get; set; }
        
        public BsonDateTime StartDate { get; set; }
        
        public BsonDateTime EndDate { get; set; }
    }
}
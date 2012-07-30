var redis = require('redis')
  , mongoose = require('mongoose');

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

//Schemas
var Message = new Schema({
    channel: String,
    from: String,
    message: String,
    action: String,
    who: String,
    reason: String,
    oldnick: String,
    newnick: String,
  });

mongoose.model('message', Message);
var Message = mongoose.model('message');

exports.log = function(messageObject, callback){
  mongoose.connect('mongodb://localhost/botmessages');
  var redisClient = redis.createClient();
  redisClient.on("error", function (err) {
    console.log("Redis connection error to " + redisClient.host + ":" + redisClient.port + " - " + err);
  });
  var now = Date.now()
  messageObject["timestamp"] = now;
  messageObject.created_at = now;
  redisClient.rpush('automation', JSON.stringify(messageObject));
  var msg = new Message({
    channel: messageObject.channel,
    from: messageObject.from,
    message:messageObject.message,
    action: messageObject.action,
    who: messageObject.who,
    reason: messageObject.reason,
    oldnick: messageObject.oldnick,
    newnick: messageObject.newnick,
    created_at: messageObject.created_at,
  });
  msg.save(function(err){
    if (err) {
      console.error(err);
      throw err;
    }
  });
  if (messageObject.channel === '#automation'){
    redisClient.publish("automation", JSON.stringify(messageObject));
  }
  redisClient.quit();
  mongoose.disconnect();
  if (callback){
    callback();
  }
}

exports.Message = Message;

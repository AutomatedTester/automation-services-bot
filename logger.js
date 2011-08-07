redis = require('redis');

exports.log = function(messageObject){
        redisClient = redis.createClient();
        redisClient.on("error", function (err) {
            console.log("Redis connection error to " + redisClient.host + ":" + redisClient.port + " - " + err);
        });
        now = Date.now()
        messageObject["timestamp"] = now;
        redisClient.rpush('automation', JSON.stringify(messageObject));
        redisClient.publish("automation", JSON.stringify(messageObject));
        redisClient.quit();
}

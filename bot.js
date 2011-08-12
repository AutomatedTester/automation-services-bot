// Requires
var irc = require('irc'),
    http = require('https'),
    logger = require('./logger');

var ircServer = 'irc.mozilla.org',
    nick = 'AutomationBot',
    options = {channels: ['#automation'],},
    client = new irc.Client(ircServer, nick, options),
    help = { ":help" : "This is Help! :)",
             ":gist" : "Gives you a link to Pastebin",
             ":yt" : "Pass in your search and I will give you a youtube link"
            };

client.addListener('message', function (from, to, message) {
    console.log(from + ' => ' + to + ': ' + message);
    logger.log({channel:to, from:from, message:message});
    if (message.search(nick) >= 0){
        if (message.search(" hi[ $]?") >= 1){
           client.say(to, "Hi hi " + from);
       }
       if (message.search("damn you") >= 0) {
            client.say(to, "I am so sorry " + from + ", can we hug?");
       }
    }

    if (message.search(":gist") === 0){
        client.say(to, "Please paste >3 lines of text to http://pastebin.mozilla.org");
    }

    if (message.search(":help") === 0){
        for (var item in help){
            client.say(to, item + " : " + help[item]);
        }
    }

    if (message.search(":yt") === 0){
        var options = {
            host: 'gdata.youtube.com',
            port: 443,
            path: "/feeds/api/videos?q=" + message.substring(4).replace(/ /g, '+') + "&alt=json",
            method: 'GET'
        };
        var req = http.request(options, function(res) {
            var apiResult = '';
            
            res.on('data', function(d) {
                apiResult += d;
            });
            res.on('end', function(){
                try{
                    data = JSON.parse(apiResult);
                    title = data["feed"]["entry"][0]["title"]["$t"]
                    link = data["feed"]["entry"][0]["link"][0]["href"];
                    client.say(to, title + " -- " + link);
                } catch(e) {
                    console.error(e.message);
                }
            });
        });
        req.end();
    }

    if (message.search(/bug \d{6}/) >= 0){
        var bugID = "";
        bugID = /bug (\d{6})/.exec(message)[1];
        var options = {
            host: 'api-dev.bugzilla.mozilla.org',
            port: 443,
            path: "/0.9/bug?id=" + bugID,
            method: 'GET'
        };
        var apiResult = ''
        var req = http.request(options, function(res) {
            res.on('data', function(d) {
                apiResult += d; 
            });
            
            res.on('end', function(){
                try{
                    data = JSON.parse(apiResult);
                    url = "https://bugzilla.mozilla.org/show_bug.cgi?id=" + bugID;
                    summary = data["bugs"]["0"]["summary"];
                    severity = data["bugs"]["0"]["severity"];
                    status = data["bugs"]["0"]["status"];
                    resolution = data["bugs"]["0"]["resolution"];

                    client.say(to, "Bug " + url + " " + severity + ", " + status + " " + resolution + ", " + summary); 
                }catch(e){
                    console.error(e);            
                }
            });
        });
        req.end();
    }
});

client.addListener('join', function(channel, who){
    logger.log({channel:channel, action: "join", who: who});
});

client.addListener('part', function(channel, who, reason){
    logger.log({channel:channel, action: "part", who: who, reason:reason})
});

client.addListener('kick', function(channel, who, by, reason) {
    logger.log({who:who, channel:channel, by:by, reason:reason, action:'kick'});
});

client.addListener('invite', function(channel, from){
    logger.log({channel:channel, action:"invite", from:from});
});

client.addListener('nick', function(oldnick, newnick, channel){
    logger.log({channel:channel, action:"nick", oldnick:oldnick, newnick:newnick});
});

client.addListener('error', function(message){
    console.error("message");
});

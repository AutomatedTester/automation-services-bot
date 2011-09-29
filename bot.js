// Requires
var irc = require('irc'),
    http = require('https'),
    logger = require('./logger');

var ircServer = 'irc.mozilla.org',
    nick = '_AutomationBot',
    options = {channels: ['#automation'],},
    client = new irc.Client(ircServer, nick, options),
    help = { ":help" : "This is Help! :)",
             ":gist" : "Gives you a link to Pastebin",
             ":yt" : "Pass in your search and I will give you a youtube link",
             "Bugzilla" : "Just add bug xxxxxx to a conversation and it will show a summary of the bug",
             ":source" : "Returns the GitHub URL for me",
             ":pivotal" : "Type in the name project to get it's link or leave blank to get an entire list",
             ":list" : "Either returns the URL to the Google Group or a link with your search topic",
             ":standup" : "Shows the details for the standup the team has twice a week",
             ":meeting" : "Shows details and a link to the meetings page",
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
    client.say(to, "Please send me a message (eg /msg _AutomationBot help) with the text help to get a list of commands I support");
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

  if (message.search(/bug \d+/i) >= 0){
    var bugID = "";
    bugID = /bug (\d+)/i.exec(message)[1];
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
        var returnMessage = '';
        try{
          data = JSON.parse(apiResult);
          url = "https://bugzilla.mozilla.org/show_bug.cgi?id=" + bugID;
          if (data["bugs"].length === 0){
            returnMessage = "Sorry " + from + " that bug doesn't exist! I suggest you get raising more bugs until it does!";
            logger.log({channel:to, from:nick, message:returnMessage}); 
            client.say(to, returnMessage);
            return;
          }
          summary = data["bugs"]["0"]["summary"];
          severity = data["bugs"]["0"]["severity"];
          status = data["bugs"]["0"]["status"];
          resolution = data["bugs"]["0"]["resolution"];
          returnMessage = "Bug " + url + " " + severity + ", " + status + " " + resolution + ", " + summary;
          logger.log({channel:to, from:nick, message:returnMessage});
          client.say(to, returnMessage); 
        }catch(e){
          console.error(e);            
        }
      });
    });
    req.end();
  }

  if (message.search(":source") === 0){
    client.say(to, "My code lives at https://github.com/AutomatedTester/automation-services-bot/. Go have a look!");
  }

  if (message.search(":pivotal") === 0){
    var projects = {
        "team" : "https://www.pivotaltracker.com/projects/323503",
        "shared modules" : "https://www.pivotaltracker.com/projects/344657",
        "web apps" : "https://www.pivotaltracker.com/projects/350145",
        "mozmill automation" : "https://www.pivotaltracker.com/projects/298905",
        "api refactor" : "https://www.pivotaltracker.com/projects/311747",
        "dashboard" : "https://www.pivotaltracker.com/projects/294869",
    }

    var project = /^:pivotal ((\w+)?(\s\w+)?)/.exec(message)
    if (project === null){
      for (var item in projects){
        client.say(to, item + ' - ' + projects[item]);
      }
    } else {
      try {
        console.log(project);
        client.say(to, project[1] + ' - ' + projects[project[1]]);
      } catch (e) {
        client.say(to, "Unfortunately that project doesn't appear to exist"); 
      }
    }
  }

  if (message.search(":list") === 0){
    var search = /:list (.+)/.exec(message);
    if (search === null){
      client.say(to, "http://groups.google.com/group/mozilla.dev.automation");
    } else {
      client.say(to, "http://groups.google.com/group/mozilla.dev.automation/search?group=mozilla.dev.automation&q=" + search[1].replace(/ /g, '+') + "&qt_g=Search+this+group");
    }
  }

  if (message.search(":standup") === 0){
    client.say(to, "Come join us at 2:30 PDT/PST on Monday in PB&J and Wednesday in Warp Core. If you are remote you can join with video and audio on Vidyo https://v.mozilla.com/");
  }

  if (message.search(":meeting") === 0){
    client.say(to, "Our Meeting is held every two weeks on a Wednesday at 13:30 PDT/PST. Find more details at https://wiki.mozilla.org/QA/Automation_Services/Meetings");
  }
});

client.addListener('pm', function(nick, message){
  if (message.search('help') === 0){
    for (var item in help){
      client.say(nick, item + " : " + help[item]);
    }
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

client.addListener('quit', function(who, reason, channel){
  logger.log({channel:channel, action: "quit", who: who, reason:reason})
});

client.addListener('error', function(message){
  console.error("message");
});

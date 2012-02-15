var logger = require('../logger')
  , Message = require('../logger').Message
  , assert = require('assert')
  , mongoose = require('mongoose');

describe('Logger details',function(){
  describe('posting to datastore', function(){
    beforeEach(function(done){
      mongoose.connect('mongodb://localhost/botmessages');
      done();
    });

    it('should save details to mongodb when log is called', function(done){
      logger.log({channel:"#automation", from:"me", message:"i like cheese"},
        function(){
          console.log('have logged, in callback');
          Message.where("channel", "#automation").run(function(err, docs){
            assert.ok(docs.length > 0);
            done();
          });
        });
    });
  });
});

"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const chai = require('chai');
const assert = chai.assert;

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    index: { unique: true }
  },
});

userSchema.plugin(require('../index'), {
  saltWorkFactor: 5,
  maxAuthAttempts: 5,
  accountLockTime: 3600
});

//Create a new collection called 'Name'
const User = mongoose.model('user', userSchema);

describe('Database Tests', function() {
  //Before starting the test, create a sandboxed database connection
  //Once a connection is established invoke done()
  before(function (done) {
    mongoose.Promise = Promise;
    mongoose.connect('mongodb://localhost:27017/testDatabase', { useMongoClient: true }).then(() => {
      console.log('We are connected to test database!');
      return User.collection.insert([
        { username: 'user1', password: 'lol' },
        { username: 'user2', password: 'lol' },
        { username: 'user3', password: 'password' },
        { username: 'user4', password: 'test' }
      ]);
    }).then(() => {
      console.log('Added test data.');
      done(); 
    }).catch((e) => {
      console.error.bind(console, 'connection error: ' + e)
    });
  });

  describe('Test Database', function() {
    it('Add duplicate user to db', function(done) {
      User.create({
        username: 'user1',
        password: 'lol24'
      }).then((u) => {
        done('error should be generated and no user');
      }, (e) => { done(); });
    });


  /*  it('Dont save incorrect format to database', function(done) {
      //Attempt to save with wrong info. An error should trigger
      var wrongSave = Name({
        notName: 'Not Mike'
      });
      wrongSave.save(err => {
        if(err) { return done(); }
        throw new Error('Should generate error!');
      });
    });

    it('Should retrieve data from test database', function(done) {
      //Look up the 'Mike' object previously saved.
      Name.find({name: 'Mike'}, (err, name) => {
        if(err) {throw err;}
        if(name.length === 0) {throw new Error('No data!');}
        done();
      });
    });*/
  });

  //After all tests are finished drop database and close connection
  after(function(done){
    mongoose.connection.db.dropDatabase(function(){
      mongoose.connection.close(done);
    });
  });
});
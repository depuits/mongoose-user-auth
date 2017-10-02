"use strict";

const Promise = require('bluebird');
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

const options = {
  saltWorkFactor: 5,
  maxAuthAttempts: 3,
  accountLockTime: 2 // lock the account for 2 seconds for testing
};

userSchema.plugin(require('../index'), options);

//Create a new collection called 'Name'
const User = mongoose.model('user', userSchema);

describe('Database Tests', function() {
  //Before starting the test, create a sandboxed database connection
  //Once a connection is established invoke done()
  before(function (done) {
    mongoose.Promise = Promise;
    mongoose.connect('mongodb://localhost:27017/testDatabase', { useMongoClient: true }).then(() => {
      console.log('We are connected to test database!');
      return Promise.all([ 
        User.create({ username: 'user1', password: 'lol' }),
        User.create({ username: 'user2', password: 'lol' }),
        User.create({ username: 'user3', password: 'password' }),
        User.create({ username: 'user4', password: 'test' })
      ]);
    }).then(() => {
      console.log('Added test data.');
      done(); 
    }).catch((e) => {
      console.error.bind(console, 'connection error: ' + e)
    });
  });

  describe('Database', function() {
    it('check duplicate passwords', function(done) {
      Promise.join(User.findOne({ username: 'user1' }), User.findOne({ username: 'user2' }), function(u1, u2) {
        assert.exists(u1);
        assert.exists(u2);
        assert.notEqual(u1.password, u2.password, 'same passwords should not be encrypted the same');
        done();
      }).catch((e) => {
        done(e);
      });
    });

    it('Add user', function(done) {
      User.create({
        username: 'user5',
        password: 'lol0124'
      }).then((u) => {
        assert.notEqual(u.password, 'lol0124', 'The password in the database should not be the plaintext');
        done();
      }).catch((e) => {
        done(e);
      });
    });

    it('Add duplicate user', function(done) {
      User.create({
        username: 'user1',
        password: 'lol24'
      }).then((u) => {
        done('error should be generated and no user');
      }).catch((e) => { 
        done(); 
      });
    });

    it('Add user without password', function(done) {
      User.create({
        username: 'user1'
      }).then((u) => {
        done('error should be generated and no user');
      }).catch((e) => { 
        done(); 
      });
    });

    it('Find user', function(done) {
      User.findOne({ username: 'user5' }).then((user) => {
        assert.exists(user);
        done();
      }).catch((e) => {
        done(e);
      });
    });

    it('Find invalid user', function(done) {
      User.findOne({ username: 'imaginary' }).then((user) => {
        assert.notExists(user);
        done();
      }).catch((e) => {
        done(e);
      });
    });
  });

  describe('User auth', function() {
    function testValid(username, password, done) {
      User.auth({ username: username }, password, function (err, user) {
        if (err) {
          return done(err);
        }

        assert.exists(user);
        assert.isNotOk(user.isLocked);
        assert.isTrue(user.passwordCorrect);
        done();
      });
    }
    function testInvalidUserName(username, password, done) {
      User.auth({ username: username }, password, function (err, user) {
        if (err) {
          return done(err);
        }
        assert.notExists(user);
        done();
      });      
    }
    function testInvalidPassword(username, password, done) {
      User.auth({ username: username }, password, function (err, user) {
        if (err) {
          return done(err);
        }
        assert.exists(user);
        assert.isNotOk(user.passwordCorrect);
        done();
      });
    }
    function testNotLocked(username, password, done) {
      User.auth({ username: username }, password, function (err, user) {
        if (err) {
          return done(err);
        }
        assert.exists(user);
        assert.isNotOk(user.isLocked);
        done();
      });
    }
    function testLocked(username, password, done) {
      User.auth({ username: username }, password, function (err, user) {
        if (err) {
          return done(err);
        }
        assert.exists(user);
        assert.isTrue(user.isLocked);
        done();
      });
    }

    it('valid', function(done) {
      testValid('user1', 'lol', done);
    });
    it('invalid user name', function(done) {
      testInvalidUserName('lol35', 'password', done);
    });
    it('invalid password user1', function(done) {
      testInvalidPassword('user1', 'password', done);
    });

    it('valid user1', function(done) {
      testValid('user1', 'lol', done);
    });

    // 3 invalid logins should result in a lock
    describe('locked', function() {
      // repeat an invalid login for max times
      for(let i = 0; i < options.maxAuthAttempts; ++i) {
        it('not locked', function(done) {
          testNotLocked('user1', 'password', done);
        });
      }

      it('locked invalid password', function(done) {
        testLocked('user1', 'password', done);
      });
      it('locked valid password', function(done) {
        testLocked('user1', 'lol', done);
      });

      it('after lock', function(done) {
        // increase the test timeout value to the needed + 2
        this.timeout((options.accountLockTime + 2) * 1000);
        // await the lock time
        setTimeout(function() {
          testValid('user1', 'lol', done);
        }, options.accountLockTime * 1000);
      });      
    });
  });

  //After all tests are finished drop database and close connection
  after(function(done){
    mongoose.connection.db.dropDatabase(function(){
      mongoose.connection.close(done);
    });
  });
});
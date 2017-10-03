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

describe('Database Tests', () => {
  //Before starting the test, create a sandboxed database connection
  //Once a connection is established invoke done()
  before((done) => {
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

  describe('Database', () => {
    it('check duplicate passwords', () => {
      return Promise.join(User.findOne({ username: 'user1' }), User.findOne({ username: 'user2' }), (u1, u2) => {
        assert.exists(u1);
        assert.exists(u2);
        assert.notEqual(u1.password, u2.password, 'same passwords should not be encrypted the same');
      });
    });

    it('Add user', () => {
      return User.create({
        username: 'user5',
        password: 'lol0124'
      }).then((u) => {
        assert.notEqual(u.password, 'lol0124', 'The password in the database should not be the plaintext');
      });
    });

    it('Add duplicate user', () => {
      return User.create({
        username: 'user1',
        password: 'lol24'
      }).then((u) => {
        throw new Error('error should be generated and no user');
      }, (e) => { 
        assert.exists(e);
      });
    });

    it('Add user without password', () => {
      return User.create({
        username: 'user17'
      }).then((u) => {
        throw new Error('error should be generated and no user');
      }, (e) => { 
        assert.exists(e);
      });
    });

    it('Find user', () => {
      return User.findOne({ username: 'user5' }).then((user) => {
        assert.exists(user);
      });
    });

    it('Find invalid user', () => {
      return User.findOne({ username: 'imaginary' }).then((user) => {
        assert.notExists(user);
      });
    });
  });

  describe('User auth', () => {
    function testValid(username, password) {
      return User.auth({ username: username }, password).then((user) => {
        assert.exists(user);
        assert.isNotOk(user.isLocked);
        assert.isTrue(user.passwordCorrect);
      });
    }
    function testInvalidUserName(username, password) {
      return User.auth({ username: username }, password).then((user) => {
        assert.notExists(user);
      });
    }
    function testInvalidPassword(username, password) {
      return User.auth({ username: username }, password).then((user) => {
        assert.exists(user);
        assert.isNotOk(user.passwordCorrect);
      });
    }
    function testNotLocked(username, password) {
      return User.auth({ username: username }, password).then((user) => {
        assert.exists(user);
        assert.isNotOk(user.isLocked);
      });
    }
    function testLocked(username, password) {
      return User.auth({ username: username }, password).then((user) => {
        assert.exists(user);
        assert.isTrue(user.isLocked);
      });
    }

    it('valid', () => {
      return testValid('user1', 'lol');
    });
    it('invalid user name', () => {
      return testInvalidUserName('lol35', 'password');
    });
    it('invalid password user1', () => {
      return testInvalidPassword('user1', 'password');
    });

    it('valid user1', () => {
      return testValid('user1', 'lol');
    });

    // 3 invalid logins should result in a lock
    describe('locked', () => {
      // repeat an invalid login for max times
      for(let i = 0; i < options.maxAuthAttempts; ++i) {
        it('not locked', () => {
          return testNotLocked('user1', 'password');
        });
      }

      it('locked invalid password', () => {
        return testLocked('user1', 'password');
      });
      it('locked valid password', () => {
        return testLocked('user1', 'lol');
      });

      it('after lock', () => {
        // await the lock time
        return Promise.delay(options.accountLockTime * 1000).then(() => testValid('user1', 'lol'));
      }).timeout((options.accountLockTime + 2) * 1000);
    });
  });

  //After all tests are finished drop database and close connection
  after((done) => {
    mongoose.connection.db.dropDatabase(() => {
      mongoose.connection.close(done);
    });
  });
});
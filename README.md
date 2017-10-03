# Mongoose User Auth

Hash passwords and lock accounts in Mongoose.

Credit goes to [devsmash.com](http://devsmash.com/blog/password-authentication-with-mongoose-and-bcrypt).

## Installation

```bash
npm install mongoose-user-auth
```

## Usage

Add the plugin to a Mongoose schema.

```js
userSchema.plugin(require('mongoose-user-auth'), {
  saltWorkFactor: 10, // optional
  maxAuthAttempts: 15, // optional
  accountLockTime: 3600 // optional
});
```

Authenticate users with the `auth` method.

```js
// Using a callback
User.auth({ username: username }, password, function (err, user) {
  if (err) {
    // There has been an error
    return;
  }

  if (!user) {
    // User was not found
    return;
  }

  if (user.isLocked) {
    // Account is locked
    var lockedUntil = user.lockUntil; // ms
    return;
  }

  if (!user.passwordCorrect) {
    // User password was incorrect
    return;
  }

  // User is authenticated
});

// Or by using promises
User.auth({ username: username }, password).then((user) => {
  if (!user) {
    // User was not found
    return;
  }

  if (user.isLocked) {
    // Account is locked
    var lockedUntil = user.lockUntil; // ms
    return;
  }

  if (!user.passwordCorrect) {
    // User password was incorrect
    return;
  }

  // User is authenticated
}).catch((err) => {
  // There has been an error
  return;
});
```

When using promises, the promise library used is the same as the one specified in mongoose with `require('mongoose').Promise = myPromiseLibrary;`

## Testing

To run the tests make sure that mongo db is running and accesable on `mongodb://localhost:27017`. The test will create and destroy a test database named `testDatabase`.

```bash
npm test
```

## License

Mongoose User Auth is released under the MIT license.

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

  // User is authenticated
});
```

## License

Mongoose User Auth is released under the MIT license.

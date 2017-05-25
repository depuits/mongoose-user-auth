# Mongoose User Auth
Mongoose plugin which hashes passwords and locks accounts with too many failed authentications.

Credit goes to: http://devsmash.com/blog/password-authentication-with-mongoose-and-bcrypt

## Installation
```
npm install mongoose-user-auth
```

## Usage

1. Bind to a schema. The fields `password`, `authAttempts`, and `lockUntil` will be added to the schema.
```
var userSchema = new Schema({
	// ...
}, {
	// These are optional. The values below are the defaults
	saltWorkFactor: 10,
	maxAuthAttempts: 15,
	accountLockTime: 60 * 60 // seconds
});

userSchema.plugin(require('mongoose-user-auth'));
```

2. Use the `auth` method for user authentications.
```
User.auth({ username: username }, password, function (err, user) {
	if (err) {
		// There has been an error
		return;
	}

	if (user.isLocked) {
		// This account is locked
		var lockedUntil = user.lockUntil; // ms
		return;
	}

	// User is authenticated
});

```
# Mongoose User Auth
Mongoose plugin to hash passwords and lock accounts after too many failed authentications.

Credit goes to: http://devsmash.com/blog/password-authentication-with-mongoose-and-bcrypt

## Installation
```bash
npm install mongoose-user-auth
```

## Usage

1. Plug in to a schema. The fields `password`, `authAttempts`, and `lockUntil` will be added to the schema.
```js
userSchema.plugin(require('mongoose-user-auth'), {
	// These are optional. The values below are the defaults
	saltWorkFactor: 10,
	maxAuthAttempts: 15,
	accountLockTime: 3600 // 1 hour
});
```

2. Use the `auth` method to authenticate users
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

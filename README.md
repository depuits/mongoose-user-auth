# Mongoose User Auth
Mongoose plugin to hash passwords and lock accounts after too many failed authentications.

Credit goes to: http://devsmash.com/blog/password-authentication-with-mongoose-and-bcrypt

## Installation
```bash
npm install mongoose-user-auth
```

## Usage

1. Add to a schema
```js
userSchema.plugin(require('mongoose-user-auth'), {
	saltWorkFactor: 10, // optional
	maxAuthAttempts: 15, // optional
	accountLockTime: 3600 // optional
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

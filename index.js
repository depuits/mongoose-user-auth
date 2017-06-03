var bcrypt = require('bcrypt');

module.exports = exports = function (schema, options) {
	options = options || {};
	options.saltWorkFactor = options.saltWorkFactor || 10;
	options.maxAuthAttempts = options.maxAuthAttempts || 15;
	options.accountLockTime = options.accountLockTime || (60 * 60);
	options.accountLockTime *= 1000;

	schema.add({
		password: { type: String, required: true, maxLength: 255 },
		authAttempts: { type: Number, required: true, default: 0 },
		lockUntil: { type: Number }
	});

	schema.virtual('isLocked').get(function () {
		return this.lockUntil && this.lockUntil > Date.now();
	});

	schema.pre('save', function (next) {
		if (!this.isModified('password')) {
			next();
			return;
		}

		// Generate salt
		bcrypt.genSalt(options.saltWorkFactor, function (err, salt) {
			if (err) {
				next(err);
				return;
			}

			// Hash password
			bcrypt.hash(this.password, salt, function (err, hashedPassword) {
				if (err) {
					next(err);
					return;
				}

				this.password = hashedPassword;
				next();
			});
		});
	});

	schema.method('comparePassword', function (candidatePassword, cb) {
		bcrypt.compare(candidatePassword, this.password, cb);
	});

	schema.method('incAuthAttempts', function (cb) {
		// Check if previous lock has expired
		if (this.lockUntil && this.lockUntil < Date.now()) {
			this.update({
				$set: { authAttempts: 1 },
				$unset: { lockUntil: 1 }
			}, cb);
			return;
		}

		// Increment attempts
		var updates = { $inc: { authAttempts: 1 } };

		// Lock account if reached max attempts
		if (this.authAttempts + 1 >= options.maxAuthAttempts && !this.isLocked) {
			updates.$set = { lockUntil: Date.now() + options.accountLockTime };
		}
		
		this.update(updates, cb);
	});

	schema.static('auth', function (conditions, password, cb) {
		this.findOne(conditions, function (err, user) {
			if (err || !user) {
				cb(err);
				return;
			}

			// Check if account is currently locked
			if (user.isLocked) {
				user.incAuthAttempts(function (err) {
					if (err) {
						cb(err);
						return;
					}
					cb(null, user);
				});
				return;
			}

			// Check password
			user.comparePassword(password, function (err, isMatch) {
				if (err) {
					cb(err);
					return;
				}

				// Was the password a match?
				if (!isMatch) {
					user.incAuthAttempts(function (err) {
						if (err) {
							cb(err);
						} else {
							cb(null, user);
						}
					});
					return;
				}
				
				// Return if the user has no failed attempts and is not locked
				if (!user.authAttempts && !user.lockUntil) {
					cb(null, user);
					return;
				}

				// Reset attempts
				user.update({
					$set: { authAttempts: 0 },
					$unset: { lockUntil: 1 }
				}, function (err) {
					if (err) {
						cb(err);
						return;
					}
					cb(null, user);
				});
			});
		});
	});
};

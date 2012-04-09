/*     session
 *     Exposes functions for maintaining active sessions
 *     Requires the following configuration variables:
 *     this.config.id_length=<number>  # Number of digits in the session ID
 *     this.config.timeout_hours=<number>  # How long the session is good for without renewal
 */

// The main session data object
var session = {
	config:{
		disable_get:false,
		disable_set:false,
		renew_on_set:false,
		renew_on_get:false,
		snapshot_file:"./session.sav",
		snapshot_on_exit:true,
		disable_snapshot_api:true
	},
	
	session:{},

	/* GLOBAL FUNCTIONS */
	
	init:function(){},
	
	receiveRequest:function(r, u, q){return true;},
	
	shutdown:function(){},
	 
	// Initializes a new session
	start:function(id) {
		if (id == null || id == 0)  // Nothing specified?  Make an ID up at random.
			while (typeof this.session[id] !== "undefined" || id == 0)
				id = this.generateSessionId();	// Keep generating new IDs until we find one that isn't in use

		this.session[id] = {};
		this.session[id].expires = new Date();
		sys.logger.stdout("Session ID: " + id);
		if (this.renew(id).success != false)
			return {"sid":id,"expires":this.session[id].expires.toUTCString()};
		sys.logger.stderr("[ERR] pam_session : Failed to create a session.  Could not set the expiration date.");
		this.stop(id);
		return {"success":false};
	},

	// Stops an existing session and destroys the session's data
	stop:function(id) {
		if (typeof this.session[id] !== "undefined") {
			if (this.session[id].timer !== "undefined") {
				clearTimeout(this.session[id].timer)
				sys.logger.stdout("Session " + id + " went inactive and was closed.");
			}
			delete this.session[id];
			return {"success":true};
		} else {
			sys.logger.stderr("[ERR] pam_session : Could not stop session " + id +" because it does not exist.");
			return {"success":false};
		}
	},

	// Retrieves all of a session's data
	getSession:function(id) {
		if (typeof this.session[id] !== "undefined") {
			return this.session[id];
		} else {
			sys.logger.stderr("[ERR] pam_session : Attempt to retrieve a session was rejected. The session ID was invalid.");
			return false;
		}
	},

	get:function(id, key) {
		if (typeof this.session[id] !== "undefined") {
			return {"value":this.session[id][key]};
		} else {
			sys.logger.stderr("[ERR] session : Attempt to retrieve a session was rejected. The session ID was invalid.");
			return {"success":false};
		}
	},

	set:function(id, key, value) {
		if (typeof this.session[id] !== "undefined") {
			this.session[id][key] = value;
			return {"success":true};
		} else {
			sys.logger.stderr("[ERR] session : Attempt to retrieve a session was rejected. The session ID was invalid.");
			return {"success":false};
		}
	},

	// Renews a session's expiration date
	renew:function(id) {
		if (typeof this.session[id] !== "undefined") {
			var d = new Date();
			console.log(d.toUTCString());
			this.session[id].expires.setTime(
				d.getTime() + parseFloat(this.config.timeout_seconds) * 1000
			);
			sys.logger.stdout(parseFloat(this.config.timeout_seconds) * 1000);
			this.session[id].timer = setTimeout(function() {
				this.stop(id);
			}, parseFloat(this.config.timeout_seconds) * 1000);
			return {"sid":id,"expires":this.session[id].expires.toUTCString()};
		} else {
			sys.logger.stderr("[ERR] session : Failed to renew session `" + id  + "`. Starting new session.");
			return this.start(0);
		}
	},
	
	// Generates a single valid character
	generateSessionIdChar:function() {
		var alphabet = [
			'a', 'b', 'c', 'd', 'e', 'f', '0', '1',
			'2', '3', '4', '5', '6', '7', '8', '9'
		];

		return alphabet[Math.floor(Math.random() * alphabet.length)];
	},

	// Generates a full session ID
	generateSessionId:function() {
		var id = "";
		for (var i = 1; i < parseInt(this.config.id_length); ++i)	
			id += this.generateSessionIdChar();
		return id;
	},
	
	load:function() {
		return this;
	}
};

mods.session = session;

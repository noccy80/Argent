/*     session
 *     Exposes functions for maintaining active sessions
 *     Requires the following configuration variables:
 *     this.config.id_length=<number>  # Number of digits in the session ID
 *     this.config.timeout_hours=<number>  # How long the session is good for without renewal
 */

// The main session data object
plugins.session = {
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
	
	init:function(){return 0;},
	
	receiveRequest:function(r, u, q, res){return true;},
	
	shutdown:function(){},
	 
	// Initializes a new session
	start:function(id) {
		sys.logger.log("session.start(" + id + ")", "debug");
		if (id == null || id == 0)  // Nothing specified?  Make an ID up at random.
			while (typeof this.session[id] !== "undefined" || id == 0)
				id = this.generateSessionId();	// Keep generating new IDs until we find one that isn't in use

		this.session[id] = {};
		this.session[id].expires = new Date();
		sys.logger.log("session: Created session ID: " + id, "debug");
		if (this.renew(id).success != false)
			return {"sid":id,"expires":this.session[id].expires.toUTCString()};
		sys.logger.log("session : Failed to create a session.  Could not set the expiration date.", "error");
		this.stop(id);
		return {"success":false};
	},

	// Stops an existing session and destroys the session's data
	stop:function(id) {
		sys.logger.log("session.stop(" + id + ")", "debug");
		if (typeof this.session[id] !== "undefined") {
			if (this.session[id].timer !== "undefined") {
				clearTimeout(this.session[id].timer)
				sys.logger.log("Session " + id + " went inactive and was closed.", "debug");
			}
			delete this.session[id];
			return {"success":true};
		} else {
			sys.logger.log("session : Could not stop session " + id +" because it does not exist.", "error");
			return {"success":false};
		}
	},

	// Retrieves all of a session's data
	getSession:function(id) {
		sys.logger.log("session.getSession(" + id + ")", "debug");
		if (typeof this.session[id] !== "undefined") {
			return this.session[id];
		} else {
			sys.logger.log("session : Attempt to retrieve a session was rejected. The session ID was invalid.", "error");
			return false;
		}
	},

	get:function(id, key) {
		sys.logger.log("session.get(" + id + ", " + key + ")", "debug");
		if (typeof this.session[id] !== "undefined") {
			return {"value":this.session[id][key]};
		} else {
			sys.logger.log("session : Attempt to retrieve a session was rejected. The session ID was invalid.", "error");
			return {"success":false};
		}
	},

	set:function(id, key, value) {
		sys.logger.log("session.set(" + id + ", " + key + ", " + value + ")", "debug");
		if (typeof this.session[id] !== "undefined") {
			this.session[id][key] = value;
			return {"success":true};
		} else {
			sys.logger.log("session : Attempt to retrieve a session was rejected. The session ID was invalid.", "error");
			return {"success":false};
		}
	},

	// Renews a session's expiration date
	renew:function(id) {
		sys.logger.log("session.renew(" + id + ")", "debug");
		if (typeof this.session[id] !== "undefined") {
			var d = new Date();
			this.session[id].expires.setTime(
				d.getTime() + parseFloat(this.config.timeout_seconds) * 1000
			);
			this.session[id].timer = setTimeout(function() {
				this.stop(id);
			}, parseFloat(this.config.timeout_seconds) * 1000);
			return {"sid":id,"expires":this.session[id].expires.toUTCString()};
		} else {
			sys.logger.log("session : Failed to renew session `" + id  + "`. Starting new session.", "info");
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
		sys.logger.log("session.generateSessionId()", "debug");
		var id = "";
		for (var i = 1; i < parseInt(this.config.id_length); ++i)	
			id += this.generateSessionIdChar();
		return id;
	}
};

/* blacklist
 * This module intercepts all incoming requests and refuses connections
 * from IP addresses listed in the configured blacklist. Alternately, it
 * can refuse connections from anyone not listed in a whitelist.
 */

plugins.blacklist = {
	config:{
		whitelist_behavior:false,
		list_file:"./conf/blacklist.list",
		list:{}
	},

	init:function(){
		sys.logger.log("blacklist.init()", "debug");
		this.reload();
		sys.fs.watchFile(this.config.list_file, function(){plugins.blacklist.reload();});
		sys.logger.log("Blacklist module initialized", "debug");
		return 0;
	},

	receiveRequest:function(r, u, q, res){
		var inList = false;
		if (r.connecton.remoteAddress in sys.toObject(this.config.list))
			inList = true;

		if (inList) {
			if (this.config.whitelist_behavior)
				return true;
			sys.logger.log("blacklist - Blocked incoming request from blacklisted client: " + r.connection.remoteAddress, "info");
			return {"httpcode":403, "message":"IP address " + r.connection.remoteAddress + " is blacklisted."};
		} else {
			if (this.config.whitelist_behavior) {
				sys.logger.log("blacklist - Blocked incoming request from non-whitelisted client: " .connection.remoteAddress, "info");
				return {"http-code":403, "message":"IP address " + r.connection.remoteAddress + " is not whitelisted."};
			}
			return true;
		}
	},

	shutdown:function(){},

	reload:function() {
		this.config.list = sys.fs.readFileSync(this.config.list_file, "UTF-8").split('\n');
		sys.logger.log("blacklist - Loaded access list from " + this.config.list_file, "debug");
	}
};

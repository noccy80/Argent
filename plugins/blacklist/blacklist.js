/* blacklist
 * This module intercepts all incoming requests and refuses connections
 * from IP addresses listed in blacklist.conf
 */

plugins.blacklist = {
	config:{
		whitelist_behavior:false,
		list_file:"./conf/blacklist.list",
		list:{}
	},

	init:function(){
		this.reload();
		sys.fs.watchFile(this.config.list_file, function(){plugins.blacklist.reload();});
		sys.logger.stdout("Blacklist module initialized");
		return 0;
	},

	receiveRequest:function(r, u, q, res){
		var inList = false;
		for (var i in this.config.list)
			if (this.config.list[i] == r.connection.remoteAddress)
				inList = true;

		if (inList) {
			if (this.config.whitelist_behavior)
				return true;
			return {"httpcode":403, "message":"IP address " + r.connection.remoteAddress + " is blacklisted."};
		} else {
			if (this.config.whitelist_behavior)
				return {"http-code":403, "message":"IP address " + r.connection.remoteAddress + " is not whitelisted."};
			return true;
		}
	},

	shutdown:function(){},

	reload:function() {
		sys.logger.stdout("Blacklist :: Loading list...");
		this.config.list = sys.fs.readFileSync(this.config.list_file, "UTF-8").split('\n');
		sys.logger.stdout("Blacklist :: List loaded.");
	}
};

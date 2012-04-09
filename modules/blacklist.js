/* blacklist
 * This module intercepts all incoming requests and refuses connections
 * from IP addresses listed in blacklist.conf
 */

var blacklist = {
	config:{
		whitelist_behavior:false,
		list_file:"./conf/blacklist.conf",
		list:{}
	},

	init:function(){
		this.reload();
		sys.logger.stdout("Blacklist module initialized");
	},

	receiveRequest:function(r, u, q){
		var inList = false;
		for (var i in this.config.list)
			if (this.config.list[i] == r.connection.remoteAddress)
				inList = true;

		if (inList) {
			if (this.config.whitelist_behavior)
				return true;
			return "IP address " + r.connection.remoteAddress + " is blacklisted.";
		}
		return true;
	},

	shutdown:function(){},

	reload:function() {
		this.config.list = sys.fs.readFileSync(this.config.list_file, "UTF-8").split('\n');
	}
};

mods.blacklist = blacklist;

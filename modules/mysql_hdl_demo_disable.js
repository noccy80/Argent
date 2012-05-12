mods.mysql.handler = {
	
	resp:{
		headers:{"content-type":"application/json"},
		response:{}
	},
	
	handles:["query"],
	
	handlesAction:function(a) {
		for (x = 0; x < this.handles.length; ++x)
			if (a == this.handles[x]) return true;
		return false;
	},

	handle:function(a, r, q, res) {
		switch(a) {
			case "query":
				var host, port, user, password, database;
				if (q.query === "undefined") {
					sys.logger.stderr("[ERR] [mysql] No query provided.");
					return null;
				}
				
				// Localize query data
				host = q.host;
				port = q.port;
				user = q.user;
				password = q.password;
				database = q.database;
				
				if (host === "undefined" || host == "") host = mods.mysql.config.defaults.host;
				if (port === "undefined" || port == "") port = mods.mysql.config.defaults.port;
				if (user === "undefined" || user == "") user = mods.mysql.config.defaults.user;
				if (password === "undefined" || password == "") password = mods.mysql.config.defaults.password;
				if (database === "undefined" || database == "") database = mods.mysql.config.defaults.database;
				
				this.resp.response = mods.mysql.query(q.query, [], {
					"host":host, "port":port, "user":user, "password":password, "database":database
				}, res);
				
				return null;
			default:
				return null;
		}
		return this.resp;
	},
	
	queryCallback:function(resultset, response) {
		
	}
};

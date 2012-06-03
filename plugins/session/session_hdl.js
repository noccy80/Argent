plugins.session.handler = {
	
	resp:{
		headers:{"content-type":"application/json"},
		response:{}
	},
	
	handles:["stop", "renew"],
	
	handlesAction:function(a) {
		for (x = 0; x < this.handles.length; ++x)
			if (a == this.handles[x]) return true;
		return false;
	},

	handle:function(a, r, q, res) {
		sys.logger.log("session_hdl handling action: " + a, "debug");
		switch(a) {
			case "start":
				this.resp.response = plugins.session.start();
				this.resp.headers['set-cookie'] =
					"sid=" + this.resp.response.sid + ";expires=" + this.resp.response.expires;
				break;
			case "stop":
				var d = new Date();
				d.setTime(d.getTime() - 24 * 60 * 60 * 1000);	// To expire the cookie, make it old
				this.resp.response = plugins.session.stop(q.cookies.sid);
				this.resp.headers['set-cookie'] = "sid=0;expires=" + d.toUTCString();
				break;
			case "renew":
				this.resp.response = plugins.session.renew(q.cookies.sid);
				this.resp.headers['set-cookie'] =
					"sid=" + this.resp.response.sid + ";expires=" + this.resp.response.expires;
				break;
			case "set":
				this.resp.response = plugins.session.set(q.cookies.sid, q.key, q.value);
				if (plugins.session.config.renew_on_set) {
					var renewData = plugins.session.renew(q.cookies.sid);
					this.resp.headers['set-cookie'] =
						"sid=" + renewData.sid + ";expires=" + renewData.expires;
				}
				break;
			case "get":
				this.resp.response = plugins.session.get(q.cookies.sid, q.key);
				if (plugins.session.config.renew_on_get) {
					var renewData = plugins.session.renew(q.cookies.sid);
					this.resp.headers['set-cookie'] =
						"sid=" + renewData.sid + ";expires=" + renewData.expires;
				}
				break;
			default:
				return null;
		}
		return this.resp;
	}
};

// Init
if (!plugins.session.config.disable_get) {
	plugins.session.handler.handles.push("get");
	sys.logger.log("Session module: enabling get", "debug");
}
if (!plugins.session.config.disable_set) {
	plugins.session.handler.handles.push("set");
	sys.logger.log("Session module: enabling set", "debug");
}

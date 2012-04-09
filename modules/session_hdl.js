mods.session.handler = {
	
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

	handle:function(a, r, q) {
		switch(a) {
			case "start":
				sys.logger.stdout(JSON.stringify(this));
				this.resp.response = mods.session.start();
				this.resp.headers['set-cookie'] =
					"sid=" + this.resp.response.sid + ";expires=" + this.resp.response.expires;
				break;
			case "stop":
				var d = new Date();
				d.setTime(d.getTime() - 24 * 60 * 60 * 1000);	// To expire the cookie, make it old
				this.resp.response = mods.session.stop(q.cookies.sid);
				this.resp.headers['set-cookie'] = "sid=0;expires=" + d.toUTCString();
				break;
			case "renew":
				sys.logger.stdout(mods.session.config.disable_get);
				this.resp.response = mods.session.renew(q.cookies.sid);
				this.resp.headers['set-cookie'] =
					"sid=" + this.resp.response.sid + ";expires=" + this.resp.response.expires;
				break;
			case "set":
				this.resp.response = mods.session.set(q.cookies.sid, q.key, q.value);
				if (mods.session.config.renew_on_set) {
					var renewData = mods.session.renew(q.cookies.sid);
					this.resp.headers['set-cookie'] =
						"sid=" + renewData.sid + ";expires=" + renewData.expires;
				}
				break;
			case "get":
				this.resp.response = mods.session.get(q.cookies.sid, q.key);
				if (mods.session.config.renew_on_get) {
					var renewData = mods.session.renew(q.cookies.sid);
					this.resp.headers['set-cookie'] =
						"sid=" + renewData.sid + ";expires=" + renewData.expires;
				}
				break;
			case "savecache":
				this.resp.response = {"ack":true};
				mods.session.saveCache();
				break;
			case "savesnapshot":
				this.resp.response = {"ack":true};
				mods.session.saveSnapshot(q.label);
				break;
			case "clearcache":
				this.resp.response = {"ack":true};
				mods.session.clearCache();
				break;
			case "clearsnapshot":
				this.resp.response = {"ack":true};
				mods.session.clearSnapshot(q.label);
				break;
			case "restore":
				this.resp.response = {"ack":true};
				mods.session.restore();
				break;
			case "restoreFrom":
				this.resp.response = {"ack":true};
				mods.sessions.restoreFrom(q.label);
				break;
			default:
				return null;
		}
		return this.resp;
	}
};

// Init
if (!mods.session.config.disable_get) {
	mods.session.handler.handles.push("get");
	sys.logger.stdout("Session module: enabling get");
}
if (!mods.session.config.disable_set) {
	mods.session.handler.handles.push("set");
	sys.logger.stdout("Session module: enabling set");
}

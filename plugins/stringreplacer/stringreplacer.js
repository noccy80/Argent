plugins.stringreplacer = {
	
	config:{
		match_file:"./plugins/stringreplacer/stringreplacer.json",
		replacements:{},
		mimetypes:new Array()
	},
	
    init:function(){
		sys.logger.log("stringreplacer.init()", "debug");
		var config = JSON.parse(sys.fs.readFileSync(this.config.match_file, "UTF-8"));
		this.config.replacements = config.replacements;
		this.config.mimetypes = config.mimetypes;
		return 0;
	},
    
    receiveRequest:function(r, u, q, res){
		if (!q.action) {
			sys.logger.log("stringreplacer.receiveRequest(" + r + ", " + u + ", " + ", " + res + ")", "debug");
			var filename = sys.parseFilename(u.pathname);
			var mimetype = sys.getMimeType(filename);
			for (var m in this.config.mimetypes) {
				if (mimetype == this.config.mimetypes[m]) {
					var body = sys.fs.readFileSync(filename, "UTF-8");
					for (var rep in this.config.replacements) {
						sys.logger.log("stringreplacer matched '" + rep + "'", "debug");
						body = body.replace("%" + rep + "%", eval(this.config.replacements[rep]));
					}
					sys.respond(res, 200, mimetype, body, {});
					return null;
				}
			}
		}
		return true;
    },
    
    shutdown:function(){}
    
};

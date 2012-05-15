mods.stringreplacer = {
	
	config:{
		match_file:"./conf/stringreplacer.json",
		replacements:{},
		mimetypes:new Array()
	},
	
    init:function(){
		var config = JSON.parse(sys.fs.readFileSync(this.config.match_file, "UTF-8"));
		this.config.replacements = config.replacements;
		this.config.mimetypes = config.mimetypes;
		return 0;
	},
    
    receiveRequest:function(r, u, q, res){
		if (!q.action) {
			var filename = sys.parseFilename(u.pathname);
			var mimetype = sys.getMimeType(filename);
			for (var m in this.config.mimetypes) {
				if (mimetype == this.config.mimetypes[m]) {
					var body = sys.fs.readFileSync(filename, "UTF-8");
					for (var rep in this.config.replacements) {
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

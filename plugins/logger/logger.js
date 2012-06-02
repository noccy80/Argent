plugins.logger = {
    
    // Default file logging format looks like this:
    // 02Jun2012-16:12:46.015 | Message!
    config:{
		destinations:{
			access_log:{
				type:"file",
				path:"./log/access.log",
				timestamp_format:"dMY-H:i:s.u",
				separator:" | "
			},
			error_log:{
				type:"file",
				path:"./log/error.log",
				timestamp_format:"dMY-H:i:s.u",
				separator:" | "
			},
			console_stdout:{
				type:"console",
				path:"stdout"
				timestamp_format:"dMY-H:i:s.u",
				separator:" | "
			},
			console_stderr:{
				type:"console",
				path:"stderr"
				timestamp_format:"dMY-H:i:s.u",
				separator:" | "
			}
		},
		default_destination:"console_stdout"
	},
	
    init:function(){
		GLOBAL.logging = this;
		return 0;
	},
	
    receiveRequest:function(r, u, q, res){return true;},
    
    shutdown:function(){},
    
    log:function(message, type, destination) {
		
	}
	
};

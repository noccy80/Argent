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
				path:"stdout",
				timestamp_format:"dMY-H:i:s.u",
				separator:" | "
			},
			console_stderr:{
				type:"console",
				path:"stderr",
				timestamp_format:"dMY-H:i:s.u",
				separator:" | "
			}
		},
		default_destination:"console_stdout",
		default_timestamp_format:"dMY-h:m:s.u",
		default_separator:" | "
	},
	
    init:function(){
		sys.logger = this;
		return 0;
	},
	
    receiveRequest:function(r, u, q, res){return true;},
    
    shutdown:function(){},
    
    log:function(message, type, destination) {
		
	},
	
	now:function(destination) {
		if (destination == null) destination = this.config.default_destination;
		
		var d = new Date();
		// Split the format into a char array so we can replace things now and later join them
		// back together without having to worry about conflicts with string values
		// For example, an 'M' char might be replaced by "Jun", but the 'u' in that would
		// then mean "microsecond".
		var timestamp = this.config.default_timestamp_format.split('');
		if (destination in this.config.destinations)
			timestamp = this.config.destinations[destination].timestamp_format.split('');
		
		// Timestamps follow PHP format: http://php.net/manual/en/function.date.php
		for (var i in timestamp) {
			switch(i) {
				case 'd':
					timestamp[i] = (d.getDate().toString().length == 1 : "0" + d.getDate().toString() ? d.getDate().toString());
					break;
				case 'D':
					timestamp[i] = d.getDay();
					switch (timestamp[i]) {
						case 0: timestamp[i] = "Sun"; break;
						case 1: timestamp[i] = "Mon"; break;
						case 2: timestamp[i] = "Tue"; break;
						case 3: timestamp[i] = "Wed"; break;
						case 4: timestamp[i] = "Thu"; break;
						case 5: timestamp[i] = "Fri"; break;
						case 6: timestamp[i] = "Sat"; break;
						default: timestamp[i] = "ERR";
					}
					break;
				case 'j': timestamp[i] = d.getDate().toString(); break;
				case 'l':
					timestamp[i] = d.getDay();
					switch (timestamp[i]) {
						case 0: timestamp[i] = "Sunday"; break;
						case 1: timestamp[i] = "Monday"; break;
						case 2: timestamp[i] = "Tuesday"; break;
						case 3: timestamp[i] = "Wednesday"; break;
						case 4: timestamp[i] = "Thursday"; break;
						case 5: timestamp[i] = "Friday"; break;
						case 6: timestamp[i] = "Saturday"; break;
						default: timestamp[i] = "ERR";
					}
					break;
				case 'N': timestamp[i] = (d.getDay() + 1).toString(); break;
				case 'S':
					var date = d.getDate().toString();
					switch (date.charAt(date.length - 1)) {
						case '0': date = date + "th"; break;
						case '1': date = date + "st"; break;
						case '2': date = date + "nd"; break;
						case '3': date = date + "rd"; break;
						case '4': date = date + "th"; break;
						case '5': date = date + "th"; break;
						case '6': date = date + "th"; break;
						case '7': date = date + "th"; break;
						case '8': date = date + "th"; break;
						case '9': date = date + "th"; break;
					}
					timestamp[i] = date;
					break;
			}
		}
	}
	
};

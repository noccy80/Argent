plugins.logger = {
    
    // Default file logging format looks like this:
    // 02Jun2012-16:12:46.015 | Message!
    config_file:"./plugins/logger/logger.json",
    config:{},

    init:function(){
		sys.logger = this;
		
		this.config = JSON.parse(sys.fs.readFileSync(this.config_file, "UTF-8"));
		
		// Open any file handlers that need to be opened
		for (var i in this.config.destinations) {
			if (this.config.destinations[i].type in {"text":"", "html":""}) {
				for (var j in this.config.destinations[i].filters) {
					this.config.destinations[i].filters[j].file =
						sys.fs.openSync(this.config.destinations[i].filters[j].path, 'a');
				}
				this.config.destinations[i].file =
					sys.fs.openSync(this.config.destinations[i].default_path, 'a');
			}
		}
		return 0;
	},
	
    receiveRequest:function(r, u, q, res){return true;},
    
    shutdown:function(){
		sys.logger.log("[INFO] Logger - shutting down", "info");
		for (var i in this.config.destinations) {
			if (typeof(this.config.destinations[i].file) !== "undefined")
				sys.fs.closeSync(this.config.destinations[i].file);
			for (var j in this.config.destinations[i].filters)
				if (typeof(this.config.destinations[i].filters[j].file) !== "undefined")
					sys.fs.closeSync(this.config.destinations[i].filters[j].file);
		}
	},
    
    log:function(message, message_filter_type, destination) {
		if (message_filter_type == null) message_filter_type = sys.config.default_message_filter_type;
		if (message_filter_type in sys.toObject(sys.config.message_filter_types)) {
			if (typeof destination === "undefined") destination = this.config.default_destination;
			var d = this.config.destinations[destination];
			
			// Supported destination types: text, html, console
			switch (d.type) {
				case "text":
					for (var i in d.filters) {
						if (message_filter_type == d.filters[i].message_filter_type) {
							sys.fs.write(d.filters[i].file, this.now(destination) + d.separator + message + "\n");
							return;
						}
					}
					sys.fs.write(d.file, this.now(destination) + d.separator + message + "\n");
					return;
					break;
				case "html":
					for (var i in d.filters) {
						if (message_filter_type == d.filters[i].message_filter_type) {
							sys.fs.write(d.filters[i].file, 
								"<p class=\"entry\"><span class=\"timestamp\">" + this.now(destination) +
								"</span><span class=\"message\">" + message + "</span></p>"
							);
							return;
						}
					}
					sys.fs.write(d.file, 
						"<p class=\"entry\"><span class=\"timestamp\">" + this.now(destination) +
						"</span><span class=\"message\">" + message + "</span></p>"
					);
					return;
					break;
				case "console":
					for (var i in d.filters) {
						if (message_filter_type != "stderr") {
							console.log(this.now(destination) + d.separator + message);
						} else {
							console.err(this.now(destination) + d.separator + message);
						}
					}
					break;
			}
		}
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
		// For various reasons, we do not support: z, W, t, L, o, B, e, I, P, T, c, r, u
		// Additionally, u does milliseconds, not microseconds as in PHP
		for (var i = 0; i < timestamp.length; ++i) {
			switch(timestamp[i]) {
				case 'd':
					timestamp[i] = (d.getDate().toString().length == 1 ? "0" + d.getDate() : d.getDate().toString());
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
				case 'w':
					timestamp[i] = d.getDay().toString();
					break;
				case 'F':
					switch(d.getMonth()) {
						case 0: timestamp[i] = "January"; break;
						case 1: timestamp[i] = "February"; break;
						case 2: timestamp[i] = "March"; break;
						case 3: timestamp[i] = "April"; break;
						case 4: timestamp[i] = "May"; break;
						case 5: timestamp[i] = "June"; break;
						case 6: timestamp[i] = "July"; break;
						case 7: timestamp[i] = "August"; break;
						case 8: timestamp[i] = "September"; break;
						case 9: timestamp[i] = "October"; break;
						case 10: timestamp[i] = "November"; break;
						case 11: timestamp[i] = "December"; break;
					}
					break;
				case 'M':
					switch(d.getMonth()) {
						case 0: timestamp[i] = "Jan"; break;
						case 1: timestamp[i] = "Feb"; break;
						case 2: timestamp[i] = "Mar"; break;
						case 3: timestamp[i] = "Apr"; break;
						case 4: timestamp[i] = "May"; break;
						case 5: timestamp[i] = "Jun"; break;
						case 6: timestamp[i] = "Jul"; break;
						case 7: timestamp[i] = "Aug"; break;
						case 8: timestamp[i] = "Sep"; break;
						case 9: timestamp[i] = "Oct"; break;
						case 10: timestamp[i] = "Nov"; break;
						case 11: timestamp[i] = "Dec"; break;
					}
					break;
				case 'm':
					timestamp[i] = ((d.getMonth() + 1).toString().length == 1 ?
						"0" + (d.getDate() + 1).toString() : (d.getDate() + 1).toString());
					break;
				case 'n':
					timestamp[i] = (d.getMonth() + 1).toString();
					break;
				case 'Y':
					timestamp[i] = (d.getYear() + 1900).toString();
					break;
				case 'y':
					timestamp[i] = (d.getYear() + 1900).toString().substr(2, 2);
					break;
				case 'a':
					timestamp[i] = (d.getHours() < 12 ? "am" : "pm");
					break;
				case 'A':
					timestamp[i] = (d.getHours() < 12 ? "AM" : "PM");
					break;
				case 'g':
					var hour = d.getHours();
					if (hour > 12) hour -= 12;
					if (hour == 0) hour = 12;
					timestamp[i] = hour.toString();
					break;
				case 'G':
					timestamp[i] = d.getHours().toString();
					break;
				case 'h':
					var hour = d.getHours();
					if (hour > 12) hour -= 12;
					if (hour == 0) hour = 12;
					timestamp[i] = (hour.length == 1 ? "0" + hour : hour.toString());
					break;
				case 'H':
					timestamp[i] = (d.getHours().toString().length == 1 ?
						"0" + d.getHours() : d.getHours().toString());
					break;
				case 'i':
					timestamp[i] = (d.getMinutes().toString().length == 1 ?
						"0" + d.getMinutes() : d.getMinutes().toString());
					break;
				case 's':
					timestamp[i] = (d.getSeconds().toString().length == 1 ?
						"0" + d.getSeconds() : d.getSeconds().toString());
					break;
				case 'u':
					timestamp[i] = d.getMilliseconds().toString();
					break;
				case 'O':
					timestamp[i] = d.getTimezoneOffset().toString();
					break;
				case 'Z':
					timestamp[i] = (d.getTimezoneOffset() * 3600).toString();
					break;
			}
		}
		return timestamp.join('');
	}
	
};

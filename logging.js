GLOBAL.logging = function() {

	this.stdout = function(message) {
		console.log(this.now() + " :: " + message);
	};

	this.stderr = function(message) {
		console.error(this.now() + " :: " + message);
	};

	this.now = function() {
		var d = new Date();
		return "(" + (d.getMonth() + 1) + "-" + d.getDate() + "-" + d.getFullYear() +
			" " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() +
			":" + d.getMilliseconds() + ")";
	};

};

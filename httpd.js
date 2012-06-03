// Set up core framework
GLOBAL.sys = {};
sys.handlers = new Array();
sys.http = {};
sys.http.http = require('http');
sys.http.url = require('url');
sys.https = require('https');
sys.fs = require('fs');
sys.path = require('path');
sys.crypto = require('crypto');
sys.config = {
	"server_url":"localhost",
	"default_conf_file":"./httpd.conf",
	"listen_port":12321,
	"ssl_listen_port":443,
	"default_file":"index.html",
	"default_file_mime_type":"text/html",
	"default_action_mime_type":"application/json",
	"document_root":"./docroot",
	"plugin_directory":"./plugins",
	"extensions":{},
	"binaries":[],
	"error_documents":{},
	"enable_ssl":false,
	"private_key":"",
	"certificate":"",
	"message_types":["core"],
	"default_message_type":"core"
};

// System core logging object
sys.logger = {
	
	log:function(message, type, destination) {
		
		if (type == null) type = sys.config.default_message_type;
		
		if (type in toObject(sys.config.message_types)) {
			switch (destination) {
				case "stdin":
					console.error(sys.logger.now() + " | " + message);
					break
				default:
					console.log(sys.logger.now() + " | " + message);
			}
		}
	},

	now:function() {
		var d = new Date();
		return "(" + (d.getMonth() + 1) + "-" + d.getDate() + "-" + d.getFullYear() +
			" " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() +
			":" + d.getMilliseconds() + ")";
	}

};

// Set up basic plugin framework
GLOBAL.plugins= {};

// r = The HTTP request
// u = The parsed URL object
// q = The query part of the URL, parsed
// response = The response object
sys.handleAction = function(r, u, q, response) {
	var a = q.action.toLowerCase();
	var pluginName = a.split('@')[0];
	var action = a.split('@')[1];
	var ret = {};
	sys.logger.log("Action request\n\tPlugin: " + pluginName + "\n\tAction: " + action + "\n\tParameters: " + u.search);
	sys.logger.log(JSON.stringify(q));
	if (eval("sys.handlers['" + pluginName + "']")) {
		eval("var handler = sys.handlers['" + pluginName + "']");
		
		if (handler.handlesAction(action)) {
			ret = handler.handle(action, r, q, response);
			if (ret != null) {
				sys.logger.log(JSON.stringify(ret));
				ret.headers['content-length'] = JSON.stringify(ret.response).length;
				sys.logger.log("Response: " + JSON.stringify(ret.response));
			}
		} else {	// Module can't handle the action, much like your mom
			sys.logger.log("[ERR] The `" + pluginName + "` plugin cannot handle action `" + action + "`.");
			ret.headers = {"content-type":"application/json"};
			ret.response = {"error":"[ERR] The `" + pluginName + "` plugin is not loaded."};
		}
	} else {	// Module doesn't exist
		sys.logger.log("[ERR] The `" + pluginName + "` plugin is not loaded.");
		ret.headers = {"content-type":"application/json"};
		ret.response = {"error":"[ERR] The `" + pluginName + "` plugin is not loaded."};
	}
	return ret;
};

sys.respond = function(response, httpcode, mimetype, body, headers) {
	headers["Content-Type"] = mimetype;
	headers["Content-Length"] = body.length;
	response.writeHead(httpcode, headers);
	if (sys.isBinaryType(mimetype, sys.config.binaries)) {
		response.end(body, 'binary');
	} else {
		response.end(body);
	}
}

sys.getMimeType = function(filename) {
	var parts = filename.split('.');
	var ext = parts[parts.length - 1].toLowerCase();
	if (sys.config.extensions[ext]) {
		return sys.config.extensions[ext];
	} else {
		return null;
	}
};

sys.isBinaryType = function(mimetype, table) {
	for (var i = 0; i < sys.config.binaries; ++i)
		if (sys.config.binaries[i] == mimetype)
			return true;
	return false;
};

sys.parseFilename = function(filename) {
	// Work over the filename to retrieve
	var fnameParts = filename.split('/');
	if (fnameParts[fnameParts.length - 1].indexOf('.') == -1) { // There is no . in the filename part of the path
		// Append a trailing slash if it's not there
		if (filename.charAt(filename.length - 1) != '/') {
			filename += '/';
			sys.respond(response, 302, "", "", {"Location":filename});
		}
		// If there's still no filename, add the default
		if (filename.charAt(filename.length - 1) == '/') filename += sys.config.default_file;
	}
	return sys.config.document_root + "/" + filename;
};

function toObject(arr) {
	var obj = {};
	for(var i = 0; i < arr.length; ++i)
		obj[arr[i]]='';
	return obj;
}

function handleRequest(request, response) {
	// Initialize things...
	var u = sys.http.url.parse(request.url, true);
	var query = u.query;
	var filename = u.pathname;
	var mimetype = null;

	query.cookies = {};
	request.headers.cookie && request.headers.cookie.split(';').forEach(function(cookie) {
		var parts = cookie.split('=');
		query.cookies[parts[0].trim()] = (parts[1] || '').trim();
	});

	// receiveRequest trigger
	var errors = new Array();
	for (var i in plugins) {
		var cont = plugins[i].receiveRequest(request, u, query, response);
		if (cont == null) {
			return;
		} else if (cont !== true) {
			if ('e' + cont.httpcode in sys.config.error_documents) {
				sys.respond(response,
					cont.httpcode,
					sys.config.default_file_mime_type,
					sys.fs.readFileSync(sys.config.document_root + "/" + sys.config.error_documents["e" + cont.httpcode]),
					{}
				);
			} else {
				sys.respond(response, cont.httpcode, sys.config.default_file_mime_type, "", {});
			}
		}
	}
	if (errors.length == 0) {
	   // Actions always override file requests
		if (query.action) {
			var ret = sys.handleAction(request, u, query, response);
			if (ret != null)
				sys.respond(response, 200, sys.config.default_action_mime_type, JSON.stringify(ret.response), ret.headers);
			} else {	// We got no action, unlike your mom
			filename = sys.parseFilename(filename);
			mimetype = sys.getMimeType(filename);
			if (mimetype == null) mimetype = sys.config.default_file_mime_type;
			sys.logger.log("Request from " + request.connection.remoteAddress + ": " + request.url + " -> " + filename + " (" + mimetype + ")");

			try {
				var body = sys.fs.readFileSync(filename);
				sys.respond(response, 200, mimetype, body, {'Content-Type': mimetype, 'Content-Length': body.length});
			} catch (e) {   // Bad file?
				sys.logger.log(e);
				sys.logger.log("[ERR] Error serving request for " + filename);
				if ("e404" in sys.config.error_documents) {
					var errorFileName = sys.config.document_root + "/" + sys.config.error_documents["e404"];
					sys.respond(response,
						404,
						sys.getMimeType(errorFileName),
						sys.fs.readFileSync(errorFileName),
						{}
					);
				} else {
					sys.respond(response, 404, sys.config.default_file_mime_type, "", {});
				}
			}
		}
	} else {
		sys.logger.log("Could not serve request due to the following errors:");
		for (var i in errors)
			sys.logger.log("\t" + errors[i]);
	}
}

function parseConfigFile(file) {
	sys.logger.log("Config file: " + file);
	// Read the conf file and initialize the expected variables
	var delimiter = (process.platform === "win32" ? "\r\n" : "\n");
	var _confContent = sys.fs.readFileSync(file, "UTF-8").split(delimiter);
	
	// Look at each line of the conf file
	for (var i = 0; i < _confContent.length; ++i) {
		var pair = _confContent[i].split('=');
		if (pair[0].charAt(0) != '#' && pair[0].charAt(0) != ';') {
			// Check for expected values and react to them
			if (pair[0] == "default_file") sys.config.default_file = pair[1];
			if (pair[0] == "default_file_mime_type") sys.config.default_file_mime_type = pair[1];
			if (pair[0] == "default_action_mime_type") sys.config.default_action_mime_type = pair[1];
			if (pair[0] == "document_root") sys.config.document_root = pair[1];
			if (pair[0] == "listen_port") sys.config.listen_port = parseInt(pair[1]);
			if (pair[0] == "ssl_listen_port") sys.config.ssl_listen_port = parseInt(pair[1]);
			if (pair[0] == "enable_ssl") sys.config.enable_ssl = true;
			if (pair[0] == "private_key") sys.config.private_key = pair[1];
			if (pair[0] == "certificate") sys.config.certificate = pair[1];
			
			// Load ext/mimetype table entry
			if (pair[0] == "ext") {
				var parts = pair[1].split(',');
				for (var j = 0; j < parts.length - 1; ++j)
					sys.config.extensions[parts[j]] = parts[parts.length - 1];
			}

			// Load binary table
			if (pair[0] == "binary") {
				var parts = pair[1].split(',');
				for (var j = 0; j < parts.length; ++j)
					sys.config.binaries.push(parts[j]);
			}
			
			// Set the plugin directory
			if (pair[0] == "plugin_dir") {
				sys.config.plugin_directory = pair[1];
				if (sys.config.plugin_directory.substring(sys.config.plugin_directory.length - 2) == "/")
					sys.config.plugin_directory = sys.config.plugin_directory.substring(sys.config.plugin_directory.length - 2);
			}

			// Load a handler
			if (pair[0] == "handler") {
				var details = pair[1].split(',');  // 0 = handler file; 1 = plugin it handles
				var handler_file = sys.config.plugin_directory + "/" + details[1] + "/" + details[0] + ".js";
				require(handler_file);
				eval("sys.handlers['" + details[1] + "'] = plugins." + details[1] + ".handler;");
				sys.logger.log("Loaded handler '" + details[0] + "' to control plugin'" + details[1] + "'");
			}
			
			// Load a plugin
			if (pair[0] == "plugin") {
				var plugin_file = sys.config.plugin_directory + "/" + pair[1] + "/" + pair[1] + ".js";
				require(plugin_file);
				sys.logger.log("Loaded module '" + pair[1] + "' from " + plugin_file);
			}

			// Set a variable
			if (pair[0] == "var") {
				var varparts = pair[1].split(',');
				sys.logger.log("Setting variable: " + varparts[0] + " = " + varparts[1]);
				eval(varparts[0] + " = " + varparts[1] + ";");
			}
			
			// Set an error document
			if (pair[0] == "error_document") {
				var edocparts = pair[1].split(',');
				eval("sys.config.error_documents.e" + edocparts[0] + " = \"" + edocparts[1] + "\";");
				sys.logger.log("Setting error document for error " + edocparts[0] + " to " + edocparts[1]);
			}
			
			// Include another config file
			if (pair[0] == "include") {
				if (pair[1].charAt(0) == "/") {
					parseConfigFile(pair[1]);
				} else {
					parseConfigFile(pair[1]);
				}
			}
			
			// Set server URL
			if (pair[0] == "server_url")
				sys.config.server_url = pair[1];
			
			// Log message types
			if (pair[0] == "message_types")
				sys.config.message_types = pair[1].split(',');
			
			// Default log message type
			if (pair[0] == "default_message_type")
				sys.config.default_message_type = pair[1];
		}
	}
}

// Exit sequence
process.on("SIGINT", function() {
	sys.logger.log("Shutting down...");
	for (var i in plugins)
		plugins[i].shutdown();
	process.exit(0);
});

// Run the server itself
try {
	// Parse all config files
	parseConfigFile(sys.config.default_conf_file);
	
	// Remove potential postslash from the docroot
	if (sys.config.document_root.substring(sys.config.document_root.length - 2) == "/")
		sys.config.document_root = sys.config.document_root.substring(sys.config.document_root.length - 2);
	
	// Initialize all modules
	for (var i in plugins) {
		var initCode = plugins[i].init();
		if (initCode != 0) {
			sys.logger.log(initCode);
			exit(initCode);
		}
	}

	sys.http.http.createServer(handleRequest).listen(sys.config.listen_port);

	if (sys.config.enable_ssl) {
		sys.https.createServer({
			key:sys.fs.readFileSync(sys.config.private_key),
			cert:sys.fs.readFileSync(sys.config.certificate)
		}, handleRequest).listen(sys.config.ssl_listen_port);
	}
	
	sys.logger.log('HTTP daemon running on port ' + sys.config.listen_port);
	if (sys.config.enable_ssl)
		sys.logger.log('HTTPS daemon running on port ' + sys.config.ssl_listen_port);
} catch(e) {
	sys.logger.log("[ERR] Could not start server: " + e);
}

// Built-in support from our own external files
require('./logging.js');

// Set up core framework
GLOBAL.sys = {};
sys.handlers = new Array();
sys.logger = new logging();
sys.http = {};
sys.http.http = require('http');
sys.http.url = require('url');
sys.fs = require('fs');
sys.path = require('path');
sys.config = {
	"server_url":"",
	"server_root":"/var/argent/",
	"default_conf_file":"conf/httpd.conf"
};


// Set up basic module framework
GLOBAL.mods = {};

// r = The HTTP request
// u = The parsed URL object
// q = The query part of the URL, parsed
sys.handleAction = function(r, u, q) {
	var a = q.action.toLowerCase();
	var moduleName = a.split('@')[0];
	var action = a.split('@')[1];
	var ret = {};
	sys.logger.stdout("Action request\n\tModule: " + moduleName + "\n\tAction: " + action + "\n\tParameters: " + u.search);
	sys.logger.stdout(JSON.stringify(q));
	if (eval("sys.handlers['" + moduleName + "']")) {
		eval("var handler = sys.handlers['" + moduleName + "']");
		
		if (handler.handlesAction(action)) {
			ret = handler.handle(action, r, q);
			sys.logger.stdout(JSON.stringify(ret));
			ret.headers['content-length'] = JSON.stringify(ret.response).length;
			sys.logger.stdout("Response: " + JSON.stringify(ret.response));
		} else {	// Module can't handle the action, much like your mom
			sys.logger.stderr("[ERR] The `" + moduleName + "` module cannot handle action `" + action + "`.");
			ret.headers = {"content-type":"application/json"};
			ret.response = {"error":"[ERR] The `" + moduleName + "` module is not loaded."};
		}
	} else {	// Module doesn't exist
		sys.logger.stderr("[ERR] The `" + moduleName + "` module is not loaded.");
		ret.headers = {"content-type":"application/json"};
		ret.response = {"error":"[ERR] The `" + moduleName + "` module is not loaded."};
	}
	return ret;
};

sys.getMimeType = function(filename, table) {
	var parts = filename.split('.');
	var ext = parts[parts.length - 1].toLowerCase();
	if (table[ext]) {
		return table[ext];
	} else {
		return null;
	}
};

sys.isBinaryType = function(mimetype, table) {
	for (var i = 0; i < _bins; ++i)
		if (_bins[i] == mimetype)
			return true;
	return false;
};

function parseConfigFile(file) {
	sys.logger.stdout("Config file: " + file);
	// Read the conf file and initialize the expected variables
	var _confContent = sys.fs.readFileSync(file, "UTF-8").split('\n');
	
	// Look at each line of the conf file
	for (var i = 0; i < _confContent.length; ++i) {
		var pair = _confContent[i].split('=');
		if (pair[0].charAt(0) != '#' && pair[0].charAt(0) != ';') {
			// Check for expected values and react to them
			if (pair[0] == "default_file") _defaultFile = pair[1];
			if (pair[0] == "default_mime_type") _defaultMimeType = pair[1];
			if (pair[0] == "document_root") _documentRoot = pair[1];
			if (pair[0] == "listen_port") _listenPort = parseInt(pair[1]);
			
			// Load ext/mimetype table entry
			if (pair[0] == "ext") {
				var parts = pair[1].split(',');
				for (var j = 0; j < parts.length - 1; ++j)
					eval("_exts['" + parts[j] + "'] = '" + parts[parts.length - 1] + "';");
			}

			// Load binary table
			if (pair[0] == "binary") {
				var parts = pair[1].split(',');
				for (var j = 0; j < parts.length; ++j)
					_bins.push(parts[j]);
			}
			
			// Set the module directory
			if (pair[0] == "module_dir") {
				_moduleDir = pair[1];
				if (_moduleDir.substring(_moduleDir.length - 2) == "/")
					_moduleDir = _moduleDir.substring(_moduleDir.length - 2);
			}
			
			// Load a module/handler
			if (pair[0] == "handler" || pair[0] == "mod") {
				var details = pair[1].split(',');  // 0 = handler file; 1 = module it handles
				var mod_file = _moduleDir + "/" + details[0] + ".js";
				require(mod_file);
				
				if (pair[0] == "handler")
					eval("sys.handlers['" + details[1] + "'] = mods." + details[1] + ".handler;");
					
				sys.logger.stdout("Loaded module '" + pair[1] + "' from " + mod_file);
			}

			// Set a variable
			if (pair[0] == "var") {
				var varparts = pair[1].split(',');
				sys.logger.stdout("Setting variable: " + varparts[0] + " = " + varparts[1]);
				eval(varparts[0] + " = " + varparts[1] + ";");
			}
			
			// Set an error document
			if (pair[0] == "error_document") {
				var edocparts = pair[1].split(',');
				eval("_errorDocs.e" + edocparts[0] + " = \"" + edocparts[1] + "\";");
				sys.logger.stdout("Setting error document for error " + edocparts[0] + " to " + edocparts[1]);
			}
			
			// Include another config file
			if (pair[0] == "include") {
				if (pair[1].charAt(0) == "/") {
					parseConfigFile(pair[1]);
				} else {
					parseConfigFile(sys.config.server_root + pair[1]);
				}
			}
			
			// Set server root
			if (pair[0] == "server_root")
				sys.config.server_root = pair[1];
			
			// Set server URL
			if (pair[0] == "server_url")
				sys.config.server_url = pair[1];
		}
	}
}

// Exit sequence
process.on("SIGINT", function() {
	sys.logger.stdout("Shutting down...");
	for (var i in mods)
		mods[i].shutdown();
	process.exit(0);
});



// Run the server itself
try {

	var _defaultFile = "";
	var _defaultMimeType = "";
	var _documentRoot = "";
	var _listenPort = 0;
	var _moduleDir = "";
	var _exts = new Array();
	var _bins = new Array();
	var _errorDocs = {};

	// Parse all config files
	parseConfigFile("./conf/httpd.conf");
	
	// Remove potential postslash from the docroot
	if (_documentRoot.substring(_documentRoot.length - 2) == "/")
		_documentRoot = _documentRoot.substring(_documentRoot.length - 2);
	
	// Initialize all modules
	for (var i in mods) {
		var initCode = mods[i].init();
		if (initCode != 0) {
			sys.logger.stderr(initCode);
			exit(initCode);
		}
	}

	sys.http.http.createServer(function (request, response) {
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
		for (var i in mods) {
			var cont = mods[i].receiveRequest(request, u, query);
			if (cont !== true) {
				response.writeHead(cont.httpcode, {});
				var errorBody = "";
				if ('e' + cont.httpcode in _errorDocs)
					errorBody = sys.fs.readFileSync(_documentRoot + "/" + _errorDocs["e" + cont.httpcode]);
				response.end(errorBody);
			}
		}

		if (errors.length == 0) {
			// Actions always override file requests
			if (query.action) {
				var ret = sys.handleAction(request, u, query);
				response.writeHead(200, ret.headers);
				response.end(JSON.stringify(ret.response));
			} else {	// We got no action
				// Work over the filename to retrieve
				fnameParts = filename.split('/');
				if (fnameParts[fnameParts.length - 1].indexOf('.') == -1) { // There is no . in the filename part of the path
					// Append a trailing slash if it's not there
					if (filename.charAt(filename.length - 1) != '/') {
						filename += '/';
						response.writeHead(302, {"Location":filename});
						response.end("");
					}
					// If there's still no filename, add the default
					if (filename.charAt(filename.length - 1) == '/') filename += _defaultFile;
				}
				filename = _documentRoot + "/" + filename;
				mimetype = sys.getMimeType(filename, _exts);
				if (mimetype == null) mimetype = _defaultMimeType;
				sys.logger.stdout("Request from " + request.connection.remoteAddress + ": " + request.url + " -> " + filename + " (" + mimetype + ")");
			
				try {
					var body = sys.fs.readFileSync(filename);
				
					// Write out document
					response.writeHead(200,
						{
							'Content-Type': mimetype,
							'Content-Length': body.length
						}
					);
					if (sys.isBinaryType(mimetype, _bins)) {
						response.end(body, 'binary');
					} else {
						response.end(body);
					}
				} catch (e) {	// Bad file?
					sys.logger.stderr(e);
					sys.logger.stderr("[ERR] Error serving request for " + filename);
					response.writeHead(404, {});
					if ("e404" in _errorDocs) {
						response.end(sys.fs.readFileSync(_documentRoot + "/" + _errorDocs["e404"]));
					} else {
						response.end("");
					}
				}
			}
		} else {
			sys.logger.stderr("Could not serve request due to the following errors:");
			for (var i in errors)
				sys.logger.stderr("\t" + errors[i]);
		}
	}).listen(_listenPort);
	
	sys.logger.stdout('HTTP daemon running on port ' + _listenPort);
} catch(e) {
	sys.logger.stderr("[ERR] Could not start server: " + e);
}

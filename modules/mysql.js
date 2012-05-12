/* mysql
 * This module provides MySQL query simplification for Argent.
 * This module depends upon the node-mysql library (https://github.com/felixge/node-mysql)
 * which is dependent upon the node-hashish library (https://github.com/substack/node-hashish)
 * which is dependent upon the js-traverse library (https://github.com/substack/js-traverse)
 * These libraries should be placed in your argent root in a directory
 * called 'node_modules', and the lib folders should all have the short
 * version of their names. For example, the node-mysql libs might reside
 * in /opt/argent/node_modules/mysql
 */

mods.mysql = {
	
	libs:{},
	
	config:{
		defaults:{
			host:"localhost",
			port:3306,
			user:"root",
			password:null,
			database:null
		}
	},
	
    init:function(){
		this.libs.mysql = require('mysql');
		return 0;
	},
	
	connect:function(config){
		config = typeof config !== 'undefined' ? config : this.config.defaults;
		return this.libs.mysql.createClient(config);
	},
	
	disconnect:function(){
		this.client.end(function(){
			this.client = null;
		});
	},
	
	query:function(query, params, config, response){
		var client = this.connect(config);
		client.query(query, params,
			function(err, results, fields) {
				sys.logger.stderr("QUERY ERROR: " + err);
				sys.logger.stdout("QUERY RESULTS: " + JSON.stringify(results));
				sys.logger.stdout("FIELDS: " + JSON.stringify(fields));
				if (err == null) {
					sys.respond(response, 200, "application/json", JSON.stringify({
						"query":query,
						"results":JSON.stringify(results),
						"fields":JSON.stringify(fields)
					}), {});
				} else {
					sys.respond(response, 200, "application/json", JSON.stringify({
						"query":query,
						"results":null,
						"error":err
					}), {});
				}
			}
		);
	},
	
    receiveRequest:function(r, u, q){return true;},
    
    shutdown:function(){}
    
};

// SELECT * FROM `contact`;

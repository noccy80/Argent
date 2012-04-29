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
		connect_on_init:true,
		defaults:{
			host:"localhost",
			port:3306,
			user:"root",
			password:null,
			database:null
		},
		queries:{}
	},
	
	client:null,
	
    init:function(){
		this.libs.mysql = require('mysql');
		if (this.config.connect_on_init)
			this.client = this.libs.mysql.createClient(this.config.defaults);
		return 0;
	},
	
	addConnection:function(name, config){
		this.config[name] = config;
	},
	
	addQuery:function(name, query){
		this.config.queries[name] = query;
	},
	
	connect:function(config){
		config = typeof config !== 'undefined' ? config : this.config.defaults;
		this.client = this.libs.mysql.createClient(config);
	},
	
	disconnect:function(){
		this.client.end(function(){
			this.client = null;
		});
	},
	
	query:function(name, params, disconnect, config){
		if (disconnect !== true) disconnect = false;
		if (this.client == null) this.client.connect(config);
		var query = this.config.queries[name];
		
		this.client.query(quer
		if (disconnect) this.disconnect();
	},
	
	query:function(query, params, disconnect, config){
		if (disconnect !== true) disconnect = false;
		if (this.client == null) this.client.connect(config);
		
	},
	
    receiveRequest(r, u, q){return true;},
    
    shutdown:function(){}
};

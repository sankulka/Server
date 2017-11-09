'use strict';

var sessions = require('./sessions');

var utils = module.exports = {

	getUser : function (request) {
		var user = request.headers.from;
		if (user == null || user == undefined)
			return null;
		return user;
	},
	
	getProject : function (request) {
		var user = request.headers.from;
		if (user == null || user == undefined || user == '')
			return null;
		
		var project = sessions.sessionService.getProject(user);
		if (project == null || project == undefined || project == '')
			return null;
			
		return project;
	},
	
	getRole : function (request) {
		var user = request.headers.from;
		if (user == null || user == undefined || user == '')
			return null;
		
		var role = sessions.sessionService.getRole(user);
		if (role == '')
			return null;
			
		return role;
	},	
	
	getAuth : function (request) {
		var user = request.headers.from;
		if (user == null || user == undefined || user == '')
			return null;
		
		var auth = sessions.sessionService.getAuth(user);
		if (auth == undefined)
			return null;
			
		return auth;
	},
	
	getRoleType : function (role) {
		if (role.indexOf('owner') >= 0)
			return 'owner';
		if (role.indexOf('editor') >= 0)
			return 'editor';
		if (role.indexOf('viewer') >= 0)
			return 'viewer';
		return '';
	}
};

'use strict';

var cache = require('./cache');
var tenants = require('../config/tenants');

/*
0	project
1	user
2	role	owner/editor/viewer
3	auth
4	cache
*/

var sessions = function () {
	
	var sessionCache = [];
	
	function isCacheInitialized (project) {
		for(var ii = 0; ii < sessionCache.length; ii++)
			if(sessionCache[ii].project == project) {
				return true;
			}
		return false;
	}

	function hasSessionForUser (user) {
		for(var ii = 0; ii < sessionCache.length; ii++)
			if(sessionCache[ii].user == user) {
				return true;
			}
		return false;
	}
	
	function addSession (project, user, role, auth) {
		console.log('Adding session for ' + project + ' : ' + user);
		var session = {
			project: project,
			user : user,
			role : role,
			auth : auth
		};
		sessionCache.push(session);				
	}
	
	return {
		getSessionCache : function () {
			return sessionCache;
		},
		
		getProject : function (user) {
			for(var ii = 0; ii < sessionCache.length; ii++)
				if(sessionCache[ii].user == user) {
					return sessionCache[ii].project;
				}
		},
		
		getRole : function (user) {
			if (user == '' || user == null)
				return '';
			
			for(var ii = 0; ii < sessionCache.length; ii++)
				if(sessionCache[ii].user == user) {
					return sessionCache[ii].role;
				}
		},
		
		isOwner : function (user) {
			for(var ii = 0; ii < sessionCache.length; ii++)
				if(sessionCache[ii].user == user) {
					return sessionCache[ii].role == 'owner';
				}
		},
		
		getAuth : function (user) {
			for(var ii = 0; ii < sessionCache.length; ii++)
				if(sessionCache[ii].user == user) {
					return sessionCache[ii].auth;
				}
		},
		
		startSession : function (project, user, role, auth, callback) {
			if (hasSessionForUser(user)) {
				callback();
				return;
			}

			if (isCacheInitialized(project)) {
				addSession (project, user, role, auth);
				callback();
				return;
			}
			
			cache.cacheService.initialize(project, auth, function (error){
				if (error)
					console.log('Error in initializing cache: ' + error);
				else {
					addSession (project, user, role, auth);
					callback();
					return;
				}
			});
		},
		
		deleteSession : function (project, user) {
			for(var ii = 0; ii < sessionCache.length; ii++)
				if(sessionCache[ii].user == user) {
					console.log('Deleting session for ' + user);
					sessionCache.splice(ii, 1);
					break;
				}
			
			for(var ii = 0; ii < sessionCache.length; ii++) {
				var retain = false;
				if(sessionCache[ii].project == project) {
					retain = true;
					break;
				}
				if(retain == false) {
					console.log('Deleting cache, auth for ' + project);
					cache.cacheService.clear(project);
					tenants.tenantService.deleteAuth(project);
				}
			}
		}
	};
};

exports.sessionService = new sessions();

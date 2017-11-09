'use strict';

exports.scopes =
	'https://spreadsheets.google.com/feeds ' +
	'https://www.googleapis.com/auth/drive ' +
	'https://www.googleapis.com/auth/drive.file ' +
	'https://www.googleapis.com/auth/forms ' +
	'https://www.googleapis.com/auth/calendar ' +
	'https://www.googleapis.com/auth/gmail.modify ' +
	'https://www.googleapis.com/auth/gmail.labels ' +
	'https://www.googleapis.com/auth/plus.login ' +
	'https://www.googleapis.com/auth/userinfo.email ' +
	'https://www.googleapis.com/auth/cloud-platform ';

var fs = require('fs');
var googleapis = require('googleapis');
var TENANTS_FILE = './config/tenants.json';

/*
// Info from the App Engine
name, // of the project
ID,
number,	
// Info for auth object
client_id,
secret,
redirect_url, // Constant for all projects
// Naming structure on drive
owner,
initial,
folder,
casePaperId,
regIdInCasePaper
*/

var tenants = function() {
	
	var tenantsCache = [];
	
	return {
		initialize : function () {
			console.log('Initializing tenants');

			fs.exists(TENANTS_FILE, function(exists) {
				if(exists) {
					fs.readFile(TENANTS_FILE, 'utf8', function(err, data) {
						if (err) {
							console.log('Error in reading tenants File: ' + err);
						} else {
							if (data == "" || data == null || data == undefined)
								console.log('No tentants configured');
							else {
								tenantsCache = JSON.parse(data);
								console.log('Successfully read tenants data');
							}
						}
					});
				}
			});
		},
		
		getAuth : function (id) {
			for(var ii = 0; ii < tenantsCache.length; ii++)
				if(tenantsCache[ii].id == id) {
					var auth = new googleapis.auth.OAuth2(
						tenantsCache[ii].client_id,
						tenantsCache[ii].client_secret,
						tenantsCache[ii].redirect_url);
					return auth;
				}
		},
		
		deleteAuth : function (id) {
			for(var ii = 0; ii < tenantsCache.length; ii++)
				if(tenantsCache[ii].id == id) {
					if (tenantsCache[ii].auth != null) {
						tenantsCache[ii].auth.setCredentials (null);
						tenantsCache[ii].auth = null;
					}
				}
		},
		
		getFolder : function (id) {
			for(var ii = 0; ii < tenantsCache.length; ii++)
				if(tenantsCache[ii].id == id) {
					return tenantsCache[ii].folder;
				}
		},
		
		getOwner : function (id) {
			for(var ii = 0; ii < tenantsCache.length; ii++)
				if(tenantsCache[ii].id == id) {
					return tenantsCache[ii].owner;
				}
		},
		
		getInitial : function (id) {
			for(var ii = 0; ii < tenantsCache.length; ii++)
				if(tenantsCache[ii].id == id) {
					return tenantsCache[ii].initial;
				}
		},

		getCasePaper : function (id) {
			for(var ii = 0; ii < tenantsCache.length; ii++)
				if(tenantsCache[ii].id == id) {
					return tenantsCache[ii].casePaper;
				}
		},
		
		getRegIdInCasePaper : function (id) {
			for(var ii = 0; ii < tenantsCache.length; ii++)
				if(tenantsCache[ii].id == id) {
					return tenantsCache[ii].regIdInCasePaper;
				}
		}
	}
};

exports.tenantService = new tenants();

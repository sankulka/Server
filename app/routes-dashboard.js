'use strict';

var tenants = require('../config/tenants');
var sessions = require('./sessions');
var utils = require('./utils');
var googleapis = require('googleapis');

module.exports = function (app) {
	
	tenants.tenantService.initialize();
	
	/* Redirect user to OAuth 2.0 login URL */
	app.get('/login/:project', function(req, res) {
		var project = req.params.project;
		var auth = tenants.tenantService.getAuth(project);
		if (auth == null || auth == undefined) {
			console.log('google Client is not initialized');
			res.redirect('/');
		}
		var authenticationUrl = auth.generateAuthUrl({approval_prompt: 'force', access_type: 'offline', scope: tenants.scopes});
		var state = project + "snk" + req.headers.referer;
		authenticationUrl = authenticationUrl + "&state=" + state;
		
		console.log('redirecting to authentication url: ' + authenticationUrl);	
		res.redirect(authenticationUrl);
	});

	/* Use OAuth 2.0 authorization code to fetch user's profile */
	app.get('/oauth2callback', function(req, res, next) {
		var state = (req.query.state).split('snk');
		console.log(state[0]);
		console.log(state[1]);
		var project = state[0];
		var referer = state[1];
		var googleLogout = "https://www.google.com/accounts/Logout?continue=https://appengine.google.com/_ah/logout?continue=";
		var redirectHome = googleLogout + referer;
		
		console.log('oauth2callback done. Project: ' + project);
		var auth = tenants.tenantService.getAuth(project);
		if (auth == null || auth == undefined) {
			console.log('google Client is not initialized');
			res.redirect(redirectHome);
			return;
		}
		auth.getToken(req.query.code, function(err, tokens) {
			if (err) {
				console.log('Unsuccessful login:' + err + ' Redirecting to home site');
				res.redirect(redirectHome); // Unsuccessful Message
				return;
			} else {
				auth.setCredentials(tokens);
						
				var params = {
					auth: auth,
					userId: 'me',	
					fields: 'emails/value'
				};
				googleapis.plus('v1').people.get(params, function(error, profile) {
					if (error) {
						console.log('Unable to get user: ' + error);
						res.redirect(redirectHome); // Unsuccessful Message
						return;
					}
					var user = profile.emails[0].value;
					params = {
						auth: auth,
						resource_: project,
						fields: 'bindings'
					};
					googleapis.cloudresourcemanager('v1').projects.getIamPolicy (params, function (err, roles) {
						if (err || roles == null || roles.bindings.length == 0) {
							console.log('Unable to get Policy: ' + err);
							res.redirect(redirectHome); // Unsuccessful Message
							return;
						}
						for (var ii = 0; ii < roles.bindings.length; ii++) {
							if (roles == null || roles.bindings[ii] == null)
								continue;
							
							var members = roles.bindings[ii].members;
							for (var jj = 0; jj < members.length; jj++) {
								var member = members[jj].split("user:");
								if (member[1] != null && member[1] != undefined &&
									member[1].toLowerCase() == user.toLowerCase()) {
									var role = utils.getRoleType(roles.bindings[ii].role);
									if (user == '' || role == '') {
										console.log('User or Role is null. Continuing');
										continue;
									}
									
									sessions.sessionService.startSession
										(project, user, role, auth, function () {
										console.log('Launching dashboard for project: ' + project +
										" user: " + user + " and role: " + role);
										
										var credentials = {
											user: user,
											role: role
										};
										res.cookie('credentials', JSON.stringify(credentials));
										var clientDashboard = referer + 'pms.html';
										console.log('redirecting to ' + clientDashboard);
										res.redirect(clientDashboard);
									});
								}
							}
						}
					});
				});
			}
		});
	});

	/* Clear the session */
	app.get('/logout', function(req, res) {
		var project = utils.getProject(req);
		var user = utils.getUser(req);
		console.log('Logging out user: ' + user);
		sessions.sessionService.deleteSession(project, user);
		//tenants.tenantService.deleteAuth(project);
		req.session = null;
		res.json({});
	});
};

/*
"https://accounts.google.com/o/oauth2/auth?scope=https%3A%2F%2Fspreadsheets.google.com%2Ffeeds%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.file%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.appdata%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fforms%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar%20https%3A%2F%2Fmail.google.com%2F%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.modify%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.readonly%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.labels%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fscript.send_mail%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdocuments%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fplus.login%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcloud-platform%20&response_type=code&client_id=634814993779-26klss35mbbko0ijf5o30p13ob2ai4rb.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A8005%2Foauth2callback&state=nuhomoeo-local"
*/

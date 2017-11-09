'use strict';

var fs = require('fs');
var sessions = require('./sessions');
var utils = require('./utils');
var gmail = require('./models/gmail');
var schedule = require('node-schedule');
var UNREADEMAIL_PATH = './public/emails/';

module.exports = function (app) {

	var rule = new schedule.RecurrenceRule();
	rule.minute = new schedule.Range(0, 59, 5);

	schedule.scheduleJob(rule, function () {
		console.log('Running the email schedule job');
		var activeSessions = sessions.sessionService.getSessionCache();
		for (var ii = 0; ii < activeSessions.length; ii++) {
			var session = activeSessions[ii];
			if (session.role == 'owner') { // only for Owner
				console.log('Running the job for: ' + ii +
				' : ' + session.user + ' : ' + session.role);
				gmail.initialize(session, function (error, NuRelID) {
					if (error == null)
						gmail.getUnreadEmails(session, NuRelID);
				});
			}
		}
	});

	app.get('/unreadEmails', function(req, res) {
		var user = utils.getUser(req);
		var project = utils.getProject(req);
		if (project == null || sessions.sessionService.isOwner(user) == false) {
			console.log('Project is null or no email rights');
			res.json({});
			return;
		}
		
		console.log('Getting un-read emails from patients');
		var UNREADEMAIL_FILE = UNREADEMAIL_PATH + project + '-unread.json';
		fs.exists(UNREADEMAIL_FILE, function(exists) {
			if(exists) {
				fs.readFile(UNREADEMAIL_FILE, 'utf8', function(err, data) {
					if (err) {
						console.log('Error in reading Email File ' + err);
					} else {
						if (data == "" || data == null || data == undefined)
							res.json({});
						else {
							var obj = JSON.parse(data);
							res.json(obj);
						}
					}
				});
			}
		});		

		/*
		sheet.getRows(masterSheet, 'UnreadEmails', function(rows) {
			if (rows == null || rows == undefined || rows.length == 0) {
				console.log('No emails in the cache');
				return;
			}
			var emails = [];			
			for (var ii = 0; ii < rows.length; ii++) {
				var email = {
					id: rows[ii][0],
					name: rows[ii][1],
					date: moment(rows[ii][2]).format('lll'),
					subject: rows[ii][3]
				};
				emails.push(email);
			}
			res.json(emails);
		});*/
	});
};

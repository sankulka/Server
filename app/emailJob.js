'use strict';

var gmail = require('./models/gmail');
var schedule = require('node-schedule');
var sessions = require('./sessions');

var email = module.exports = {
	
	/*
	var activeSessions = sessions.sessionService.getSessions();
	for (var ii = 0; ii < activeSessions.length; ii++) {
		if (activeSessions[ii].role == owner) // only for Owner					
			gmail.initialize(session);
	}
	*/
	
	console.log('Initiating the schedule job');
	var rule = new schedule.RecurrenceRule();
	rule.minute = new schedule.Range(0, 59, 5);

	schedule.scheduleJob(rule, function () {
		console.log('Running the email schedule job');
		var activeSessions = sessions.sessionService.getSessions();
		for (var ii = 0; ii < activeSessions.length; ii++) {
			if (activeSessions[ii].role == 'owner')
				gmail.initialize(session, function(error, label) {
					if (error == null)
						gmail.getUnreadEmails(session);
			});
		}
	});
};

/*
function processHeader(header) {
	console.log('Processing the header: ' + header['id']);
	var folderDetails = cache.cacheService.getPatientFolderDetailsByEmail
							(header['sender'], header['subject']);
	if(!folderDetails || folderDetails == undefined || folderDetails == null)
		return;
	
	var rowEntry = [];
	rowEntry.push(header['date']);
	rowEntry.push('Email');
	rowEntry.push(header['subject']);
	rowEntry.push(header['id']);
	sheet.appendRow(folderDetails.details, 'Activities', rowEntry, function() {
		console.log('Email added in Activities sheet');

		var params = {
			auth: auth.googleClient,
			userId: 'me',
			id: header['id']
		};
		script.markProcessed(header['id']);
	});
	
	var params = {
		auth: auth.googleClient,
		userId: 'me',
		id: header['id'],
		fields: 'payload(parts)'
	};

	gmailService.users.messages.get(params, function(err, data) {
		if(err) {
			console.log('Error while fetching parts: ' + err);
			return;
		}
		if (data.payload == null || data.payload == undefined || data.payload.parts == null) {
			console.log('No attachment for the email: ' + header['id']);
			return;
		}

		for (var ii = 0; ii < parts.length; ii++) {
			var fileName = parts[ii]['filename'];
			if (fileName) {
				var mimeType = parts[ii]['mimeType'];
				
				var params2 = {
					auth: auth.googleClient,
					userId: 'me',
					id: parts[ii].body.attachmentId,
					messageId: header['id']
				};
				gmailService.users.messages.attachments.get(params2, function(err, partBody) {
					if(err) {
						console.log('Error while fetching attachment');
						return;
					}
					var buffer = new Buffer(partBody.data, 'base64');
					
					var fileMetadata = {
						'name': fileName,
						'parents': [folderDetails.folder],
						'mimeType': mimeType
					};
					var media = {
						mimeType: mimeType,
						body: buffer
					};
					driveService.files.create({
						auth: auth.googleClient,
						resource: fileMetadata,
						media: media,
						fields: 'id'
					}, function(err, newFile) {
						if(err || newFile == null) {
							console.log(err);
							return;
						}
						console.log('Attachment pulled from email: ' + newFile.id);
						function getToday() {
							var date = new Date();
							return (date.getDate() + '-' + date.getMonth() + '-' + date.getFullYear());
						}
							
						var rowEntry = [];
						rowEntry.push(header['date']);
						rowEntry.push(mimeType);
						rowEntry.push(fileName);
						rowEntry.push(newFile.id);
						sheet.appendRow(folderDetails.details, 'Activities', rowEntry, function() {
							console.log('Email Attachment updated in in Activities page');
						});
					});						
				});
			}
		}
	});
};
*/
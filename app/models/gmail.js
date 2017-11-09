'use strict';

var fs = require('fs');
var async = require('async');
var chronic = require('./chronic');
var sheet = require('./sheet');
var tenants = require('../../config/tenants');
var moment = require('moment');
var googleapis = require('googleapis');
var driveService = googleapis.drive('v3');
var gmailService = googleapis.gmail('v1');
var UNREADEMAIL_PATH = './public/emails/';

var gmail = module.exports = {
	
	initialize : function (session, callback) {
		var params = {
			auth: session.auth,
			userId: session.user
		};
		gmailService.users.labels.list(params, function(error, resp) {
			if (error) {
				console.log('Error in getting the labels: ' + error);
				callback (error, '');
				return;
			}
			
			var labels = resp.labels;
			for (var ii = 1; ii < labels.length; ii++) {
				if (labels[ii].name == 'NuRel') {
					var NuRelID = labels[ii].id;
					console.log('NuRel Label is found');
					callback(null, NuRelID);
					return;
				}
			}
			params['resource'] = {
				'name': 'NuRel'
			};
			gmailService.users.labels.create(params, function(error, resp) {
				if (error) {
					console.log ('Error in creating label: ' + error);
					callback(error, '');
				}
				else {
					console.log('NuRel Label is successfully created: ' + resp.id);
					var NuRelID = resp.id;
					callback(null, NuRelID);
				}
			});
		});
	},
	
	getUnreadEmails : function (session, NuRelID) {

		var auth = session.auth;
		var user = session.user;
		var project = session.project;
		var UNREADEMAIL_FILE = UNREADEMAIL_PATH + project + '-unread.json';
		var addresses = chronic.cacheService.getEmailAddresses(project);
	
		console.log('Getting Unread emails');
		var query;
		var fromList = 'from:(';
		if(addresses.length == 1)
			fromList = fromList + addresses[0];
		else {
			fromList = fromList + addresses[0];
			for (var ii = 1; ii < addresses.length; ii++) {
				fromList = fromList + ' OR ' + addresses[ii];
			}
		}
		fromList = fromList  + ')';
		var initial = tenants.tenantService.getInitial(project);
		var subjectList = 'subject:(' + initial + ')';
		var query = 'is:unread AND in:(INBOX OR NuRel) AND (' +
					fromList + ' OR ' + subjectList + ')';
		
		var params = {
			auth: auth,
			userId: user,
			includeSpamTrash: false,
			q : query
		};
		
		gmailService.users.messages.list(params, function(err, data) {
			if (err) {
				console.log('The API returned an error: ' + err);
			} else if (data.messages == undefined || data.messages == null) {
				console.log('No unread messages found');
			} else {
				console.log('Number of unread messages: ' + data.messages.length);

				var unreadList = [];
				async.each(data.messages, function(email, callback) {
					var params2 = {
						auth: auth,
						userId: user,
						id: email.id,
						fields: 'id, labelIds, payload(headers), payload(parts)'
					};
					
					gmailService.users.messages.get(params2, function(err, message) {
						if (err) {
							console.log(err);
							return;
						}
						var header = {};
						header['messageId'] = message.id;
						var headers = message.payload.headers;
						for (var jj = 0; jj < headers.length; jj++) {
							if (headers[jj].name == 'From') {
								var from = headers[jj].value;
								if(from.indexOf('<') >= 0)
									header['sender'] = from.substring(from.indexOf('<')+1, from.indexOf('>'));
								else
									header['sender'] = from;
							}
							else if (headers[jj].name == 'Date') {
								var date = moment(headers[jj].value);
								header['date'] = date.format('YYYY-MM-DDTHH:mm:ssZ');
								header['dateTime'] = date.format('lll');
							}
							else if (headers[jj].name == 'Subject')
								header['subject'] = headers[jj].value;
						}
						
						var subjectId = null;
						var sub = header['subject'].match(/[a-zA-Z]*-\d*/);
						if (sub != null)
							subjectId = sub[0].toUpperCase();
						var patient = chronic.cacheService.getPatientNameFolderDetailsByEmail
										(project, header['sender'], subjectId);
						
						if (patient != null) {
							header['id'] = patient.id;
							header['name'] = patient.name;
							unreadList.push(header);
							
							var labels = message.labelIds;
							if (labels.indexOf(NuRelID) >= 0)
								console.log('Marking is done, skipping the email processing');
							else
								processHeader(user, auth, NuRelID, header,
									patient, message.payload.parts);
							
							callback();
						}
					});
				}, function (error) {
					if (error) {
						console.log('Error after finishing all emails: ' + error);
						return;
					}
					
					var unreadFile = UNREADEMAIL_PATH + project + '-unread.json';				
					fs.writeFile(unreadFile, JSON.stringify(unreadList), 'utf8');
					console.log('All unread Emails are collected');
				});
			}
		});
	}
};

function processHeader(user, auth, NuRelID, header, patient, parts) {
	console.log('Processing the header: ' + header['messageId']);
	if(patient.details == '' || patient.folder == '' || patient.files == '')
		return;
	
	var rowEntry = [];
	rowEntry.push(header['date']);
	rowEntry.push('Email');
	rowEntry.push(header['subject']);
	rowEntry.push(header['messageId']);

	sheet.appendRow(auth, patient.details, 'Activities', rowEntry, function() {
		console.log('Email added in Activities sheet');
		var params = {
			auth: auth,
			userId: user,
			id: header['messageId'],
			resource: {
				'addLabelIds': [NuRelID],
				'removeLabelIds': ['INBOX']
			}
		};
		gmailService.users.messages.modify(params, function(error) {
			if (error) {
				console.log('Error in adding the label ' + error);
				return;
			}
			console.log('NuRelID Label is successfully added to the message');
			return;
		});
	});
	
	if (parts == null || parts == undefined) {
		console.log('No attachment for the email: ' + header['messageId']);
		return;
	}
	
	for (var ii = 0; ii < parts.length; ii++) {
		var fileName = parts[ii]['filename'];
		if (fileName) {
			var mimeType = parts[ii]['mimeType'];
			
			var params2 = {
				auth: auth,
				userId: user,
				id: parts[ii].body.attachmentId,
				messageId: header['messageId']
			};
			gmailService.users.messages.attachments.get(params2, function(err, partBody) {
				if(err) {
					console.log('Error while fetching attachment');
					return;
				}
				var buffer = new Buffer(partBody.data, 'base64');
				
				var fileMetadata = {
					'name': fileName,
					'parents': [patient.files],
					'mimeType': mimeType
				};
				var media = {
					mimeType: mimeType,
					body: buffer
				};
				driveService.files.create({
					auth: auth,
					resource: fileMetadata,
					media: media,
					fields: 'id'
				}, function(err, newFile) {
					if(err || newFile == null) {
						console.log(err);
						return;
					}
					console.log('Attachment pulled from email: ' + newFile.id);
						
					var rowEntry = [];
					rowEntry.push(header['date']);
					rowEntry.push(mimeType);
					rowEntry.push(fileName);
					rowEntry.push(newFile.id);
					sheet.appendRow(auth, patient.details, 'Activities', rowEntry, function() {
						console.log('Email Attachment updated in in Activities page');
					});
				});						
			});
		}
	}
};


/*
global.Buffer = global.Buffer || require('buffer').Buffer;

if (typeof btoa === 'undefined') {
  global.btoa = function (str) {
    return new Buffer(str).toString('base64');
  };
}

if (typeof atob === 'undefined') {
  global.atob = function (b64Encoded) {
    return new Buffer(b64Encoded, 'base64').toString();
  };
}

Text message:
				if (mime == 'text/html') {
					//var html = atob(parts[ii].body.data.replace(/-/g, '+').replace(/_/g, '/'));
					var html = new Buffer(parts[ii].body.data, 'base64').toString();
					
					var rowEntry = [];
					rowEntry.push(header['Date'])
					rowEntry.push('Email');
					rowEntry.push(html);
					sheet.appendRow(detailsSheet, 'Activities', rowEntry, function() {
						console.log('Text Email is stored in Details sheet');
					});
				} else if (mime == 'multipart/alternative') {
					var pp = parts[ii].parts;
					for (var jj = 0; jj < pp.length; jj++) {
						var mime = pp[jj]['mimeType'];
						if (mime == 'text/html') {
							//var html = atob(parts[ii].body.data.replace(/-/g, '+').replace(/_/g, '/'));
							var html = new Buffer(pp[jj].body.data, 'base64').toString();
					
							var rowEntry = [];
							rowEntry.push(header['Date'])
							rowEntry.push('Email');
							rowEntry.push(html);
							sheet.appendRow(detailsSheet, 'Activities', rowEntry, function() {
								console.log('multipart Text Email is stored in Details sheet');
							});
						}
					}
				} else
					console.log (parts[ii]['filename']);



*/

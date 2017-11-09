'use strict';

var moment = require('moment');
var icalToolkit = require('ical-toolkit');
var sendmail = require('sendmail') ({silent: true});

var mailer = module.exports = {

	sendInvite : function (owner, appointment) {
		
		var summary = appointment.summary.split('|');
		var name = summary[1];
		
		console.log('Creating the builder');
		// Create a builder
		var builder = icalToolkit.createIcsFileBuilder();

		builder.spacers = true;
		builder.NEWLINE_CHAR = '\r\n';
		builder.calname = 'NuRel Calendar';
		builder.timezone = 'asia/kolkata';
		builder.tzid = 'asia/kolkata';
		builder.method = 'REQUEST';
		builder.events.push({
			start: moment(appointment.startDateTime).toDate(),
			end: moment(appointment.endDateTime).toDate(),
			transp: 'OPAQUE',
			summary: appointment.summary,
			alarms: [15, 10, 5],
			stamp: new Date(),
			organizer: {
				name: 'NuRel',
				email: 'no-reply@nurel.in',
				sentBy: 'no-reply@nurel.in'
			},
			attendees: [{
			  name: name,
			  email: appointment.email
			}, {
			  name: owner,
			  email: owner	
			}]
		});

		console.log('Building the string');
		var icsFileContent = builder.toString()
		if (icsFileContent instanceof Error) {
			console.log('Returned Error, you can also configure to throw errors!');
			return;
		}

		console.log('Sending the invite to ' + owner + " and " + appointment.email);
		sendmail({
			from: 'no-reply@nurel.in',
			to: owner + ', ' + appointment.email,
			replyTo: 'no-reply@nurel.in',
			subject: 'New appointment request from website',
			//html: 'Mail of test sendmail ',
			text: 'Name: ' + summary[1] + '\n' +
				'Phone: ' + summary[2] + '\n' +
				'Email: ' + appointment.email,
			alternatives: [{
				contentType: 'text/calendar; charset="utf-8"; method=REQUEST',
				content: icsFileContent.toString()
			}]
		}, function (error, reply) {
			console.log('Sendmail finished');
			console.log(error && error.stack);
			console.dir(reply);
		});
	}
}

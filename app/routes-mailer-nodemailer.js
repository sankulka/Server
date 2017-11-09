'use strict';

var moment = require('moment');
var icalToolkit = require('ical-toolkit');
var tenants = require('../config/tenants');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var transporter = nodemailer.createTransport(smtpTransport({
	host: 'localhost',
   port: 465,
   auth: {
       user: 'username',
       pass: 'password'
   },
   tls:{
        secureProtocol: "TLSv1_method"
    },
	debug: true
}));

var mailer = module.exports = {

	sendInvite : function (owner, appointment, callback) {
		
		var summary = appointment.summary.split('|');
		var name = summary[1];
		var phone = summary[2];
		
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
			summary: name + ' (' + phone + ')',
			alarms: [15, 10, 5],
			/*repeating: {
			freq: 'DAILY',
			count: 10,
			interval: 10,
			until: new Date()
			},*/
			stamp: new Date(),
			//location: 'Home',
			//description: 'Testing it!',
			organizer: {
				name: 'NuRel',
				email: 'no-reply@nurel.in',
				sentBy: 'no-reply@nurel.in'
			},
			attendees: [{
			  name: owner,
			  email: owner
			}, {
			  name: name,
			  email: appointment.email		
			}]
		});

		console.log('Building the string');
		var icsFileContent = builder.toString()
		if (icsFileContent instanceof Error) {
			console.log('Returned Error, you can also configure to throw errors!');
			callback ("Error");
		}

		console.log('Sending the invite');
		transporter.sendMail({
			from: 'no-reply@nurel.in',
			to: 'kulkarni1@avaya.com',
			//to: owner,
			//replyTo: 'no-reply@nurel.in',
			subject: 'Appointment for '	+ name + ' (' + phone + ')',
			html: 'Mail of test sendmail ',
			alternatives: [{
				contentType: 'text/calendar; charset="utf-8"; method=REQUEST',
				content: icsFileContent.toString()
			}]
		}, function (error, reply) {
			console.log('Sendmail finished');
			if (error) {
				console.log('Error occurred during send');
				console.log (error && error.stack);
			}
			callback (reply);
		});
	}
}
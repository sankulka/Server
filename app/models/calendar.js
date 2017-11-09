'use strict';

var fs = require('fs');
var moment = require('moment');
var sessions = require('../sessions');
var googleapis = require('googleapis');
var calendarService = googleapis.calendar('v3');

var calendar = module.exports = {

	getAppointments : function(auth, user, inParams, callback) {
		var reqParams = {
			auth: auth,
			calendarId: user,
			fields: 'items(attendees(displayName, email),description,end/dateTime,id,start/dateTime,summary)'
		};
		
		var params = Object.assign({}, reqParams, inParams);				
		calendarService.events.list(params, {}, function(err, response) {
			if (err) {
				console.log('The API returned an error: ' + err);
				return;
			}
			//console.log(response.items);
			callback(response.items);
		});
	},
	
	createAppointment: function(auth, user, appointment, callback) {
		var event = {
			'summary': appointment.summary,
			'start': {
				'dateTime': appointment.startDateTime
			},
			'end': {
				'dateTime': appointment.endDateTime
			}
		};
		
		if (appointment.email != '') {
			event.attendees = [
				{'email': appointment.email}
			];			
		}
		
		var params = {
			auth: auth,
			calendarId: user,
			resource: event
		};
		calendarService.events.insert(params, {}, function(error, event) {
			if (error) {
				console.log('Calender event insert API returned an error: ' + error);
				callback(error);
				return;
			}
			console.log('Event is successfully created ' + event);
			callback();
			return;
		});
	},
	
	deleteAppointment: function(auth, user, id, callback) {
		var params = {
			auth: auth,
			calendarId: user,
			eventId: id
		};
		calendarService.events.delete(params, {}, function(error) {
			if (error) {
				console.log('Calender event insert API returned an error: ' + error);
				callback(error);
				return;
			}
			console.log('Event is successfully deleted');
			callback();
			return;
		});
	}
};

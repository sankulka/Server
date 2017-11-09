'use strict';

var fs = require('fs');
var moment = require('moment');
var log4js = require('log4js');
var utils = require('./utils');
var tenants = require('../config/tenants');
var mailer = require('./routes-mailer');
var calendar = require('./models/calendar');
var APPOINTMENTS_PATH = './public/appointments/';

module.exports = function (app) {

	log4js.configure ('./config/log4js.json');
	var logger = log4js.getLogger ('routes-appointments');

	function refreshAppointments (project, auth, user, callback) {
		if (auth == null )
			return callback({});
		
		console.log('Fetching the appointments for past 2 and next 2 month');
		logger.info('Fetching the appointments for past 2 and next 2 month');
	
		var now = moment();
		var last2months = moment().subtract(1, 'months');
		var next2months = moment().add(2, 'months');

		var params = {
			timeMin: moment(last2months).format("YYYY-MM-DDTHH:mm:ssZ"),
			timeMax: moment(next2months).format("YYYY-MM-DDTHH:mm:ssZ") 
		};

		//console.log('user: ' + user);
		//console.log('paramas: ' + JSON.stringify(params));
		calendar.getAppointments(auth, user, params, function(appointments) {
			//console.log('appts: ' + appointments);

			var APPOINTMENTS_FILE = APPOINTMENTS_PATH + project + '-appointments.json';
			fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(appointments), 'utf8');
			console.log('Appointments are successfully synched');
			logger.info('Appointments are successfully synched');
			callback(appointments);
		});
	}
	
	function addAppointment (project, appointment, callback) {
		var APPOINTMENTS_FILE = APPOINTMENTS_PATH + project + '-appointments.json';

		var attendees = [];
		var email = {email: appointment.email};
		attendees.push(email);
		var entry = {
			start: {dateTime: moment(appointment.startDateTime).format('lll')},
			end: {dateTime: moment(appointment.endDateTime).format('lll')},
			summary: appointment.summary,
			attendees: attendees
		};		

		console.log('Checking file exists ' + APPOINTMENTS_FILE);
		if (fs.existsSync (APPOINTMENTS_FILE) == true) {
			fs.readFile(APPOINTMENTS_FILE, 'utf8', function(err, data) {;
				var obj;
				if (data != "")
					obj = JSON.parse(data);
				else
					obj = {};
				
				obj.unshift(entry);
				fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(obj), 'utf8');
				console.log('Appointment is successfully added');
				callback();
				return;
			});
		} else {
			var array = [];
			array.push(entry);
			console.log(APPOINTMENTS_FILE);
			logger.debug(APPOINTMENTS_FILE);
			console.log('writing file '  + JSON.stringify(array));
			logger.info('writing file '  + JSON.stringify(array));
			fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(array), 'utf8');
			console.log('Appointment file is created and entry is added');
			logger.info('Appointment file is created and entry is added');
			callback();
			return;
		}
	}
	
	// Get list of appointments from the file
	app.get('/appointments/:project', function(req, res) {
		var project = req.params.project;
		if (project == null) {
			console.log('No project is specified');
			logger.error('No project is specified');
			res.json({});
			return;
		}

		var auth = utils.getAuth(req);
		var owner = tenants.tenantService.getOwner(project);

		if (project != '' && auth != null && owner != '') {
			console.log('Refreshing Appointments');
			refreshAppointments(project, auth, owner, function(appts) {
				res.json(appts);
				return;
			});
			return;
		}
		
		var APPOINTMENTS_FILE = APPOINTMENTS_PATH + project + '-appointments.json';
		if (fs.existsSync (APPOINTMENTS_FILE) == true) {
			fs.readFile(APPOINTMENTS_FILE, 'utf8', function(err, data) {
				if (err) {
					console.log('Error in reading Appointment File ' + err);
					logger.error('Error in reading Appointment File ' + err);
				} else {
					if (data == "" || data == null || data == undefined) {
						console.log('No appointments');
						logger.error('No appointments');
						res.json({});
					}
					else {
						var obj = JSON.parse(data);
						res.json(obj);
					}
				}
			});
		} else
			res.json({});
	});

	// Get list of appointments from calendar
	app.get('/patientAppointments', function(req, res) {
		var project = utils.getProject(req);
		var user = utils.getUser(req);
		var auth = utils.getAuth(req);
		if (project == null || user == null) {
			console.log('No Project or user given for the patientAppointments');
			logger.error('No Project or user given for the patientAppointments');
			res.json({});
			return;
		}
		
		console.log('Fetching the appointments for past and next two weeks');
		logger.info('Fetching the appointments for past and next two weeks');
		var lastweek = moment().subtract(2, 'weeks');
		var nextweek = moment().add(2, 'weeks');

		var params = {
			timeMin: moment(lastweek).format("YYYY-MM-DDTHH:mm:ssZ"),
			timeMax: moment(nextweek).format("YYYY-MM-DDTHH:mm:ssZ") 
		};
		
		var owner = tenants.tenantService.getOwner(project);
		calendar.getAppointments(auth, owner, params, function(appointments) {
			console.log('Successfully fetched appointments for four weeks');
			logger.info('Successfully fetched appointments for four weeks');
			var patientAppts = [];
			for (var ii = 0; ii < appointments.length; ii++) {
				var summary = appointments[ii].summary;
				if (summary == null || summary == '' ||
					appointments[ii].start == undefined || appointments[ii].end == undefined)
					continue;
				summary = summary.split('|');
				
				patientAppts.push({
					regId: summary[0],
					name: summary[1],
					date: appointments[ii].start.dateTime,
					startDateTime: moment(appointments[ii].start.dateTime).format('lll'),
					endDateTime: moment(appointments[ii].end.dateTime).format('lll')
				});
			}
			
			function compare (a, b) {
				var diff = moment(a.date).diff(moment(b.date));
				return diff;
			}
			patientAppts.sort(compare);
			//console.log(patientAppts);
			res.json(patientAppts);
		});
	});

	app.post('/appointment/:project', function(req, res) {
		var project = req.params.project;
		if (project == null) {
			console.log('No project given for creating the appointment');
			res.json({});
			return;
		}
		
		var _this = this;
		var appointment = req.body;
		console.log('New appointment request: ' + JSON.stringify(appointment));
		var owner = tenants.tenantService.getOwner(project);

		var user = utils.getUser(req);
		var auth = utils.getAuth(req);
		if (user == null || auth == null) { // From Patient: Mailer
			console.log('Appointment is requested by the patient');
			mailer.sendInvite(owner, appointment);
			addAppointment (project, appointment, function (){
				console.log('Appointment is successfully created and updated in file');
				res.json({});
				return;
			});
		} else {
			calendar.createAppointment(auth, owner, appointment, function(error) {
				if(error) {
					console.log('Error in creating appointment: ' + error);
					return;
				} else {
					refreshAppointments (project, auth, owner, function (appts){
						console.log('Appointment is successfully created and synched');
						res.json({});
						return;
					});
				}
			});
		}
				
		// From Patient: Implement sms.sendInvite (appointment);
	});
	
	app.delete('/appointment/:appointmentId', function (req, res) {
		var project = utils.getProject(req);
		var user = utils.getUser(req);
		if (project == null || user == null) {
			console.log('No Project or user given for deleting appointment');
			res.json({});
			return;
		}
		
		var appointmentId = req.params.appointmentId;
		if (appointmentId == null || appointmentId == undefined)
			res.json({});
		
		console.log('Deleting the appointment: ' + appointmentId);
		var auth = utils.getAuth(req);
		var owner = tenants.tenantService.getOwner(project);
		calendar.deleteAppointment(auth, owner, appointmentId, function(error) {
			if(error) {
				console.log('Error in deleting the appointment');
				res.json({});
				return;
			}
			refreshAppointments (project, auth, owner, function(appts) {
				console.log('Appointment is successfully deleted and synched');
				res.json({});
			});
		});
	});
};

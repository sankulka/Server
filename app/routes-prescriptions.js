'use strict';

var fs = require('fs');
var moment = require('moment');
var utils = require('./utils');
var PRESCRIPTIONS_PATH = './public/prescriptions/';

module.exports = function (app) {

	// Get list of activities for the given patient
	app.get('/ppp', function(req, res) {
		var project = utils.getProject(req);
		if (project == null) {
			console.log('Session is not initialized for the user');
			res.json({});
			return;
		}
		
		var PRESCRIPTIONS_FILE = PRESCRIPTIONS_PATH + project + '-pres.json';
		
		fs.exists(PRESCRIPTIONS_FILE, function(exists) {
			if(exists) {
				fs.readFile(PRESCRIPTIONS_FILE, 'utf8', function(err, data) {
					if (err) {
						console.log('Error in reading Prescriptions File ' + err);
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
	});
	
	// Create the Prescription for a given patient
	function addPrescription (project, date, name, treatments) {
		var prescription = {
			'date': date,
			'dateTime': moment(date).format('lll'),
			'name': name,
			'treatments': treatments
		};
		
		var PRESCRIPTIONS_FILE = PRESCRIPTIONS_PATH + project + '-pres.json';
		fs.exists(PRESCRIPTIONS_FILE, function(exists) {
			if(exists) {
				fs.readFile(PRESCRIPTIONS_FILE, 'utf8', function(err, data) {
					if (err) {
						console.log('Error in reading Prescriptions File ' + err);
					} else {
						var obj;
						if (data != "") {
							obj = JSON.parse(data);
							var creationDate = obj[0].date;
							if (moment().diff(creationDate, 'days') > 1)
								obj = {};
						}
						else
							obj = {};
						
						obj.unshift(prescription);
						fs.writeFile(PRESCRIPTIONS_FILE,
							JSON.stringify(obj), 'utf8');
						console.log('Prescription is appended to the file');
					}
				});
			}
			else {
				var obj = [];
				obj.push(prescription);
				fs.writeFile(PRESCRIPTIONS_FILE,
					JSON.stringify(obj), 'utf8');
				console.log('Prescriptions file is created');
			}
		});
	}
}
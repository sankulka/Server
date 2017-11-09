'use strict';

var moment = require('moment');
var chronic = require('./models/chronic');
var sheet = require('./models/sheet');
var utils = require('./utils');

module.exports = function (app) {
	
	// Post the notes for the given patient
	app.post('/notes/:patientId', function(req, res) {
		var patientId = req.params.patientId;
		var project = utils.getProject(req);
		if (project == null) {
			console.log('Session is not initialized for the user');
			res.json({});
			return;
		}
		
		console.log('Adding notes for the patient: ' + patientId);
		var folderDetails = chronic.cacheService.getPatientFolderDetails(project, patientId);
		if(folderDetails.details == undefined || folderDetails.details == "") {
			console.log('Cache is not yet initialized.');
			res.json({});
		}		
		
		var rowEntry = [];
		rowEntry.push(new moment().format('YYYY-MM-DDTHH:mm:ssZ'));
		rowEntry.push('Notes');
		rowEntry.push(req.body.note);

		var auth = utils.getAuth(req);
		sheet.appendRow(auth, folderDetails.details, 'Activities', rowEntry, function() {
			console.log('Notes added in Activities sheet');
			res.json({});
		});
	});
};
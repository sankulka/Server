'use strict';

var moment = require('moment');
var cache = require('./cache');
var sheet = require('./models/sheet');
var chronic = require('./models/chronic');
var payment = require('./models/payment');
var utils = require('./utils');
var prescriptions = require('./models/prescriptions');

module.exports = function (app) {

	// Post the Followup for the given patient
	app.post('/followup/:patientId', function(req, res) {
		var patientId = req.params.patientId;
		var project = utils.getProject(req);
		if (project == null) {
			console.log('Session is not initialized for the user');
			res.json({});
			return;
		}
		
		console.log('Adding followup for the patient: ' + patientId);
		var info = chronic.cacheService.getPatientNamePhoneFolderDetails(project, patientId);
		if(info.folder == undefined || info.folder == "") {
			console.log('Chronic cache is not yet initialized.');
			res.json({});
		}
		
		var masterSheet = cache.cacheService.getMasterSheet(project);
		if(masterSheet == undefined || masterSheet == "") {
			console.log('Cache is not yet initialized.');
			res.json({});
			return;
		}		
		
		var auth = utils.getAuth(req);
		var now = new moment().format('YYYY-MM-DDTHH:mm:ssZ');				
		var billing = req.body.billing;
		if (billing != null && billing != undefined && billing.raised > 0) {
			var paymentEntry = [];
			paymentEntry.push(now);
			paymentEntry.push(info.phone);
			paymentEntry.push(info.name);
			paymentEntry.push(JSON.stringify(billing));

			var newPRow = payment.cacheService.getPaymentLength(project) + 1;
			sheet.appendRow(auth, masterSheet, 'Payment!A' + newPRow + ':D' + newPRow,
				paymentEntry, function() {
				payment.cacheService.addRecord(project, paymentEntry);
				console.log('Payment Entry is added in Payment sheet');
			});
		}
		
		prescriptions.addPrescription(project, now, info.name, req.body.followup.treatments);

		var rowEntry = [];
		rowEntry.push(now);
		rowEntry.push('Followup');
		rowEntry.push(JSON.stringify(req.body.followup));

		var auth = utils.getAuth(req);
		sheet.appendRow(auth, info.details, 'Activities', rowEntry, function() {
			console.log('Followup added in Activities sheet');
			res.json({});
		});
	});
};
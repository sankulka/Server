'use strict';

var async = require('async');
var moment = require('moment');
var cache = require('./cache');
var utils = require('./utils');
var chronic = require('./models/chronic');
var googleapis = require('googleapis');
var drive = require('./models/drive');
var sheet = require('./models/sheet');
var driveService = googleapis.drive('v3');

module.exports = function (app) {

/*
0	A RegID
1	B Salutation
2 	C Name
3 	D Gender
4	E Reference
5 	F PhoneNumber
6 	G Email
7 	H DOB
8 	I Complaints
9 	J Address
10 	K Date
11	L FolderId
12  M DetailsId
13	N FilesId
*/

	function getPatientFromRow(row) {
		var patient = {
			id: row[0],
			salutation: row[1],
			name: row[2],
			gender: row[3],
			reference: row[4],
			phone: row[5],
			email: row[6],
			dob: row[7],
			complaints: JSON.parse(row[8]),
			address: row[9]
		}
		return patient;
	}
	
	function getRowFromPatient(patient) {
		var row = [];
		row.push(patient.id);
		row.push(patient.salutation);
		row.push(patient.name);
		row.push(patient.gender);
		row.push(patient.reference);
		row.push(patient.phone);
		row.push(patient.email);
		row.push(patient.dob);
		row.push(JSON.stringify(patient.complaints));
		row.push(patient.address);
		return row;
	}
	
	// Get personal information for all patients
	app.get('/patients', function(req, res) {
		var project = utils.getProject(req);
		if (project == null) {
			console.log('Session is not initialized for the user');
			res.json({});
			return;
		}
		
		console.log('Getting the list of all patients');
		var rows = [];
		var patients = chronic.cacheService.getChronicCache(project);
		for (var ii = 0; ii < patients.length; ii++) {
			var entry = {
				'regId' : patients[ii][0],
				'name' : patients[ii][2],
				'reference' : patients[ii][4],
				'phone' : patients[ii][5],
				'email': patients[ii][6],
				'complaints' : JSON.parse(patients[ii][8]),
				'date' : patients[ii][10]
			};
			rows.push(entry);
		}
		res.json(rows);
	});
	
	// Get details of the given patient
	app.get('/patients/:patientId', function (req, res) {
		var project = utils.getProject(req);
		if (project == null) {
			console.log('Session is not initialized for the user');
			res.json({});
			return;
		}
		
		var patientId = req.params.patientId;
		console.log('Getting details of the patient: ' + patientId);
		var patients = chronic.cacheService.getChronicCache(project);
		var patient = [];
		for (var ii = 0; ii < patients.length; ii++)
			if (patients[ii][0] == patientId) {
				patient = getPatientFromRow(patients[ii]);
				break;
			}
		res.json(patient);
	});

	// Create new patient or Update existing one
	app.post('/patients', function(req, res) {
		var project = utils.getProject(req);
		if (project == null) {
			console.log('Session is not initialized for the user');
			res.json({});
			return;
		}
		
		var patient = req.body;
		var currentId = patient.id;
		var auth = utils.getAuth(req);
		if(currentId != undefined && currentId != '') {
			// Updating existing Patient
			var masterSheet = cache.cacheService.getMasterSheet(project);
			if(masterSheet == undefined || masterSheet == "") {
				console.log('Chronic cache is not initialized for the user');
				res.json({});
				return;
			}
			
			var currentPatient = getRowFromPatient(patient);
			var row = parseInt(currentId.split('-')[1]);
			if (row == undefined || row == NaN) {
				console.log('Could not find the patient in the cache');
				res.json({});
				return;
			}

			var range = 'Chronic!A' + (row) + ':J' + (row);
			sheet.updateRow(auth, masterSheet, range, currentPatient, function() {
				console.log('Sheet is updated. Updating the cache now');
				var cachePatient = chronic.cacheService.getPatientById(project, currentId);
				for (var ii = 0; ii < 10; ii++)
					cachePatient[ii] = currentPatient[ii];
				chronic.cacheService.updatePatient(project, cachePatient);
				res.json(currentId);
			});
		} else {
			//Creating new Patient
			var folderName = chronic.cacheService.getNewPatientId(project);
			//var initial = tenants.tenantService.getInitial(project);
			//var folderName = initial + '-' + newId;
			var patientsFolder = cache.cacheService.getPatientsFolder(project);
			if(patientsFolder == undefined || patientsFolder == "") {
				console.log('Cache is not yet initialized.');
				res.json({});
				return;
			}

			console.log('Creating: ' + folderName + ' in ' + patientsFolder);
			var metaData = {
				'name': folderName,
				'parents': [patientsFolder],
				'mimeType': 'application/vnd.google-apps.folder'
			};
			driveService.files.create({
				auth: auth,
				resource: metaData,
				fields: 'id'
			}, function(err, folder) {

				// Handle error for null folder
				if (folder == undefined || folder == null) {
					console.log ("Error in creating folder: " + err);
					return;
				}
			
				console.log('New FolderID: ' + folder.id);
				var masterSheet = cache.cacheService.getMasterSheet(project);
				var detailsTemplate = cache.cacheService.getDetailsTemplate(project);
				var newDetails = folderName + '-Details';
				var newDetailsId = '';
				var filesId = '';
				
				function setNewDetailsId(id) {
					newDetailsId = id;
				}
				
				var filesMetaData = {
					'name': 'files',
					'parents': [folder.id],
					'mimeType': 'application/vnd.google-apps.folder'
				};
				
				function setFilesId(id) {
					filesId = id;
				}
						
				function updateMasterSheetFile() {
					patient['id'] = folderName;
					var rowEntry = getRowFromPatient(patient);
					rowEntry.push(new moment().format('YYYY-MM-DDTHH:mm:ssZ'));
					rowEntry.push(folder.id)
					rowEntry.push(newDetailsId);
					rowEntry.push(filesId);
					
					var row = parseInt(folderName.split('-')[1]);
					var range = 'Chronic!A' + (row) + ':N' + (row);
					sheet.appendRow(auth, masterSheet, range, rowEntry, function() {
						console.log('Master Sheet is updated. Updating the cache now');
						chronic.cacheService.addNewPatient(project, rowEntry);
						res.json(folderName);
					});
				}
							
				var templates = [
					[newDetails, detailsTemplate, setNewDetailsId],
					[null, null, setFilesId]
				];
				async.each(templates, function(template, callback) {
					if (template[0] == null) { //Creating files folder
						driveService.files.create({
							auth: auth,
							resource: filesMetaData,
							fields: 'id'}, function(err, filesFolder) {
							template[2](filesFolder.id);
							callback();
						});
					} else { //Copying Details Template
						drive.copyFile(auth, template[1], template[0], folder.id, function(id) {
						console.log(template[0] + ' : '	+ id);
							template[2](id);
							callback();
						});
					}
				}, function (error) {
					updateMasterSheetFile();
				});
			});
		}
	});
};

/*
Real example to perform multiple similar tasks one after another and then final callabck
				function setCaseId(id) {
					newCaseId = id;
				}
				function setNewDetailsId(id) {
					newDetailsId = id;
				}
				var templates = [
					[newDetails, detailsTemplate, setNewDetailsId]
					[newCase, caseTemplate, setCaseId]
				];
				async.each(templates, function(template, callback) {
					drive.copyFile(template[1], template[0], folder.id, function(newId) {
					console.log(template[0] + ' : '	+ newId);
						template[2](newId);
						callback();
					});
				}, function (error) {
					updateMasterSheetFile();
				});
*/

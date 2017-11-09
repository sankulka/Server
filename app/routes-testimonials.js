'use strict';

var fs = require('fs');
var async = require('async');
var moment = require('moment');
var mime = require('mime-types')
var utils = require('./utils');
var chronic = require('./models/chronic');
var googleapis = require('googleapis');
var driveService = googleapis.drive('v3');
var TESTIMONIAL_PATH = './public/testimonials/';
var TESTIMONIAL_FILE = 'testimonial.json';

module.exports = function (app) {

	/* Only downloads the files from Google to the server path */
	app.post('/testimonialFiles', function(req, res) {
		
		var fileInput = req.body.fileInput;
		if (fileInput == null || fileInput == undefined) {
			res.json({});
			return;
		}
	
		fs.readdir(TESTIMONIAL_PATH, function (err, files) {
			for (var ii = 0; ii < files.length; ii++ ) {
				var file = TESTIMONIAL_PATH + files[ii];
				fs.unlink(file);
			}
		});
		
		var files = fileInput.files;
		var fileIds = fileInput.fileIds;
		if (files == null || files == undefined || fileIds == null || fileIds == undefined) {
			res.json({});
			return;
		}

		var array = [];
		for (var ii = 0; ii < files.length; ii++) {
			var entry = {
				name: files[ii],
				id: fileIds[ii]
			}
			array.push(entry);
		}
		
		var auth = utils.getAuth(req);
		async.each(array, function(entry, callback) {
			var fileName = entry.name;
			var fileId = entry.id;
			var dest = fs.createWriteStream(TESTIMONIAL_PATH + fileName);	

			driveService.files.get({'auth': auth, fileId: fileId, alt: 'media'})		
			.on('end', function() {
				console.log(fileName + ' downloaded for Testimonial');
				callback();
			})
			.on('error', function(err) {
				console.log('Error during creating file for Testimonial', err);
			})
			.pipe(dest);
			
		}, function (error) {
			if (error)
				console.log('Error in downloading testimonial file: ' + error);
			console.log('All files are downloaded for testimonial');
			res.json({});
		});
	});

	app.get('/testimonialFile/:fileName', function(req, res) {
		var fileName = req.params.fileName;
		var file = TESTIMONIAL_PATH + fileName;
		var contentType = 'utf8';
		var size = 0;
		
		if (fs.existsSync(file) == true) {
			size = fs.statSync(file).size;
			contentType = mime.lookup(fileName);
		}

		console.log('Sending file ' + file);
		res.writeHead(200, {
			'Content-Type': contentType,
			'Content-Length': size,
			'Content-Disposition': fileName
		});
		
		var dest = fs.readFileSync(file);
		res.write(dest);
		res.end();
	});

	/*
	app.get('/testimonials/:project', function(req, res) {
		var project = req.params.project;
		if (project == '')
			res.json({});
		
		var projectTest = TESTIMONIAL_PATH + project + '/';
		var file = projectTest + TESTIMONIAL_FILE;
		fs.exists(file, function(exists) {
			if(exists) {
				fs.readFile(file, 'utf8', function(err, data) {
					if (err) {
						console.log('Error in reading Testimonial File ' + err);
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
	
	app.delete('/testimonial/:date', function(req, res) {
		var date = req.params.date;
		if (date == null)
			res.json({});
		
		var project = utils.getProject(req);
		var role = utils.getRole(req);
		if (project == null || role != 'owner') {
			console.log('Session is not initialized for the user');
			res.json({});
			return;
		}

		var projectTest = TESTIMONIAL_PATH + project + '/';
		var file = projectTest + TESTIMONIAL_FILE;
		console.log('Deleting the Testimonial for date: ' + date);
		fs.exists(file, function(exists) {
			if(exists) {
				fs.readFile(file, 'utf8', function(err, data) {
					if (err) {
						console.log('Error in reading Testimonial File ' + err);
					} else {
						var newRows = [];
						var existingRows = JSON.parse(data);
						if (existingRows == null || existingRows.length == 0)
							res.json({});
						
						for (var ii = 0; ii < existingRows.length; ii++) {
							if (existingRows[ii].date == date) {
								var filesToDelete = existingRows[ii].files;
								for (var jj = 0; jj < filesToDelete.length; jj++) {
									var fileToDelete = projectTest + filesToDelete[jj];
									fs.unlink (fileToDelete, function(error) {
										if (error)
											console.log('Error in deleting the file');
										else 
											console.log('Successfully deleted the file: ' + fileToDelete);
									});
								}
							} else
								newRows.push(existingRows[ii]);
						}
						fs.writeFile(file,
							JSON.stringify(newRows), 'utf8');
						console.log('Testimonial file is updated');

						res.json({});
					}
				});
			}
		});
	});
	

	// Create the Testimonial for a given patient
	app.post('/testimonials/:patientId', function(req, res) {
		var project = utils.getProject(req);
		var role = utils.getRole(req);
		if (project == null || role != 'owner') {
			console.log('Session is not initialized for the user');
			res.json({});
			return;
		}
		
		var auth = utils.getAuth(req);
		var projectTest = TESTIMONIAL_PATH + project + '/';

		if (fs.existsSync(projectTest) == false)
			fs.mkdirSync(projectTest)
		
		var patientId = req.params.patientId;
		console.log('Creating Testimonial for the patient: ' + patientId);
		var activities = req.body;
		var notes = [];
		var files = [];
		for (var ii = 0; ii < activities.length; ii++) {
			var activity = activities[ii];
			switch(activity[1]) {
				case 'Notes':
					notes.push(activity[2]);
				break;
				default: // this is for all images/pdf
					var fileId = activity[3];
					var fileName = patientId + '-' + activity[2];
					var dest = fs.createWriteStream(projectTest + fileName);

					driveService.files.get({'auth': auth, fileId: fileId, alt: 'media'})		
					.on('end', function() {
						console.log(fileName + ' got for Testimonial');
					})
					.on('error', function(err) {
						console.log('Error during creating file for Testimonial', err);
					})
					.pipe(dest);

					files.push(fileName);
				break;
			}
		}
		
		var complaints = JSON.parse(chronic.cacheService.getComplaintsById (project, patientId));
		var primaryCom = complaints.primaryCom;
		var secondaryCom = complaints.secondaryCom;
	
		var heading;
		if (secondaryCom != '' && primaryCom != '')
			heading = primaryCom + ', ' + secondaryCom;
		else if (primaryCom != '')
			heading = primaryCom;
		else
			heading = "Testimonial";

		var rowEntry = {
			'date': new moment().format('YYYY-MM-DDTHH:mm:ssZ'),
			'heading': heading,
			'notes': notes,
			'files': files
		};

		var file = projectTest + TESTIMONIAL_FILE;	
		if(fs.existsSync(file)) {
			fs.readFile(file, 'utf8', function(err, data) {
				if (err) {
					console.log('Error in reading Testimonial File ' + err);
				} else {
					var obj;
					if (data != "")
						obj = JSON.parse(data);
					else
						obj = {};
					
					obj.unshift(rowEntry);
					fs.writeFile(file,
						JSON.stringify(obj), 'utf8');
					console.log('Testimonial is appended to the file');
				}
			});
		} else {
			var obj = [];
			obj.push(rowEntry);
			fs.writeFile(file, JSON.stringify(obj), 'utf8');
			console.log('Testimonial file is created');
		}
		res.json({});
	});
	*/
};
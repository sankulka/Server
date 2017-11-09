'use strict';

var fs = require('fs');
var sessions = require('./sessions');
var formidable = require('formidable');
var moment = require('moment');
var utils = require('./utils');
var GALLERY_PATH = './public/gallery/';

module.exports = function (app) {

	// Get list of activities for the given patient
	app.get('/galleryy/:project', function(req, res) {
		var project = req.params.project;
		if (project == '')
			res.json({});
		
		var projectGallery = GALLERY_PATH + project + '/';
		fs.readdir(projectGallery, function(error, list) {
			if(error) {
				console.log('Error in getting gallery files: ' + error);
			} else {
				if (list == null || list == undefined || list == "")
					res.json({});
				else {
					var files = [];
					for (var ii = 0; ii < list.length; ii++)
						files.push(list[ii]);
					res.json(files);
				}
			}
		});
	});
	
	app.delete('/galleryy/:file', function(req, res) {
		var project = utils.getProject(req);
		var role = utils.getRole(req);
		if (project == null || role != 'owner') {
			console.log('Session is not initialized for the user');
			res.json({});
			return;
		}

		var file = req.params.file;
		if (file == null)
			res.json({});
		
		var projectGallery = GALLERY_PATH + project + '/';
		console.log('Deleting the Gallery file: ' + projectGallery + file);
		fs.unlink (projectGallery + file, function(error) {
			if (error)
				console.log('Error in deleting the file');
			else
				console.log('Successfully deleted the file: ' + file);
			res.json({});
		});
	});

	// Create the Testimonial for a given patient
	app.post('/galleryy/', function(req, res) {
		var project = utils.getProject(req);
		var role = utils.getRole(req);
		if (project == null || role != 'owner') {
			console.log('Session is not initialized for the user');
			res.json({});
			return;
		}
		
		var projectGallery = GALLERY_PATH + project + '/';
		if (fs.existsSync(projectGallery) == false)
			fs.mkdirSync(projectGallery)

		// create an incoming form object
		var form = new formidable.IncomingForm();
		form.parse(req, function (err, fields, files) {
			console.log('Uploading File to Gallery: ' + files.file.name);
		
			fs.readFile(files.file.path, function(err, data) {
				fs.writeFile(projectGallery + files.file.name, data, 'binary', function (err) {
					if (err)
						console.log("Error in uploading file in gallery")
					else
						console.log("File is successfully uploaded in gallery")
					res.json({});
				});
			});
		});
	});
};
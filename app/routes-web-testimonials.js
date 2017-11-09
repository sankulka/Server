'use strict';

var fs = require('fs');
var async = require('async');
var moment = require('moment');
var mime = require('mime-types')
var TESTIMONIAL_PATH = './public/testimonials/';
var TESTIMONIAL_FILE = TESTIMONIAL_PATH + 'testimonial.json';

module.exports = function (app) {

	app.get('/webTestimonials/', function(req, res) {
		if (fs.existsSync(TESTIMONIAL_FILE) {
			fs.readFile(TESTIMONIAL_FILE, 'utf8', function(err, data) {
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
		} else 
			res.json({});
	});
	
	app.delete('/webTestimonial/:date', function(req, res) {
		var date = req.params.date;
		if (date == null) {
			res.json({});
			return;
		}
		
		var role = request.headers.role;
		if (role != 'owner') {
			console.log('Insufficient permission to delete Testimonial');
			res.json({});
			return;
		}

		console.log('Deleting the Testimonial for date: ' + date);
		if (fs.existsSync(TESTIMONIAL_FILE) {
			fs.readFile(TESTIMONIAL_FILE, 'utf8', function(err, data) {
				if (err)
					console.log('Error in reading Testimonial File ' + err);
				else {
					var newRows = [];
					var existingRows = JSON.parse(data);
					if (existingRows == null || existingRows.length == 0) {
						res.json({});
						return;
					}
					
					for (var ii = 0; ii < existingRows.length; ii++) {
						if (existingRows[ii].date == date) {
							var filesToDelete = existingRows[ii].files;
							for (var jj = 0; jj < filesToDelete.length; jj++) {
								var fileToDelete = TESTIMONIAL_PATH + filesToDelete[jj];
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
					fs.writeFile(TESTIMONIAL_FILE, JSON.stringify(newRows), 'utf8');
					console.log('Testimonial file is updated');
					res.json({});
				}
			});
		}
	});
	
	// Post the Testimonial entry
	app.post('/webTestimonial/', function(req, res) {
		var role = utils.getRole(req);
		if (role != 'owner') {
			console.log('Insufficient permission to post Testimonial');
			res.json({});
			return;
		}
		
		if (fs.existsSync(TESTIMONIAL_PATH) == false)
			fs.mkdirSync(TESTIMONIAL_PATH)

		var rowEntry = req.body;

		if(fs.existsSync(TESTIMONIAL_FILE)) {
			fs.readFile(TESTIMONIAL_FILE, 'utf8', function(err, data) {
				if (err)
					console.log('Error in reading Testimonial File ' + err);
				else {
					var obj;
					if (data != "")
						obj = JSON.parse(data);
					else
						obj = {};
					
					obj.unshift(rowEntry);
					fs.writeFile(TESTIMONIAL_FILE, JSON.stringify(obj), 'utf8');
					console.log('Testimonial is appended to the file');
				}
			});
		} else {
			var obj = [];
			obj.push(rowEntry);
			fs.writeFile(TESTIMONIAL_FILE, JSON.stringify(obj), 'utf8');
			console.log('Testimonial file is created');
		}
		res.json({});
	});
};
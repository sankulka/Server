'use strict';

var googleapis = require('googleapis');
var driveService = googleapis.drive('v3');

var drive = module.exports = {
	
	getIdByName : function (auth, folder, fileName, callback) {
		var params = {
			auth: auth,
			q: 'name contains \'' + fileName + '\' and \'' + folder + '\' in parents',
			fields: 'files/id'
		};
		driveService.files.list(params, function(error, response) {
			if (error || response == null) {
				console.log('The API returned an error: ' + error);
			}
			var files = response.files;
			var fileId = '';
			if (files.length == 0) {
				error = 'No files found.';
				console.log(error);
			}
			else
				fileId = files[0].id;
			callback(error, fileId);
		});
	},
	
	createfile : function (auth, fileName, folder, callback) {
		var metaData = {
			'name': fileName,
			'parents': [folder],
			'mimeType': 'application/vnd.google-apps.spreadsheet'
		};
		driveService.files.create({
			auth: auth,
			resource: metaData,
			fields: 'id'
		}, function (error, file) {
			console.log('New file successfully created: ' + file.id);
			callback(file.id);
		});
	},
	
	copyFile : function (auth, origFileId, newFileName, toFolder, callback) {
		var metaData = {
			'name': newFileName,
			'parents': [toFolder],
			'mimeType': 'application/vnd.google-apps.file'
		};
		driveService.files.copy({
			auth: auth,
			fileId: origFileId,
			resource: metaData,
			fields: 'id'
		}, function (error, file) {
			console.log('Copy successful. New Id: ' + file.id);
			callback(file.id);
		});		
	}
};
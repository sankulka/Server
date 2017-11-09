'use strict';

var googleapis = require('googleapis');
var sheetService = googleapis.sheets('v4');

var sheet = module.exports = {
	
	getRows : function(auth, fileId, range, callback) {
		console.log('Getting rows from fileID: ' + fileId, ' range: ' + range);
		
		sheetService.spreadsheets.values.get({
			auth: auth,
			spreadsheetId: fileId,
			range: range,
			}, function(err, response) {
				if (err) {
					console.log('The API returned an error: ' + err);
				} else
					callback(response.values);
			}
		);
	},
	
	appendRow : function(auth, fileId, range, row, callback) {
		console.log('Adding new row: ' + fileId + row);
		
		sheetService.spreadsheets.values.append({
			auth: auth,
			spreadsheetId: fileId,
			range: range,
			valueInputOption: 'USER_ENTERED',
			insertDataOption: 'INSERT_ROWS',
			resource: {
				"values": [row]
			}
		}, function(error, response) {
			if (error)
				console.log('The Append returned an error: ' + error);
			else {
				callback();
			}
		});
	},

	updateRow : function(auth, fileId, range, row, callback) {
		console.log('Updating the row: ' + fileId + row);
		
		sheetService.spreadsheets.values.update({
			auth: auth,
			spreadsheetId: fileId,
			range: range,
			valueInputOption: 'USER_ENTERED',
			resource: {
				"values": [row]
			}
		}, function(error, response) {
			if (error)
				console.log('The Update returned an error: ' + error);
			else {
				callback();
			}
		});
	},
	
	
	updateRows : function(auth, fileId, range, rows, callback) {
		console.log('Updating the row: ' + fileId + rows);
		
		sheetService.spreadsheets.values.update({
			auth: auth,
			spreadsheetId: fileId,
			range: range,
			valueInputOption: 'USER_ENTERED',
			resource: {
				"values": rows
			}
		}, function(error, response) {
			if (error)
				console.log('The Update returned an error: ' + error);
			else {
				callback();
			}
		});
	}
};
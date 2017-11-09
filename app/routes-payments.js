'use strict';

var moment = require('moment');
var payment = require('./models/payment');
var sheet = require('./models/sheet');
var cache = require('./cache');
var utils = require('./utils');

/*
0	A	Date
1	B	Phone
2	C	Name
3	D	Billing
*/

module.exports = function (app) {
	
	// Get all the payment entries
	app.get('/payments', function(req, res) {
		console.log('Getting the list of all payment');
		var project = utils.getProject(req);
		if (project == null) {
			console.log('Session is not initialized for the user');
			res.json({});
			return;
		}	
		
		var records = [];
		var rows = payment.cacheService.getPaymentCache(project);
		console.log('Number of payment records: ' + rows.length);
		for (var ii = rows.length-1; ii >= 0; ii--) {
			var record = {
				'date': rows[ii][0],
				'dateTime': moment(rows[ii][0]).format('lll'),
				'phone': rows[ii][1],
				'name': rows[ii][2],
				'billing': JSON.parse(rows[ii][3])
			};
			records.push(record);
		}
		res.json(records);
	});
	
	// Post the Payment Entry
	app.post('/payments/', function(req, res) {
		var project = utils.getProject(req);
		if (project == null) {
			console.log('Session is not initialized for the user');
			res.json({});
			return;
		}

		var masterSheet = cache.cacheService.getMasterSheet(project);
		if(masterSheet == undefined || masterSheet == "") {
			console.log('Cache is not yet initialized.');
			res.json({});
		}
		
		var record = req.body;
		if (record == null || record == undefined) {
			console.log('Empty record entry');
			res.json({});
		}
		
		var now = new moment().format('YYYY-MM-DDTHH:mm:ssZ');
		var auth = utils.getAuth(req);
		// --> Optimize Range for only two columns
		if (record.update) {
			sheet.getRows(auth, masterSheet, 'Payment', function(rows) {
				for (var ii = 0; ii < rows.length; ii++) {
					if (rows[ii][0] == record.date && rows[ii][1] == record.phone) {
						var newRecord = [];
						newRecord.push(record.date);
						newRecord.push(record.phone);
						newRecord.push(record.name);
						newRecord.push(JSON.stringify(record.billing));
						
						var range = 'Payment!A' + (ii+1) + ':D' + (ii+1);
						sheet.updateRow(auth, masterSheet, range, newRecord, function () {
							console.log('Payment entry is updated successfully');
							payment.cacheService.updateRecord(project, newRecord);
							res.json({});
						});
					}
				}
			});
			return;
		}
		
		var rowEntry = [];
		rowEntry.push(now);
		rowEntry.push(record.phone);
		rowEntry.push(record.name);
		rowEntry.push(JSON.stringify(record.billing));
		
		var newPRow = payment.cacheService.getPaymentLength() + 1;
		sheet.appendRow(auth, masterSheet, 'Payment!A' + newPRow + ':D' + newPRow, rowEntry, function() {
			console.log('Payment entry is added successfully');
			payment.cacheService.addRecord(project, rowEntry);
			res.json({});
		});
	});
};

'use strict';

var mcache = require('memory-cache');
var cache = require('../cache');
var sheet = require('./sheet');

/*
0	A Date
1	B Phone
2 	C Name
3 	D BillRaised
4	E BillPaid
5	F Medium
6	G BillUnpaid
*/

var payment = function () {

	return {
		getPaymentCache : function(project) {
			var key = project + 'Payment';
			var paymentCache = mcache.get (key);
			return paymentCache;
		},

		getPaymentLength : function(project) {
			var key = project + 'Payment';
			var paymentCache = mcache.get (key);
			if (paymentCache == undefined || paymentCache == null)
				return 0;
			return paymentCache.length;
		},

		getRecordByDatePhone : function(project, date, phone) {
			var key = project + 'Payment';
			var paymentCache = mcache.get (key);
			for(var ii = 0; ii < paymentCache.length; ii++)
				if(paymentCache[ii][0] == date && paymentCache[ii][1] == phone)
					return paymentCache[ii];
		},
		
		addRecord : function (project, record) {
			var key = project + 'Payment';
			var paymentCache = mcache.get (key);
			paymentCache.push(record);
			mcache.put(key, paymentCache);
		},
		
		updateRecord : function(project, record) {
			var key = project + 'Payment';
			var paymentCache = mcache.get (key);
			for(var ii = 0; ii < paymentCache.length; ii++)
				if(paymentCache[ii][0] == record[0] && paymentCache[ii][1] == record[1]) {
					paymentCache[ii] = record;
					mcache.put(key, paymentCache);
					return;
				}
		},
		
		initialize : function(project, auth, callback) {
			console.log('Initializing payment cache');

			var masterSheet = cache.cacheService.getMasterSheet(project);
			sheet.getRows(auth, masterSheet, 'Payment', function(rows) {
				var key = project + 'Payment';
				if (rows != null && rows != undefined) {
					console.log('Number of payment records cached: ' + rows.length);
					mcache.put(key, rows);
				} else
					mcache.put(key, []);
				callback();
			});
		},

		clear : function(project) {
			var key = project + 'Payment';
			var paymentCache = mcache.get (key);
			mcache.del(key);
		}		
	};
};

exports.cacheService = new payment();

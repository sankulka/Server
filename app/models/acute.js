'use strict';

var mcache = require('memory-cache');
var cache = require('../cache');
var sheet = require('./sheet');

/*
0	A Date
1	B Phone
2 	C Name
3	D Notes
4 	E Followup
*/

var acute = function () {

	return {
		getAcuteCache : function(project) {
			var key = project + 'Acute';
			var acuteCache = mcache.get (key);
			return acuteCache;
		},

		getAcuteLength : function(project) {
			var key = project + 'Acute';
			var acuteCache = mcache.get (key);
			if (acuteCache == undefined || acuteCache == null)
				return 0;
			return acuteCache.length;
		},

		getRecordByDatePhone : function(project, date, phone) {
			var key = project + 'Acute';
			var acuteCache = mcache.get (key);
			for(var ii = 0; ii < acuteCache.length; ii++)
				if(acuteCache[ii][0] == date && acuteCache[ii][1] == phone)
					return acuteCache[ii];
		},
		
		addRecord : function (project, record) {
			var key = project + 'Acute';
			var acuteCache = mcache.get (key);
			acuteCache.push(record);
			mcache.put(key, acuteCache);
		},
		
		updateRecord : function(project, record) {
			var key = project + 'Acute';
			var acuteCache = mcache.get (key);
			for(var ii = 0; ii < acuteCache.length; ii++)
				if(acuteCache[ii][0] == record[0] && acuteCache[ii][1] == record[1]) {
					acuteCache[ii] = record;
					mcache.put(key, acuteCache);
					return;
				}
		},
		
		initialize : function(project, auth, callback) {
			console.log('Initializing acute cache');

			var masterSheet = cache.cacheService.getMasterSheet(project);
			sheet.getRows(auth, masterSheet, 'Acute', function(rows) {
				var key = project + 'Acute';
				if (rows != null && rows != undefined) {
					console.log('Number of acute records cached: ' + rows.length);
					mcache.put(key, rows);
				} else
					mcache.put(key, []);
				callback();
			});
		},
		
		clear : function(project) {
			var key = project + 'Acute';
			var acuteCache = mcache.get (key);
			mcache.del(key);
		}	
	};
};

exports.cacheService = new acute();

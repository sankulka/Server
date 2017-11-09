'use strict';

var mcache = require('memory-cache');
var cache = require('../cache');
var sheet = require('./sheet');
var tenants = require('../../config/tenants');

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

var chronic = function () {
	
	return {
		
		getChronicCache : function(project) {
			var key = project + 'Chronic';
			var chronicCache = mcache.get (key);
			return chronicCache;
		},
		
		getChronicLength : function(project) {
			var key = project + 'Chronic';
			var chronicCache = mcache.get (key);
			if (chronicCache == undefined || chronicCache == null)
				return 0;
			return chronicCache.length;
		},
		
		getEmailAddresses : function(project) {
			var key = project + 'Chronic';
			var chronicCache = mcache.get (key);
			var addresses = [];
			for(var ii = 0; ii < chronicCache.length; ii++) {
				if (chronicCache[ii][6] != '')
					addresses.push(chronicCache[ii][6]);
			}
			return addresses;
		},
		
		getPatientFolderDetails : function(project, id) {
			var key = project + 'Chronic';
			var chronicCache = mcache.get (key);
			for(var ii = 0; ii < chronicCache.length; ii++)
				if(chronicCache[ii][0] == id) {
					var folderDetails = {
						'folder': chronicCache[ii][11],
						'details': chronicCache[ii][12],
						'files': chronicCache[ii][13]
					};
					return folderDetails;
				}
		},

		getPatientNamePhoneFolderDetails : function(project, id) {
			var key = project + 'Chronic';
			var chronicCache = mcache.get (key);
			for(var ii = 0; ii < chronicCache.length; ii++)
				if(chronicCache[ii][0] == id) {
					var folderDetails = {
						'name': chronicCache[ii][2],
						'phone': chronicCache[ii][5],
						'folder': chronicCache[ii][11],
						'details': chronicCache[ii][12]
					};
					return folderDetails;
				}
		},		

		getPatientNameFolderDetailsByEmail : function(project, sender, subjectId) {
			var key = project + 'Chronic';
			var chronicCache = mcache.get (key);
			var patient = null;
			for(var ii = 0; ii < chronicCache.length; ii++)
				if(chronicCache[ii][0] == subjectId) {
					patient = chronicCache[ii];
					break;
				}
			
			if (patient == null) {
				for(var ii = 0; ii < chronicCache.length; ii++)
					if(chronicCache[ii][6] == sender) {
						patient = chronicCache[ii];
						break;
					}
			}
			
			if (patient != null) {
				var pat = {
					'id': patient[0],
					'name': patient[2],
					'folder': patient[11],
					'details': patient[12],
					'files': patient[13]
				};
				return pat;
			}
		},
		
		getComplaintsById : function(project, id) {
			var key = project + 'Chronic';
			var chronicCache = mcache.get (key);
			for(var ii = 0; ii < chronicCache.length; ii++)
				if(chronicCache[ii][0] == id) {
					return chronicCache[ii][8];
				}
		},
		
		getPatientFolderDetailsByEmail : function(project, sender, subject) {
			var key = project + 'Chronic';
			var chronicCache = mcache.get (key);
			for(var ii = 0; ii < chronicCache.length; ii++)
				if(chronicCache[ii][6] == sender ||
					subject.indexOf(chronicCache[ii][0]) >= 0) {
					var folderDetails = {
						'folder': chronicCache[ii][11],
						'details': chronicCache[ii][12]
					};
					return folderDetails;
				}
		},		
		
		getLastPatient : function(project) {
			var key = project + 'Chronic';
			var chronicCache = mcache.get (key);
			return chronicCache[chronicCache.length-1];
		},
		
		getPatientById : function(project, id) {
			var key = project + 'Chronic';
			var chronicCache = mcache.get (key);
			for(var ii = 0; ii < chronicCache.length; ii++)
				if(chronicCache[ii][0] == id)
					return chronicCache[ii];
		},
		
		getPatientByEmail : function(project, email) {
			var key = project + 'Chronic';
			var chronicCache = mcache.get (key);
			for(var ii = 0; ii < chronicCache.length; ii++)
				if(chronicCache[ii][6] == email)
					return chronicCache[ii];
		},
		
		getNewPatientId : function(project) {
			var initial = tenants.tenantService.getInitial(project);
			var key = project + 'Chronic';
			var chronicCache = mcache.get (key);
			if(chronicCache.length == 0)
				return (initial + '-1');

			var lastId = chronicCache[chronicCache.length-1][0];
			var newId = parseInt(lastId.split('-')[1]) + 1;

			return (initial + '-' + newId);
		},
		
		addNewPatient : function (project, patient) {
			var key = project + 'Chronic';
			var chronicCache = mcache.get (key);
			chronicCache.push(patient);
			mcache.put(key, chronicCache);
		},
		
		updatePatient : function(project, patient) {
			var key = project + 'Chronic';
			var chronicCache = mcache.get (key);
			for(var ii = 0; ii < chronicCache.length; ii++)
				if(chronicCache[ii][0] == patient[0]) {
					chronicCache[ii] = patient;
					mcache.put(key, chronicCache);
					return;
				}
		},
		
		getDetailsSheet : function(project, id) {
			var key = project + 'Chronic';
			var chronicCache = mcache.get (key);
			for(var ii = 0; ii < chronicCache.length; ii++)
				if(chronicCache[ii][0] == id)
					return chronicCache[ii][12];			
		},
		
		getFilesId : function(project, id) {
			var key = project + 'Chronic';
			var chronicCache = mcache.get (key);
			for(var ii = 0; ii < chronicCache.length; ii++)
				if(chronicCache[ii][0] == id)
					return chronicCache[ii][13];			
		},
		
		initialize : function(project, auth, callback) {
			console.log('Initializing chronic cache');
			var masterSheet = cache.cacheService.getMasterSheet(project);
			sheet.getRows(auth, masterSheet, 'Chronic', function(rows) {
				var key = project + 'Chronic';
				if (rows != null && rows != undefined) {
					console.log('Number of Chronic records cached: ' + rows.length);
					mcache.put(key, rows);
				} else
					mcache.put(key, []);
				callback();
			});
		},

		clear : function(project) {
			var key = project + 'Chronic';
			var chronicCache = mcache.get (key);
			mcache.del(key);
		}		
	};
};

exports.cacheService = new chronic();

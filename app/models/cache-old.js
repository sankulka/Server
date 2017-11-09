'use strict';

var async = require('async');
var drive = require('./drive');
var sheet = require('./sheet');
var auth = require('../../config/auth');

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

var cache = function () {
	var masterSheet = '';
	var patientsFolder = '';
	var detailsTemplate = '';
	var caseTemplate = '';
	var patientsCache = [];
	
	var setFuncs = {
		PatientMasterSheet: setMasterSheet,
		Patients: setPatientsFolder,
		DetailsTemplate: setDetailsTemplate,
		CaseHistoryMale: setCaseTemplate
	};
	
	function setMasterSheet (id) {
		masterSheet = id;
	}
	
	function setPatientsFolder (id) {
		patientsFolder = id;
	}
	
	function setDetailsTemplate (id) {
		detailsTemplate = id;
	}
	
	function setCaseTemplate (id) {
		caseTemplate = id;
	}
	
	return {		
		getMasterSheet : function() {
			return masterSheet;
		},
		
		getPatientsFolder : function() {
			return patientsFolder;
		},
		
		getDetailsTemplate : function() {
			return detailsTemplate;
		},
		
		getCaseTemplate : function() {
			return caseTemplate;
		},	
		
		getPatientsCache : function() {
			return patientsCache;
		},
		
		setPatientsCache : function(patients) {
			patientsCache = patients;
		},
		
		getEmailAddresses : function() {
			var addresses = [];
			for(var ii = 0; ii < patientsCache.length; ii++) {
				if (patientsCache[ii][6] != '')
					addresses.push(patientsCache[ii][6]);
			}
			return addresses;
		},
		
		getPatientFolderDetails : function(id) {
			for(var ii = 0; ii < patientsCache.length; ii++)
				if(patientsCache[ii][0] == id) {
					var folderDetails = {
						'folder': patientsCache[ii][11],
						'details': patientsCache[ii][12],
						'files': patientsCache[ii][13]
					};
					return folderDetails;
				}
		},

		getPatientNamePhoneFolderDetails : function(id) {
			for(var ii = 0; ii < patientsCache.length; ii++)
				if(patientsCache[ii][0] == id) {
					var folderDetails = {
						'name': patientsCache[ii][2],
						'phone': patientsCache[ii][5],
						'folder': patientsCache[ii][11],
						'details': patientsCache[ii][12]
					};
					return folderDetails;
				}
		},		

		getPatientNameFolderDetailsByEmail : function(sender, subjectId) {
			var patient = null;
			for(var ii = 0; ii < patientsCache.length; ii++)
				if(patientsCache[ii][0] == subjectId) {
					patient = patientsCache[ii];
					break;
				}
			
			if (patient == null) {
				for(var ii = 0; ii < patientsCache.length; ii++)
					if(patientsCache[ii][6] == sender) {
						patient = patientsCache[ii];
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
		
		getComplaintsById : function(id) {
			for(var ii = 0; ii < patientsCache.length; ii++)
				if(patientsCache[ii][0] == id) {
					return patientsCache[ii][8];
				}
		},
		
		getPatientFolderDetailsByEmail : function(sender, subject) {
			for(var ii = 0; ii < patientsCache.length; ii++)
				if(patientsCache[ii][6] == sender ||
					subject.indexOf(patientsCache[ii][0]) >= 0) {
					var folderDetails = {
						'folder': patientsCache[ii][11],
						'details': patientsCache[ii][12]
					};
					return folderDetails;
				}
		},		
		
		getLastPatient : function() {
			return patientsCache[patientsCache.length-1];
		},
		
		getPatientById : function(id) {
			for(var ii = 0; ii < patientsCache.length; ii++)
				if(patientsCache[ii][0] == id)
					return patientsCache[ii];
		},
		
		getPatientByEmail : function(email) {
			for(var ii = 0; ii < patientsCache.length; ii++)
				if(patientsCache[ii][6] == email)
					return patientsCache[ii];
		},
		
		getNewPatientId : function() {
			if(patientsCache.length == 1)
				return 1;
			//return parseInt(patientsCache[patientsCache.length-1][0]) + 1;
			var lastId = patientsCache[patientsCache.length-1][0];
			var newId = parseInt(lastId.split('-')[1]) + 1;
			return(auth.initial + '-' + newId);
		},
		
		addNewPatient : function (patient) {
			patientsCache.push(patient);
		},
		
		updatePatient : function(patient) {
			for(var ii = 0; ii < patientsCache.length; ii++)
				if(patientsCache[ii][0] == patient[0]) {
					patientsCache[ii] = patient;
					return;
				}
		},
		
		getDetailsSheet : function(id) {
			for(var ii = 0; ii < patientsCache.length; ii++)
				if(patientsCache[ii][0] == id)
					return patientsCache[ii][12];			
		},
		
		getFilesId : function(id) {
			for(var ii = 0; ii < patientsCache.length; ii++)
				if(patientsCache[ii][0] == id)
					return patientsCache[ii][13];			
		},
		
		initialize : function(postLogin) {
			console.log('Initializing cache');

			async.each(Object.keys(setFuncs), function(file, callback) {
				drive.getIdByName(file, function (error, fileId) {
					if (error)
						console.log(error);
					else {
						setFuncs[file](fileId);
						console.log(file + ' : ' + fileId);
					}
					callback(error);
				});
			}, function(error) {
				if (error) {
					console.log(error);
					postLogin(error);
				}
				else {
					console.log('Template Caching is done');
					sheet.getRows(masterSheet, 'PatientMasterSheet', function(rows) {
						patientsCache = rows;
						patientsCache.splice(0, 1);
						console.log('Number of patients cached: ' + patientsCache.length);
						postLogin();
					});
				}
			});
		},
				
		clear : function() {
			console.log('Clearning cache master: ' + masterSheet);
			setMasterSheet('');
			setPatientsFolder('');
			setDetailsTemplate('');
			setCaseTemplate('');
			patientsCache = [];
		}		
	};
};

exports.cacheService = new cache();
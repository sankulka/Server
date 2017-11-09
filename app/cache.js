'use strict';

var mcache = require('memory-cache');
var async = require('async');
var drive = require('./models/drive');
var sheet = require('./models/sheet');

var tenants = require('../config/tenants');
var chronic = require('./models/chronic');
var acute = require('./models/acute');
var payment = require('./models/payment');

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
	
	var seedData = [
		'PatientMasterSheet',
		'Patients',
		'DetailsTemplate'
	];
	
	function setSeedData (project, index, fileId) {
		var key = project + 'Seed';
		var seedCache = mcache.get(key);

		if (seedCache == null || seedCache == undefined)
			seedCache = new Array();

		seedCache[index] = fileId;
		mcache.put(key, seedCache);
	}
	
	return {		
		getMasterSheet : function(project) {
			var key = project + 'Seed';
			var seedCache = mcache.get(key);
			return seedCache[0];
		},
		
		getPatientsFolder : function(project) {
			var key = project + 'Seed';
			var seedCache = mcache.get(key);
			return seedCache[1];
		},
		
		getDetailsTemplate : function(project) {
			var key = project + 'Seed';
			var seedCache = mcache.get(key);
			return seedCache[2];
		},
		
		initialize : function(project, auth, postLogin) {
			console.log('Initializing Seed cache');

			var folder = tenants.tenantService.getFolder(project);
			async.forEachOf(seedData, function(file, index, callback) {
				drive.getIdByName(auth, folder, file, function (error, fileId) {
					if (error)
						console.log(error);
					else {
						setSeedData(project, index, fileId);
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
					console.log('Seed caching is done');
					
					var asyncTasks = [];
					asyncTasks.push(function(callback){
						chronic.cacheService.initialize(project, auth, callback);
					});
					asyncTasks.push(function(callback){
						acute.cacheService.initialize(project, auth, callback);
					});
					asyncTasks.push(function(callback){
						payment.cacheService.initialize(project, auth, callback);
					});
					
					async.parallel (asyncTasks, function () {
							console.log('All caches are initialized');
							postLogin();
						}
					);
				}
			});
		},

		clear : function(project) {
			console.log('Clearning the seed cache');
			var key = project + 'Seed';
			mcache.del(key);
			
			chronic.cacheService.clear(project);
			acute.cacheService.clear(project);
			payment.cacheService.clear(project);
		}
	};
};

exports.cacheService = new cache();
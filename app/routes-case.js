'use strict';

var utils = require('./utils');
var sessions = require('./sessions');
var tenants = require('../config/tenants');

module.exports = function (app) {
	
	// Get the case history paper
	app.get('/case/:patientId', function(req, res) {
		var patientId = req.params.patientId;
		var project = utils.getProject(req);
		if (project == null) {
			console.log('Session is not initialized for the user');
			res.json({});
			return;
		}
		
		/*https://docs.google.com/forms/d/e/1FAIpQLSeWMndL-zOsxJE3wgq_ZQQVi4xufTsp0wplm0QYrJfsJApnlw/viewform?entry.818258525=SNKKKK-12
		*/
		
		console.log('getting form url for the patient: ' + patientId);
		var casePaper = tenants.tenantService.getCasePaper(project);
		var regIdInCasePaper = tenants.tenantService.getRegIdInCasePaper(project);
		var url = 'https://docs.google.com/forms/d/e/' + casePaper +
			'/viewform?entry.' + regIdInCasePaper + '=' + patientId;
		res.json(url);		
	});
};
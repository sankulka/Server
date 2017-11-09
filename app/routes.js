'use strict';

module.exports = function (app) {

	require('./routes-patients.js') (app);
	
	require('./routes-files.js') (app);
	
	require('./routes-followup.js') (app);
	
	require('./routes-acute.js') (app);

	require('./routes-notes.js') (app);
	
	require('./routes-case.js') (app);

	require('./routes-appointments.js') (app);
	
	require('./routes-mailer');
	
	require('./routes-prescriptions') (app);
	
	require('./routes-payments') (app);
	
	require('./routes-emails.js') (app);
	
	require('./routes-activities.js') (app);
	
	require('./routes-dashboard.js') (app);
	
	//require('./routes-gallery') (app);
	
	require('./routes-testimonials.js') (app);
	
    // application -------------------------------------------------------------
    app.get('*', function (req, res) {
		console.log('Redirecting to home now');
		res.redirect('/');
    });
};
/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, Achaean, dojo, logger */

/* runs in rhino, assumes rhino in dojo available */

print( "***TESTING LOGGING***" );

var djConfig = {
  baseUrl: "./js/dojo/"
};

load( 'js/dojo/dojo.js' );
load( 'js/logger.js' );
load( 'js/tests/achaean.js' );

var loggingTest = new Achaean( "loggingTest" );

var testLogger = new logger.Logger( "channelName", "serverName" );

print( "***DONE TESTING***" );

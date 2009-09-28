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

var log, logTest;

logTest = new Achaean( "loggingTest" );
log = new logger.Logger( "channelName", "serverName" );

logTest.setUp( function( ) {
  print( "Running setup" );
} );

logTest.assert( dojo.isObject( log ), "Log not created" );

logTest.run( function ( ) {
  var results = logTest.getResults( ), i, errors, error;
  errors = results.allErrors;
  for( i = 0; i < errors.length; i++ ) {
    error = errors[ i ];
    print( "ERROR: " + error.message );
    print( " - Type: " + error.assertType );
    print( " - Required: " + error.required.toString( ) );
  }
  if ( results.testFailed ) {
    throw "Test failed.";
  } else {
    print ( "Test did not fail." );
  }
} );

print( "***DONE TESTING***" );

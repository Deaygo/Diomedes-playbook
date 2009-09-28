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

var log, logTest,
    serverName = "serverName",
    channelName = "#channelName",
    time = new Date( 2009, 9, 27, 12, 50, 49 ),
    nick = "Alanna",
    message = "Saying that Java is nice because it works on all OS's is like saying that anal sex is nice because it works on all genders",
    hostmask = "!n=Zhijin@115.171.38.30",
    fileName,
    mode = "@",
    serverMessage,
    serverLineFormat,
    lineFormat,
    lines;

fileName = serverName + "_" + channelName;
serverMessage = nick + hostmask + " has joined " + channelName + "."; 
serverLineFormat = "[2009-09-27 12:50:49] <Server> " + serverMessage;
lineFormat = "[2009-09-27 12:50:49] <" + mode + nick + "> " + message;

logTest = new Achaean( "loggingTest" );
log = new logger.Logger( serverName, channelName );

logTest.setUp( function( ) {
  print( "Running setup" );
} );

logTest.assertTrue( dojo.isObject( log ), "Log not created" );
logTest.assertEquals( channelName, log._getChannelName( ), "Channel name wrong" );
logTest.assertEquals( serverName, log._getServerName( ), "Server name wrong" );
logTest.assertEquals( fileName, log._getFileName( ), "Filename wrong" );
logTest.assertEquals( log._formatLine( nick, message, mode, time ), lineFormat, "line format incorrect" );

log.addLine( nick, message, mode, time );

lines = log._getLines( );

logTest.assertTrue( dojo.isArray( lines ), "lines should be an array" );
logTest.assertEquals( lines.length, 1, "Only one line added so far" );
logTest.assertEquals( lines[ 0 ], lineFormat, "Line incorrect" );

log._clearLines( );

logTest.assertEquals( lines.length, 0, "No lines should be present" );
logTest.assertEquals( log._formatServerLine( serverMessage, time ), serverLineFormat, "server line format incorrect" );

log.addServerLine( serverMessage, time );

lines = log._getLines( );

logTest.assertEquals( lines.length, 1, "Only one line added since clear" );
logTest.assertEquals( lines[ 0 ], serverLineFormat, "Server line format incorrect" );

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

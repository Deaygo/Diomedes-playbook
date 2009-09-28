/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, */

var logger;
if ( !dojo.isObject( logger ) ) {
  logger = {};
} 
/*
 * 
 * Logger will take a channel name (or nick ) and server name *testable
 * and log contents
 *
 * name a file based on server name and channel name + datetime *testable
 *
 * the log can stay open while object exists *not testable in rhino
 *
 * log will provide open, close and write methods *not testable in rhino
 *
 * log entries will be one line at a time *testable
 *
 * log will format itself *testable
 *
 * log entry will take nick, time and message, and  user status *testable
 *
 * log entry will take server message *testable
 *
*/

dojo.declare( "logger.Logger", null, {
  constructor: function ( channelName, serverName ) {
    this.channelName = channelName;
    this.serverName = serverName;
    this.fileName = this._getFileName( );
  },
  _getChannelName: function ( ) {
    return this.channelName;
  },
  _getServerName: function ( ) {
    return this.servername;
  },
  _getFileName: function ( ) {
    return "unimplemented";
  },
  openLog: function ( ) {
    //not tested
    return "unimplemented";
  },
  closeLog: function ( ) {
    //not tested
    return "unimplemented";
  },
  _getLines: function ( ) {
    return "unimplemented";
  },
  write: function ( ) {
    //not tested
    return "unimplemented";
  },
  addLine: function ( nick, message, mode, time ) {
    return "unimplemented";
  },
  _formatLine: function ( nick, message, mode, time ) {
    return "unimplemented";
  },
  addServerLine: function ( message, time ) {
    return "unimplemented";
  },
  _formatServerLine: function ( nick, message, mode, time ) {
    return "unimplemented";
  },
  destroy: function ( ) {
  }
} );


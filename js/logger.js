/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, Achaean, dojo, runNextTest */

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
  _getChannelName: ( ) {
    return this.channelName;
  },
  _getServerName: ( ) {
    return this.servername;
  },
  _getFileName: ( ) {
    return "unimplemented";
  },
  openLog: ( ) {
    //not tested
    return "unimplemented";
  },
  closeLog: ( ) {
    //not tested
    return "unimplemented";
  },
  _getLines: ( ) {
    return "unimplemented";
  },
  write: ( ) {
    //not tested
    return "unimplemented";
  },
  addLine: ( nick, message, mode, time ) {
    return "unimplemented";
  },
  _formatLine: ( nick, message, mode, time ) {
    return "unimplemented";
  },
  addServerLine: ( message, time ) {
    return "unimplemented";
  },
  _formatServerLine: ( nick, message, mode, time ) {
    return "unimplemented";
  },

} );


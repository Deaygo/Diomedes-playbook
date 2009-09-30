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
  constructor: function ( serverName, channelName ) {
    this.channelName = channelName;
    this.serverName = serverName;
    this.fileName = this._getFileName( );
    this.lines = [ ];
  },
  _getChannelName: function ( ) {
    return this.channelName;
  },
  _getServerName: function ( ) {
    return this.serverName;
  },
  _getFileName: function ( ) {
    return [ this.serverName, "_", this.channelName ].join( "" ); 
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
    return this.lines;
  },
  write: function ( ) {
    //not tested
    return "unimplemented";
  },
  addLine: function ( nick, message, mode, time ) {
    this.lines.push( this._formatLine( nick, message, mode, time ) );
  },
  _clearLines: function ( ) {
    while ( this.lines.length ) {
      this.lines.pop( );
    }
  },
  _formatLine: function ( nick, message, mode, time ) {
    return [
      this._getFormattedDate( time ),
      " <", mode, nick, "> ",
      message, "\n"
    ].join( "" );
  },
  _getFormattedDate: function ( time ) {
    return [ "[",
      time.getFullYear( ),
      "-",
      this._getTwoDigitStringFromNum( time.getMonth( ) + 1 ),
      "-",
      this._getTwoDigitStringFromNum( time.getDate( ) ),
      " ",
      this._getTwoDigitStringFromNum( time.getHours( ) ),
      ":",
      this._getTwoDigitStringFromNum( time.getMinutes( ) ),
      ":", 
      this._getTwoDigitStringFromNum( time.getSeconds( ) ),
      "]" 
    ].join( "" );
  },
  _getTwoDigitStringFromNum: function ( num ) {
    if ( num < 10 ) {
      return "0" + num;
    } else {
      return num.toString( );
    }
  },
  addServerLine: function ( message, time ) {
    this.lines.push( this._formatServerLine( message, time ) );
  },
  _formatServerLine: function ( message, time ) {
    return [
      this._getFormattedDate( time ),
      " <Server> ", message, "\n"
    ].join( "" );
  },
  destroy: function ( ) {
  }
} );


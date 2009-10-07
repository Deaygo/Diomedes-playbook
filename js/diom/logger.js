/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, air */

dojo.provide( "diom.logger" );

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

dojo.declare( "diom.Logger", null, {
  constructor: function ( serverName, channelName ) {
    var tmpDir;
    this.channelName = channelName;
    this.serverName = serverName;
    this.fileName = this._getFileName( new Date( ) );
    if ( air ) {
      tmpDir = air.File.documentsDirectory.resolvePath( "Diomedes" );
      tmpDir.createDirectory( );
      this.dir = tmpDir.resolvePath( "Logs" );
      this.dir.createDirectory( );
      this.file = this.dir.resolvePath( this.fileName );
      tmpDir = null;
    }
    this.fileStream = null;
    this.lines = [ ];
  },
  _getChannelName: function ( ) {
    return this.channelName;
  },
  _getServerName: function ( ) {
    return this.serverName;
  },
  _getFileName: function ( time ) {
    var fileName = [ 
      this.serverName, "_", this.channelName, 
      this._getFormattedDate( time, true )
    ].join( "" ); 
    fileName = fileName.split( "." ).join( "_" );
    fileName = [ fileName, ".txt" ].join( "" );
    return fileName;
  },
  open: function ( ) {
    //not tested
    if ( this.fileStream ) { return; }
    this.fileStream = new air.FileStream(); 
    this.fileStream.open( this.file, air.FileMode.APPEND ); 
  },
  close: function ( ) {
    //not tested
    if ( !this.fileStream ) { return; }
    this.fileStream.close( );
    delete this.fileStream;
    this.fileStream = null;
  },
  _getLines: function ( ) {
    return this.lines;
  },
  write: function ( ) {
    var lines = this._getLines( ), i;
    for( i = 0; i < lines.length; i++ ) {
      util.log( "\n\nWRITING LINES\n\n" );
      util.log( lines[ i ] );
      this.fileStream.writeUTFBytes( lines[ i ] );
    }
    this._clearLines( );
  },
  addLine: function ( nick, message, time ) {
    this.lines.push( this._formatLine( nick, message, time ) );
  },
  _clearLines: function ( ) {
    while ( this.lines.length ) {
      this.lines.pop( );
    }
  },
  _formatLine: function ( nick, message, time ) {
    var lineEnding;
    if ( air ) {
      lineEnding = air.File.lineEnding;
    } else {
      lineEnding = "\n";
    }
    return [
      this._getFormattedDate( time, false ),
      " <", nick, "> ",
      message, lineEnding
    ].join( "" );
  },
  _getFormattedDate: function ( time, isFileName ) {
    return [ 
      ( isFileName ? "_" : "[" ),
      time.getFullYear( ),
      ( isFileName ? "_" : "-" ),
      this._getTwoDigitStringFromNum( time.getMonth( ) + 1 ),
      ( isFileName ? "_" : "-" ),
      this._getTwoDigitStringFromNum( time.getDate( ) ),
      ( isFileName ? "_" : " " ),
      this._getTwoDigitStringFromNum( time.getHours( ) ),
      ( isFileName ? "_" : ":" ),
      this._getTwoDigitStringFromNum( time.getMinutes( ) ),
      ( isFileName ? "_" : ":" ),
      this._getTwoDigitStringFromNum( time.getSeconds( ) ),
      ( isFileName ? "" : "]" )
    ].join( "" );
  },
  _getTwoDigitStringFromNum: function ( num ) {
    if ( num < 10 ) {
      return "0" + num;
    } else {
      return num.toString( );
    }
  },
  destroy: function ( ) {
    this.close( );
    delete this.dir;
    delete this.file;
  }
} );


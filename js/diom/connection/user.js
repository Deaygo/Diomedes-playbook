/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom */

dojo.provide( "diom.connection.user" );

dojo.declare( "diom.connection.User", null, {

  constructor: function ( nick, host ) {
    this.update( nick, host );
    this.nick = nick;
    this.host = host;
    this._op = {};
    this._voice = {};
    this._halfOp = {};
    this._creator = {};
  },

  rename: function ( newName ) {
    this.nick = newName;
  },

  setHost: function ( host ) {
    this.host = host;
  },

  getHost: function ( ) {
    return this.host;
  },

  op: function ( channelName ) {
    this._op[ channelName ] = true;
  },

  deOp: function ( channelName ) {
    if ( channelName in this._op ) { delete this._op[ channelName ]; }
  },

  isOp: function ( channelName ) {
    return ( channelName in this._op );
  },

  voice: function ( channelName ) {
    this._voice[ channelName ] = true;
  },

  deVoice: function ( channelName ) {
    if ( channelName in this._voice ) { delete this._voice[ channelName ]; }
  },

  isVoice: function ( channelName ) {
    return ( channelName in this._voice );
  },

  halfOp: function ( channelName ) {
    this._halfOp[ channelName ] = true;
  },

  deHalfOp: function ( channelName ) {
    if (channelName in this._halfOp ) { delete this._halfOp[ channelName ]; }
  },

  isHalfOp: function ( channelName ) {
    return ( channelName in this._halfOp );
  },

  creator: function ( channelName ) {
    this._creator[ channelName ] = true;
  },

  deCreator: function ( channelName ) {
    if ( channelName in this._creator ) { delete this._creator[ channelName ]; }
  },

  isCreator: function ( channelName ) {
    return ( channelName in this._creator );
  },

  update: function ( nick, host ) {
    this.nick = nick;
    this.host = host;
  },

  destroy: function ( ) {
    delete this.nick;
    delete this.host;
  }

} );


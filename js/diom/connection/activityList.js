/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom */

dojo.provide( "diom.connection.activityList" );

dojo.declare( "diom.connection.ActivityList", null, {

  constructor: function ( maxItems ) {
    this.messages = [];
    this.maxItems = maxItems; 
    dojo.subscribe(  diom.topics.PREFS_CHANGE_HISTORY_LENGTH, this, "handleChangeHistoryLength" );
  },

  handleChangeHistoryLength: function ( newLen ) {
    this.maxItems = newLen;
  },

  addMessage: function ( msg ) {
    if ( this.messages.length >= this.maxItems ) {
      this.messages.shift( );
    }
    this.messages.push( msg );
    msg = null;
  },

  clearActivity: function ( ) {
    for ( var i = 0; i < this.messages.length; i++ ) {
      delete this.messages[ i ];
    }
    this.messages = [ ];
  },

  getMessages: function ( ) {
    return this.messages;
  },

  destroy: function ( ) {
    for ( var i = 0; i < this.messages.length; i++ ) {
      this.messages[ i ].destroy( );
      delete this.messages[ i ];
    }
  }

} );


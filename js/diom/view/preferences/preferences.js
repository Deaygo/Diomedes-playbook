/*
  Copyright (c) 2010 Apphacker apphacker@gmail.com
*/
/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, setTimeout */

dojo.provide( "diom.view.preferences.preferences" );

dojo.declare( "diom.view.preferences.PreferencesBase", diom.view.dialog.Dialog, {
  "-chains-": {
    constructor: "manual"
  },
  constructor: function ( ) {

    var params, height, width;

    height = Math.round( ( window.nativeWindow.height/3 ) * 2 );
    width = Math.round( ( window.nativeWindow.width/5 ) * 4 );
    params = {
      center: false,
      auto: false,
      height: height,
      width: width,
      "top": Math.round( ( window.nativeWindow.height/2 ) - ( height/2 ) ),
      left: Math.round( ( window.nativeWindow.width/2 ) - ( width/2 ) ),
      title: "Help",
      content: this.getContent( )
    };
    this.inherited( arguments, [ params, dojo.hitch( this, "handleLoad" ), dojo.hitch( this, "handleExit" ) ] );
    dojo.connect( this.node, "onclick", dojo.hitch( this, "handleClick" ) );
  },
  handleClick: function ( e ) {
    dojo.stopEvent( e );
  },
  handleLoad: function ( ) {
    throw "handleLoad is an bstract method that needs to be overwritten";
  },
  handleExit: function ( ) {
    this.destroy( );
  },
  getContent: function ( ) {
    throw "getContent is an bstract method that needs to be overwritten";
  }
} );

dojo.declare( "diom.view.preferences.Preferences", diom.view.preferences.PreferencesBase, {
  constructor: function ( ) {
    this.inherited( arguments );
  },
  handleLoad: function ( ) {
    this.open( );
  },
  getContent: function ( ) {
    return [
      '<div class="preferences">',
        '<h1>Preferences</h1>',
        '<form onsubmit="savePrefs( event );">',
          '<div class="formItem">',
            '<label for="nick">Nick: </label> <input type="text" id="nick" />',
          '</div>',
          '<div class="formItem">',
            '<label for="altNick">Alternate nick: </label> <input type="text" id="altNick" />',
          '</div>',
          '<div class="formItem">',
            '<label for="userName">Username: </label> <input type="text" id="userName" />',
          '</div>',
          '<div class="formItem">',
            '<label for="realName">Real name: </label> <input type="text" id="realName" />',
          '</div>',
          '<div class="formItem">',
            '<label for="finger">Finger (shows up for a CTCP finger): </label> <input type="text" id="finger" />',
          '</div>',
          '<div class="formItem">',
            '<label for="historyLength">History Length: </label> <input type="text" id="historyLength" />',
          '</div>',
          '<div class="formItem">',
            '<label for="theme">Theme: </label> <select id="theme" ><option value="none">none</option></select>',
          '</div>',
          '<div class="formItem">',
            '<label for="pollTime">Reconnect wait (seconds): </label> <input type="text" id="pollTime" />',
          '</div>',
          '<div class="formItem">',
            '<label for="font">Font: </label> <select id="font" ><option value="none">none</option></select>',
          '</div>',
          '<div class="formItem">',
            '<label for="fontSize">Base Font size (pixels - 8 min, 32 max ): </label> <input type="text" id="fontSize" />',
          '</div>',
          '<div class="formItem">',
            '<label for="updateDelay">Check for updates (in days, 0 turns off): </label> <input type="text" id="updateDelay" />',
          '</div>',
          '<div class="formItem">',
            '<label for="updateURL">Update URL: </label> <input type="text" id="updateURL" />',
          '</div>',
          '<div class="formItem">',
          '<div class="formItem">',
            '<label for="autoJoin">Auto join on invite: </label> <input type="checkbox" id="autoJoin" />',
          '</div>',
          '<div class="formItem">',
            '<label for="logging">Enable logging: </label> <input type="checkbox" id="logging" />',
            '<p class="formItemNote">Logs are in your documents directory</p>',
          '</div>',
          '<div class="formItem">',
            '<label for="time">Time: </label> <select id="time" ><option value="none">none</option></select>',
          '</div>',
          '<input type="submit" value="Save" />',
          '<button onclick="closePrefs( event );">Close</button>',
        '</form>',
      '</div>'
    ].join( "" );
  },
} );


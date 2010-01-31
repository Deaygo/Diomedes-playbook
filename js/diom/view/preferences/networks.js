/*
  Copyright (c) 2010 Apphacker apphacker@gmail.com
*/
/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, setTimeout */

dojo.provide( "diom.view.preferences.networks" );

dojo.declare( "diom.view.preferences.Networks", diom.view.preferences.PreferencesBase, {
  "-chains-": {
    destroy: "before",
    constructor: "manual"
  },
  constructor: function ( prefs ) {
    this.closePrefsBtnConnection = null;
    this.saveFormConnection = null;
    this.prefs = prefs;
    this.inherited( arguments );
  },
  handleLoad: function ( ) {
  /*
    this.saveFormConnection = dojo.connect( dojo.byId( "preferenceForm" ), "onsubmit", dojo.hitch( this, "savePrefs" ) );
    this.closePrefsBtnConnection = dojo.connect( dojo.byId( "closePrefsBtn" ), "onclick", dojo.hitch( this, "handleClose" ) );
    this.prefLoad( this.prefs );
    */
    this.open( );
  },
  destroy: function ( ) {
    dojo.disconnect( this.closePrefsBtnConnection );
  },
  getContent: function ( ) {
    return [
      '<h1>Networks</h1>',
      '<div id="networksList" onclick="handleListClick( event );"></div>',
      '<a href="#" onclick="showAddForm( event );">Add a Network</a>',
      '<form class="hidden" id="form" onsubmit="saveNetworks( event );">',
        '<input type="hidden" id="id" value="0"/>',
        '<div class="formItem">',
          '<label for="name">Name: </label> <input type="text" id="name" />',
        '</div>',
        '<div class="formItem">',
          '<label for="nick">Nick: </label> <input type="text" id="nick" />',
        '</div>',
        '<div class="formItem">',
          '<label for="altNick">Alternative nick: </label> <input type="text" id="altNick" />',
        '</div>',
        '<div class="formItem">',
          '<label for="userName">Username: </label> <input type="text" id="userName" />',
        '</div>',
        '<div class="formItem">',
          '<label for="realName">Real Name: </label> <input type="text" id="realName" />',
        '</div>',
        '<div class="formItem">',
          '<label for="finger">Finger: </label> <input type="text" id="finger" />',
        '</div>',
        '<div class="formItem">',
          '<label for="active">Active: </label> <input type="checkbox" id="active"  checked="true"/>',
        '</div>',
        '<div class="formItem">',
          '<label for="autoJoin">Auto join: </label> <input type="checkbox" id="autoJoin" checked="true" />',
        '</div>',
        '<input type="submit" value="Save" />',
        '<button onclick="closeForm( event );">Cancel</button>',
      '</form>',
      '<button onclick="closeWindow( event );">Close Window</button>'
    ].join( "" );
  }
} );



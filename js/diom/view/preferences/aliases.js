/*
  Copyright (c) 2010 Apphacker apphacker@gmail.com
*/
/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, setTimeout */

dojo.provide( "diom.view.preferences.aliases" );

dojo.declare( "diom.view.preferences.Aliases", diom.view.preferences.PreferencesBase, {
  "-chains-": {
    destroy: "before",
    constructor: "manual"
  },
  constructor: function ( model, view ) {
    this.id = "Aliases";
    this.formId = "aliasForm";
    this.closePrefsBtnConnection = null;
    this.closeFormBtnConnection = null;
    this.saveFormConnection = null;
    this.aliasListConnection = null;
    this.addFormBtnConnection = null;
    this.model = model;
    this.view = view;
    this.inherited( arguments );
  },
  handleLoad: function ( ) {
    this.model.getAliases( dojo.hitch( this, "initialize" ) );
  },
  initialize: function ( data ) {
    this.displayAliases( data );
    this.closePrefsBtnConnection = dojo.connect( dojo.byId( "closeWindowBtn" ), "onclick", dojo.hitch( this, "handleClose" ) );
    this.addFormBtnConnection = dojo.connect( dojo.byId( "addFormBtn" ), "onclick", dojo.hitch( this, "showAddForm" ) );
    this.saveFormConnection = dojo.connect( dojo.byId( "aliasForm" ), "onsubmit", dojo.hitch( this, "saveAliases" ) );
    this.closeFormBtnConnection = dojo.connect( dojo.byId( "closeFormBtn" ), "onclick", dojo.hitch( this, "closeForm" ) );
    this.aliasListConnection = dojo.connect( dojo.byId( "aliasesList" ), "onclick", dojo.hitch( this, "handleListClick" ) );
    this.open( );
  },
  updateAliases: function ( ) {
    this.model.getAliases( dojo.hitch( this, "displayAliases" ) );
  },
  displayAliases: function ( aliases ) {

    var node, r, i;

    node = dojo.byId( "aliasesList" );
    node.innerHTML = "";
    r = [];
    if ( aliases && aliases.length ) {
      for ( i = 0; i < aliases.length; i++ ) {
        r.push( this.getAliasHTML( aliases[ i ] ) );
      }
    }
    node.innerHTML = r.join( "" );
  },
  getAliasHTML: function( alias ) {
    return [
      '<div><span class="aliasName">', alias.name, '</span> ',
      '<span class="command">', alias.command, '</span> ',
      '<button id="delete.', alias.id, '">Delete</button> ',
      '</div>'].join( "" );
  },
  saveAliases: function ( event ) {

    var aliasData, id;

    dojo.stopEvent( event );
    util.log( "Saving Aliases." );
    aliasData = {};
    id = parseInt( dojo.byId( "id" ).value, 10 );
    if ( !this.getItem( "name", "Alias name", aliasData, false, true ) ) { return; }
    if ( !this.getItem( "command", "Command", aliasData, false, true ) ) { return; }
    if ( !this.getItem( "active", "Active", aliasData, true, true ) ) { return; }
    if ( id === 0 ) {
      dojo.publish( diom.topics.ALIAS_ADD, [ aliasData ] );
      this.closeForm( event );
      this.updateAliases( );
      return;
    }
    this.closeForm( event );
  },
  clearForm: function ( ) {
    dojo.byId( "command" ).value = "";
    this.inherited( arguments );
  },
  destroy: function ( ) {
    dojo.disconnect( this.closePrefsBtnConnection );
    delete this.closePrefsBtnConnection;
    dojo.disconnect( this.closeFormBtnConnection );
    delete this.closeFormBtnConnection;
    dojo.disconnect( this.aliasListConnection );
    delete this.aliasListConnection;
    dojo.disconnect( this.saveFormConnection );
    delete this.saveFormConnection;
    dojo.disconnect( this.addFormBtnConnection );
    delete this.addFormBtnConnection;
    this.inherited( arguments );
  },
  handleListClick: function ( event ) {

    var id, parts, cmd;

    id = event.target.id;
    if ( id ) {
      parts = id.split( "." );
      if ( parts.length ) {
        cmd = parts[ 0 ];
        id = parts [ 1 ];
        if ( cmd === "delete" ) {
          this.deleteAlias( id );
        }
      }
    }
  },
  deleteAlias: function ( id ) {

    var newAliases, i, alias;

    dojo.publish( diom.topics.ALIAS_DELETE, [ id ] );
    this.updateAliases( );
  },
  getContent: function ( ) {
    return [
      '<div class="preferences">',
        '<h1>Aliases</h1>',
          '<div class="preferencesList">',
            '<div id="aliasesList"></div>',
            '<button id="addFormBtn">Add a Perform</button>',
          '</div>',
        '<form class="hidden" id="aliasForm">',
          '<p>You can use variables such as $nick (for your nick), $channel and $server in the command.</p>',
          '<p>',
            'You can also use variables such as $1 for any arguments to your alias. If',
            'your alias has any argument is has to use these types of variables.<br/>',
            'For example an alias named "j" with the command "/join $1" when used as',
            '"/j #myFavChannel " will turn into "/join #myFavChannel".',
          '</p>',
          '<input type="hidden" id="id" value="0"/>',
          '<div class="formItem">',
            '<label for="name">Name: </label> <input type="text" id="name" />',
          '</div>',
          '<div class="formItem">',
            '<label for="nick">Command: </label> <input type="text" id="command" />',
          '</div>',
          '<div class="formItem">',
            '<label for="active">Active: </label> <input type="checkbox" id="active"  checked="true"/>',
          '</div>',
          '<div class="preferencesList">',
            '<input type="submit" value="Save" />',
            '<button id="closeFormBtn">Cancel</button>',
          '</dv>',
        '</form>',
        '<div class="preferencesList">',
          '<button id="closeWindowBtn">Close Window</button>',
        '</dv>',
      '</div>'
    ].join( "" );
  }
} );




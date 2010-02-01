/*
  Copyright (c) 2010 Apphacker apphacker@gmail.com
*/
/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, setTimeout */

dojo.provide( "diom.view.preferences.servers" );

dojo.declare( "diom.view.preferences.Servers", diom.view.preferences.PreferencesBase, {
  "-chains-": {
    destroy: "before",
    constructor: "manual"
  },
  constructor: function ( model, view ) {
    //this.model.networks.getNetworks( callback );
    //this.model.networks.getServers( callback );
    this.title = "Servers";
    this.closePrefsBtnConnection = null;
    this.addFormBtnConnection = null;
    this.saveFormConnection = null;
    this.networksListConnection = null;
    this.networks = null;
    this.model = model;
    this.view = view;
    this.inherited( arguments );
  },
  handleLoad: function ( ) {
    this.model.getNetworks( dojo.hitch( this, "initialize" ) );
  },
  initialize: function ( data ) {
    this.networks = data;
    /*
    this.closePrefsBtnConnection = dojo.connect( dojo.byId( "closeWindowBtn" ), "onclick", dojo.hitch( this, "handleClose" ) );
    this.closePrefsBtnConnection = dojo.connect( dojo.byId( "closeFormBtn" ), "onclick", dojo.hitch( this, "closeForm" ) );
    this.addFormBtnConnection = dojo.connect( dojo.byId( "addFormBtn" ), "onclick", dojo.hitch( this, "showAddForm" ) );
    this.networksListConnection = dojo.connect( dojo.byId( "networksList" ), "onclick", dojo.hitch( this, "handleListClick" ) );
    this.saveFormConnection = dojo.connect( dojo.byId( "networksForm" ), "onsubmit", dojo.hitch( this, "saveNetworks" ) );
    */
    this.displayNetworks( );
    this.open( );
  },
  handleModelLoad: function ( data ) {
    this.networks = data;
    this.displayNetworks( );
  },
  saveNetworks: function ( event ) {

    var networkData, id;

    dojo.stopEvent( event );
    util.log( "Saving Networks." );
    networkData = {};
    //get prefs
    id = parseInt( dojo.byId( "id" ).value, 10 );
    if ( !this.getItem( "name", "Network name", networkData ) ) { return; }
    if ( !this.getItem( "nick", "Nick", networkData ) ) { return; }
    if ( !this.getItem( "altNick", "Alternate nick", networkData ) ) { return; }
    if ( !this.getItem( "userName", "Username", networkData ) ) { return; }
    if ( !this.getItem( "realName", "Real name", networkData ) ) { return; }
    if ( !this.getItem( "finger", "Finger", networkData ) ) { return; }
    if ( !this.getItem( "active", "Active", networkData, true ) ) { return; }
    if ( !this.getItem( "autoJoin", "Auto join", networkData, true ) ) { return; }
    if ( id === 0 ) {
      dojo.publish( diom.topics.NETWORK_ADD, [ networkData ] );
      this.closeForm( event );
      this.model.getNetworks( dojo.hitch( this, "handleModelLoad" ) );
      return;
    } else {
      networkData.id = id;
      this.updateNetworks( networkData );
      dojo.publish( diom.topics.NETWORK_EDIT, [ id, networkData ] );
    }
    this.closeForm( event );
  },
  closeForm: function ( event ) {
    dojo.stopEvent( event );
    dojo.addClass( dojo.byId( "networksForm" ), "hidden" );
  },
  updateNetworks: function ( network ) {

    var i, temp;

    for ( i = 0; i < this.networks.length; i++ ) {
      temp = this.networks[ i ];
      if ( temp.id === network.id ) {
        this.networks[ i ] = network;
        this.displayNetworks( this.networks );
        return;
      }
    }
  },
  getItem: function ( id, name, dataStore, isCheckbox ) {

    var value;

    if ( isCheckbox ) {
      value = dojo.byId( id ).checked;
      if ( value === true || value === false ) {
        dataStore[ id ] = value;
        return true;
      }
    }
    value = dojo.trim( dojo.byId( id ).value );
    if ( !value ) {
      this.view.notify( name + " required." );
      return false;
    }
    dataStore[ id ] = value;
    return true;
  },
  destroy: function ( ) {
    dojo.disconnect( this.closePrefsBtnConnection );
  },
  displayNetworks: function ( ) {

    var node, r, i;

    node = dojo.byId( "networksList" );
    node.innerHTML = "";
    if ( this.networks && this.networks.length ) {
      var r = ['<select id="selectNetwork" onchange="selectNetwork( event );">'];
      r.push( '<option selected="selected" disabled="disabled">Select a network</option>' );
      for ( var i = 0; i < this.networks.length; i++ ) {
        r.push( this.getNetworkHTML( this.networks[ i ] ) );
      }
      r.push('</select>');
      node.innerHTML = r.join( "" );
    } else {
      node.innerHTML = "You have not created any networks.";
    }
  },
  showAddForm: function ( event ) {
    dojo.stopEvent( event );
    this.clearForm( );
    this.showForm( );
  },
  clearForm: function ( ) {

    var node, pref;

    dojo.byId( "name" ).value = "";
    dojo.byId( "id" ).value = "0";
  },
  showForm: function ( ) {
    dojo.removeClass( dojo.byId( "networksForm" ), "hidden" );
  },
  handleListClick: function ( event ) {

    var id, parts, cmd;

    id = event.target.id;
    if ( id ) {
      parts = id.split( "." );
      if ( parts.length ) {
        cmd = parts[ 0 ];
        id = parseInt( parts[ 1 ], 10 );
        if ( cmd === "edit" ) {
          dojo.stopEvent( event );
          this.showEditForm( id );
        } else if ( cmd === "delete" ) {
          dojo.stopEvent( event );
          this.deleteNetwork( id );
          this.closeForm( event );
        }
      }
    }
  },
  showEditForm: function ( id ) {

    var network, i, keys, key;

    network = null;
    for ( i = 0; i < this.networks.length; i++ ) {
      if ( this.networks[ i ].id === id ) {
        network = this.networks[ i ];
        break;
      }
    }
    if ( !network ) { return; }
    keys = [ "id", "name", "nick", "altNick", "userName", "realName", "finger" ];
    for ( i = 0; i < keys.length; i++ ) {
      key = keys[ i ];
      dojo.byId( key ).value = network[ key ];
    }
    dojo.byId( "active" ).checked = network.active;
    dojo.byId( "autoJoin" ).checked = network.autoJoin;
    this.showForm( );
  },
  deleteNetwork: function ( id ) {

    var newNetworks, i, network;

    dojo.publish( diom.topics.NETWORK_DELETE, [ id ] );
    newNetworks = [];
    for ( i = 0; i < this.networks.length; i++ ) {
      network = this.networks[ i ];
      if ( network.id !== id ) {
        newNetworks.push( network );
      }
    }
    this.networks = newNetworks;
    this.displayNetworks( );
  },
  getNetworkHTML: function ( network ) {
    return [
      '<option value="', network.id, '",>', network.name, '</option> ',
    ].join( "" );
  },
  getContent: function ( ) {
    return [
      '<div class="preferences">',
        '<h1>Servers</h1>',
        '<div class="preferencesList" id="networksList"></div>',
        '<div id="serverInfo" class="hidden">',
          '<div>Servers for <span id="networkName"></span>:</div>',
          '<div id="serverList" onclick="handleListClick( event );"></div>',
          '<a href="#" onclick="showAddForm( event );">Add a Server</a>',
          '<form class="hidden" id="form" onsubmit="saveServer( event );">',
            '<input type="hidden" id="id" value="0"/>',
            '<input type="hidden" id="networkId" value="0"/>',
            '<div class="formItem">',
              '<label for="name">Name: </label> <input type="text" id="name" />',
            '</div>',
            '<div class="formItem">',
              '<label for="password">Password: </label> <input type="password" id="password" />',
            '</div>',
            '<div class="formItem">',
              '<label for="active">Active: </label> <input type="checkbox" id="active"  checked="true"/>',
            '</div>',
            '<input type="submit" value="Save" />',
            '<button onclick="closeForm( event );">Cancel</button>',
          '</form>',
        '</div>',
        '<div class="preferencesList">',
          '<button onclick="closeWindow( event );">Close Window</button>',
        '</div>',
      '</div>'
    ].join( "" );
  }
} );




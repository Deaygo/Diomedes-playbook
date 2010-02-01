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
  constructor: function ( networks, prefs, view ) {
    this.closePrefsBtnConnection = null;
    this.addFormBtnConnection = null;
    this.saveFormConnection = null;
    this.networksListConnection = null;
    this.prefs = prefs;
    this.networks = networks;
    this.view = view;
    this.inherited( arguments );
  },
  handleLoad: function ( ) {
    this.closePrefsBtnConnection = dojo.connect( dojo.byId( "closeWindowBtn" ), "onclick", dojo.hitch( this, "handleClose" ) );
    this.closePrefsBtnConnection = dojo.connect( dojo.byId( "closeFormBtn" ), "onclick", dojo.hitch( this, "closeForm" ) );
    this.addFormBtnConnection = dojo.connect( dojo.byId( "addFormBtn" ), "onclick", dojo.hitch( this, "showAddForm" ) );
    this.networksListConnection = dojo.connect( dojo.byId( "networksList" ), "onclick", dojo.hitch( this, "handleListClick" ) );
    this.saveFormConnection = dojo.connect( dojo.byId( "networksForm" ), "onsubmit", dojo.hitch( this, "saveNetworks" ) );
    this.displayNetworks( );
    this.open( );
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
      this.handleClose( event );
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
      if ( temp.id === this.network.id ) {
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
    r = [];
    for ( i = 0; i < this.networks.length; i++ ) {
      r.push( this.getNetworkHTML( this.networks[ i ] ) );
    }
    node.innerHTML = r.join( "" );
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
    for ( pref in this.prefs ) {
      if ( this.prefs.hasOwnProperty( pref ) ) {
        node = dojo.byId( pref );
        if ( node ) {
          node.value = this.prefs[ pref ];
        }
      }
    }
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
      '<div><span class="networkName">', network.name, '</span> ',
      '<a href="#" id="edit.', network.id, '">Edit</a> ',
      '<a href="#" id="delete.', network.id, '">Delete</a> ',
      '</div>'].join( "" );
  },
  getContent: function ( ) {
    return [
      '<div class="preferences">',
        '<h1>Networks</h1>',
        '<div id="networksList"></div>',
        '<button id="addFormBtn">Add a Network</button>',
        '<form class="hidden" id="networksForm" onsubmit="saveNetworks( event );">',
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
          '<button id="closeFormBtn">Cancel</button>',
        '</form>',
        '<button id="closeWindowBtn">Close Window</button>',
      '</div>'
    ].join( "" );
  }
} );



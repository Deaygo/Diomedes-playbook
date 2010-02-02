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
    this.title = "Servers";
    this.selectedNetworkId = null;
    this.closePrefsBtnConnection = null;
    this.closeFormBtnConnection = null;
    this.saveFormConnection = null;
    this.addFormBtnConnection = null;
    this.serverListConnection = null;
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
    this.closePrefsBtnConnection = dojo.connect( dojo.byId( "closeWindowBtn" ), "onclick", dojo.hitch( this, "handleClose" ) );
    this.closeFormBtnConnection = dojo.connect( dojo.byId( "closeFormBtn" ), "onclick", dojo.hitch( this, "closeForm" ) );
    this.saveFormConnection = dojo.connect( dojo.byId( "serverForm" ), "onsubmit", dojo.hitch( this, "saveServer" ) );
    this.addFormBtnConnection = dojo.connect( dojo.byId( "addFormBtn" ), "onclick", dojo.hitch( this, "showAddForm" ) );
    this.serverListConnection = dojo.connect( dojo.byId( "serverList" ), "onclick", dojo.hitch( this, "handleListClick" ) );
    this.displayNetworks( );
    this.open( );
  },
  handleModelLoad: function ( data ) {
    this.networks = data;
    this.displayNetworks( );
  },
  closeForm: function ( event ) {
    if ( event ) {
      dojo.stopEvent( event );
    }
    dojo.addClass( dojo.byId( "serverForm" ), "hidden" );
  },
  saveServer: function ( event ) {

    var serverData, id;

    dojo.stopEvent( event );
    util.log( "Saving server." );
    serverData = {};
    //get prefs
    id = parseInt( dojo.byId( "id" ).value, 10 );
    serverData.networkId = parseInt( dojo.byId( "networkId" ).value, 10 );
    if ( !this.getItem( "name", "Server name", serverData, false, true ) ) { return; }
    if ( !this.getItem( "active", "Active", serverData, true, true ) ) { return; }
    if ( !this.getItem( "password", "Password", serverData, false, false ) ) { return; }
    if ( id === 0 ) {
      dojo.publish( diom.topics.SERVER_ADD, [ serverData ] );
    }
    this.clearForm( );
    this.selectNetwork( );
  },
  deselectServer: function ( ) {

    var node;

    dojo.byId( "selectNetwork" ).selectedIndex = 0;
    node = dojo.byId( "serverInfo" );
    this.selectedNetworkId = null;
    dojo.addClass( node, "hidden" );
    dojo.addClass( dojo.byId( "serverForm" ), "hidden" );
  },
  destroy: function ( ) {
    dojo.disconnect( this.closePrefsBtnConnection );
  },
  displayNetworks: function ( ) {

    var node, r, i;

    node = dojo.byId( "networksList" );
    node.innerHTML = "";
    if ( this.networks && this.networks.length ) {
      r = ['<select id="selectNetwork" onchange="selectNetwork( event );">'];
      r.push( '<option selected="selected" disabled="disabled">Select a network</option>' );
      for ( i = 0; i < this.networks.length; i++ ) {
        r.push( this.getNetworkHTML( this.networks[ i ] ) );
      }
      r.push('</select>');
      node.innerHTML = r.join( "" );
    } else {
      node.innerHTML = "You have not created any networks.";
    }
    setTimeout( dojo.hitch( this, function ( ) {
      this.networksListConnection = dojo.connect( dojo.byId( "selectNetwork" ), "onchange", dojo.hitch( this, "selectNetwork" ) );
    } ), 0 );
  },
  selectNetwork: function ( ) {

    var node;

    this.closeForm( );
    node = dojo.byId( "selectNetwork" );
    this.selectedNetworkId = parseInt( node.options[ node.selectedIndex ].value, 10 );
    this.model.getServers( this.selectedNetworkId, dojo.hitch( this, "listServers" ) );
  },
  listServers: function ( servers ) {

    var networkName, node, r, i;

    networkName = this.getNetworkName( this.selectedNetworkId );
    if ( networkName ) {
      dojo.byId( "networkName" ).innerHTML = networkName;
    } else {
      return;
    }
    node = dojo.byId( "serverList" );
    if ( !servers || !servers.length ) {
      node.innerHTML = "No servers currently added for network.";
    } else {
      r = [];
      for ( i = 0; i < servers.length; i++ ) {
        r.push( this.getServerHTML( servers[ i ] ) );
      }
      node.innerHTML = r.join( "" );
    }
    this.showServerInfo( );
  },
  getServerHTML: function ( server ) {
    return [
      '<div><span class="servername">', server.name, '</span> ',
      '<button id="delete.', server.id, '.', server.networkId, '">Delete</button> ',
      '</div>'].join( "" );
  },
  getNetworkName: function ( id ) {


    var i, network;

    for ( i = 0; i < this.networks.length; i++ ) {
      network = this.networks[ i ];
      if ( id === network.id ) {
        return network.name;
      }
    }
    return null;
  },
  showServerInfo: function ( ) {
    dojo.removeClass( dojo.byId( "serverInfo" ), "hidden" );
  },
  showAddForm: function ( event ) {
    dojo.stopEvent( event );
    this.clearForm( );
    this.showForm( );
  },
  showForm: function ( ) {
    if ( this.selectedNetworkId ) {
      dojo.byId( "networkId" ).value = this.selectedNetworkId;
      dojo.removeClass( dojo.byId( "serverForm" ), "hidden" );
    }
  },
  handleListClick: function ( event ) {

    var id, parts, cmd, networkId;

    id = event.target.id;
    if ( id ) {
      parts = id.split( "." );
      if ( parts.length ) {
        cmd = parts[ 0 ];
        id = parts [ 1 ];
        networkId = parts[ 2 ];
        if ( cmd === "delete" ) {
          this.deleteServer( id, networkId );
        }
      }
    }
  },
  deleteServer: function ( id, networkId ) {
    dojo.publish( diom.topics.SERVER_DELETE, [ id, networkId ] );
    this.selectNetwork( );
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
  getNetworkHTML: function ( network ) {
    return [
      '<option value="', network.id, '",>', network.name, '</option> '
    ].join( "" );
  },
  getContent: function ( ) {
    return [
      '<div class="preferences">',
        '<h1>Servers</h1>',
        '<div class="preferencesList" id="networksList"></div>',
        '<div id="serverInfo" class="hidden">',
          '<div class="preferencesList">',
            '<div>Servers for <span id="networkName"></span>:</div>',
            '<div id="serverList"></div>',
            '<button id="addFormBtn">Add a Server</button>',
          '</div>',
          '<form class="hidden" id="serverForm"">',
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
            '<div class="preferencesList">',
              '<input type="submit" value="Save" />',
              '<button id="closeFormBtn">Cancel</button>',
            '</div>',
          '</form>',
        '</div>',
        '<div class="preferencesList">',
          '<button id="closeWindowBtn">Close Window</button>',
        '</div>',
      '</div>'
    ].join( "" );
  }
} );




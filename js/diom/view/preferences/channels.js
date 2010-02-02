/*
  Copyright (c) 2010 Apphacker apphacker@gmail.com
*/
/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, setTimeout */

dojo.provide( "diom.view.preferences.channels" );

dojo.declare( "diom.view.preferences.Channels", diom.view.preferences.PreferencesBase, {
  "-chains-": {
    destroy: "before",
    constructor: "manual"
  },
  constructor: function ( model, view ) {
    this.title = "Channels";
    this.selectedNetworkId = null;
    this.closePrefsBtnConnection = null;
  /*
    this.closeFormBtnConnection = null;
    this.saveFormConnection = null;
    this.addFormBtnConnection = null;
    this.networks = null;
    */
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
    /*
    this.closeFormBtnConnection = dojo.connect( dojo.byId( "closeFormBtn" ), "onclick", dojo.hitch( this, "closeForm" ) );
    this.saveFormConnection = dojo.connect( dojo.byId( "channelForm" ), "onsubmit", dojo.hitch( this, "saveChannel" ) );
    this.addFormBtnConnection = dojo.connect( dojo.byId( "addFormBtn" ), "onclick", dojo.hitch( this, "showAddForm" ) );
    */
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
    dojo.addClass( dojo.byId( "channelForm" ), "hidden" );
  },
  showChannelInfo: function ( ) {
    dojo.removeClass( dojo.byId( "channelInfo" ), "hidden" );
  },
  listChannels: function ( channels ) {

    var networkName, node, r, i;

    networkName = this.getNetworkName( this.selectedNetworkId );
    if ( networkName ) {
      dojo.byId( "networkName" ).innerHTML = networkName;
    } else {
      return;
    }
    node = dojo.byId( "channelList" );
    if ( !channels || !channels.length ) {
      node.innerHTML = "No channels currently added for network.";
    } else {
      r = [];
      for ( i = 0; i < channels.length; i++ ) {
        r.push( this.getChannelHTML( channels[ i ] ) );
      }
      node.innerHTML = r.join( "" );
    }
    this.showChannelInfo( );
  },
  getChannelHTML: function ( channel ) {
    return [
      '<div><span class="channelname">', channel.name, '</span> ',
      '<a href="#" id="delete.', channel.id, '.', channel.networkId, '">Delete</a> ',
      '</div>'].join( "" );
  },
  saveChannel: function ( event ) {
  },
  destroy: function ( ) {
    dojo.disconnect( this.closePrefsBtnConnection );
    delete this.closePrefsBtnConnection;
    /*
    dojo.disconnect( this.closeFormBtnConnection );
    delete this.closeFormBtnConnection;
    dojo.disconnect( this.saveFormConnection );
    delete this.saveFormConnection;
    dojo.disconnect( this.addFormBtnConnection );
    delete this.addFormBtnConnection;
    */
  },
  selectNetwork: function ( event ) {

    var node;

    this.closeForm( );
    node = event.target;
    this.selectedNetworkId = node.options[ node.selectedIndex ].value;
    this.model.getChannels( this.selectedNetworkId, dojo.hitch( this, "listChannels" ) );
  },
  showAddForm: function ( event ) {
    dojo.stopEvent( event );
    this.clearForm( );
    this.showForm( );
  },
  showForm: function ( ) {
    if ( this.selectedNetworkId ) {
      dojo.byId( "networkId" ).value = this.selectedNetworkId;
      dojo.removeClass( dojo.byId( "channelForm" ), "hidden" );
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
        '<h1>Channels</h1>',
        '<div id="networksList"></div>',
        '<div id="channelInfo" class="hidden">',
          '<div>Channels for <span id="networkName"></span>:</div>',
          '<div id="channelList" onclick="handleListClick( event );"></div>',
          '<div class="preferencesList">',
            '<button onclick="showAddForm( event );">Add a Channel</button>',
          '</div>',
          '<form class="hidden" id="channelForm" onsubmit="saveChannel( event );">',
            '<input type="hidden" id="id" value="0"/>',
            '<input type="hidden" id="networkId" value="0"/>',
            '<div class="formItem">',
              '<label for="name">Name: </label> <input type="text" id="name" />',
            '</div>',
            '<div class="formItem">',
              '<label for="autoJoin">Auto join: </label> <input type="checkbox" id="autoJoin"  checked="true"/>',
            '</div>',
            '<input type="submit" value="Save" />',
            '<button onclick="closeForm( event );">Cancel</button>',
          '</form>',
        '</div>',
        '<div class="preferencesList">',
          '<button id="closeWindowBtn">Close Window</button>',
        '</dv>',
      '</div>'
    ].join( "" );
  }
} );




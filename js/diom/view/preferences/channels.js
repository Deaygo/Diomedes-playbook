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
    this.id = "Channels";
    this.formId = "channelForm";
    this.listMethod = "listChannels";
    this.selectedNetworkId = null;
    this.closePrefsBtnConnection = null;
    this.closeFormBtnConnection = null;
    this.saveFormConnection = null;
    this.addFormBtnConnection = null;
    this.channelPreferenceListConnection = null;
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
    this.saveFormConnection = dojo.connect( dojo.byId( "channelForm" ), "onsubmit", dojo.hitch( this, "saveChannel" ) );
    this.addFormBtnConnection = dojo.connect( dojo.byId( "addFormBtn" ), "onclick", dojo.hitch( this, "showAddForm" ) );
    this.channelPreferenceListConnection = dojo.connect( dojo.byId( "channelPreferenceList" ), "onclick", dojo.hitch( this, "handleListClick" ) );
    this.displayNetworks( );
    this.open( );
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
    node = dojo.byId( "channelPreferenceList" );
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
      '<button id="delete.', channel.id, '.', channel.networkId, '">Delete</button> ',
      '</div>'].join( "" );
  },
  saveChannel: function ( event ) {

    var channelData, id;

    dojo.stopEvent( event );
    util.log( "Saving channel." );
    channelData = {};
    //get prefs
    id = parseInt( dojo.byId( "id" ).value, 10 );
    channelData.networkId = parseInt( dojo.byId( "networkId" ).value, 10 );
    if ( !this.getItem( "name", "Channel name", channelData, false, true ) ) { return; }
    if ( !this.getItem( "autoJoin", "Auto join", channelData, true, true ) ) { return; }
    if ( id === 0 ) {
      dojo.publish( diom.topics.CHANNEL_ADD, [ channelData ] );
    }
    this.selectNetwork( );
  },
  destroy: function ( ) {
    dojo.disconnect( this.closePrefsBtnConnection );
    delete this.closePrefsBtnConnection;
    dojo.disconnect( this.closeFormBtnConnection );
    delete this.closeFormBtnConnection;
    dojo.disconnect( this.saveFormConnection );
    delete this.saveFormConnection;
    dojo.disconnect( this.addFormBtnConnection );
    delete this.addFormBtnConnection;
    dojo.disconnect( this.channelPreferenceListConnection );
    delete this.channelPreferenceListConnection;
    this.inherited( arguments );
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
          this.deleteChannel( id, networkId );
        }
      }
    }
  },
  deleteChannel: function ( id, networkId ) {
    dojo.publish( diom.topics.CHANNEL_DELETE, [ id, networkId ] );
    this.selectNetwork( );
  },
  getContent: function ( ) {
    return [
      '<div class="preferences">',
        '<h1>Channels</h1>',
        '<div class="preferencesList">',
          '<div id="networksList"></div>',
        '</div>',
        '<div id="channelInfo" class="hidden">',
          '<div class="preferencesList">',
            '<div>Channels for <span id="networkName"></span>:</div>',
            '<div id="channelPreferenceList"></div>',
              '<button id="addFormBtn">Add a Channel</button>',
          '</div>',
          '<form class="hidden" id="channelForm">',
            '<input type="hidden" id="id" value="0"/>',
            '<input type="hidden" id="networkId" value="0"/>',
            '<div class="formItem">',
              '<label for="name">Name: </label> <input type="text" id="name" />',
            '</div>',
            '<div class="formItem">',
              '<label for="autoJoin">Auto join: </label> <input type="checkbox" id="autoJoin"  checked="true"/>',
            '</div>',
            '<div class="preferencesList">',
              '<input type="submit" value="Save" />',
              '<button id="closeFormBtn">Cancel</button>',
            '</div>',
          '</form>',
        '</div>',
        '<div class="preferencesList">',
          '<button id="closeWindowBtn">Close Window</button>',
        '</dv>',
      '</div>'
    ].join( "" );
  }
} );




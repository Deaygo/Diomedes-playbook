/*
  Copyright (c) 2009 Apphacker apphacker@gmail.com
*/
/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom */

dojo.provide( "diom.network" );


dojo.declare( "diom.Network", null, {

  constructor: function ( data, model, channelList, prefs, appVersion, ignores ) {
		var id;
    this.prefs = util.cloneObject( prefs.getPrefs( ) );
    this.ignores = ignores;
    this.prefs.nick = data.nick;
    this.prefs.altNick = data.altNick;
    this.prefs.userName = data.userName;
    this.prefs.realName = data.realName;
    this.prefs.finger = data.finger;
    this.appVersion = appVersion;
    this.data = data;
    this.channelList = channelList;
    this.servers = [];
    this.channels = [];
    this.performs = [];
    this.performsProgress = 0;
    this.serverInfoReceived = false;
    this.channelInfoReceived = false;
    this.performInfoReceived = false;
    this.connection = null;
    this.currentHostIndex = null;
    this.currentHost = null;
    this.TEST_CONNECTION_TIME = 5000;
    id = data.id;
    model.getServers( id, dojo.hitch( this, "handleServerInfo" ) );
    model.getChannels( id, dojo.hitch( this, "handleChannelInfo" ) );
    model.getPerforms( id, dojo.hitch( this, "handlePerformInfo" ) );
    this.model = model;
    this.checkInfoProgress( );
    dojo.subscribe(  diom.topics.NETWORK_CHANGE, this, "handleNetworksChanged" );
    dojo.subscribe(  diom.topics.IGNORES_UPDATE, this, "handleIgnoresUpdate" );
    dojo.subscribe(  diom.topics.CHANNELS_CHANGED, this, "handleNetworkConnect" );
  },

  handleIgnoresUpdate: function ( ignores ) {
    this.ignores = ignores;
  },

  handleNetworkConnect: function ( type, channelName, host ) {
    if ( type === "connect" && host === this.currentHost ) {
      this.perform( );
    }
  },

  handleNetworksChanged: function ( id ) {
    util.log("hnc in nn");
    if ( id && id === this.data.id ) {
      this.model.getServers( id, dojo.hitch( this, "handleServerInfo" ) );
      this.model.getChannels( id, dojo.hitch( this, "handleChannelInfo" ) );
      this.model.getPerforms( id, dojo.hitch( this, "handlePerformInfo" ) );
    }
  },

  handleServerInfo: function ( servers ) {
    if ( servers ) {
      this.servers = servers;
    } else {
      this.servers = [];
    }
    this.serverInfoReceived = true;
  },

  handleChannelInfo: function ( channels ) {
    if ( channels ) {
      this.channels = channels;
    } else {
      this.channels = [];
    }
    this.channelInfoReceived = true;
  },

  handlePerformInfo: function ( performs ) {
    if ( performs ) {
      this.performs = performs;
    } else {
      this.performs = [];
    }
    this.performInfoReceived = true;
  },

  checkInfoProgress: function ( ) {
    if ( this.serverInfoReceived && this.channelInfoReceived && this.performInfoReceived ) {
      this.autoConnect( );
    } else {
      window.setTimeout( dojo.hitch( this, "checkInfoProgress" ), 1000 );
    }
  },

  autoConnect: function ( ) {
    if ( this.data && this.data.autoJoin && this.data.active ) {
      this.connect( );
    }
  },

  connect: function ( ) {
		var parts, port;
    if ( !this.servers.length ) { return; }
    if ( this.currentHost ) {
      dojo.publish( diom.topics.CONNECTION_CLOSE, [ this.currentHost ] );
      this.connection = null;
      this.currentHost = null;
    }
    parts = this.getNextServer( ).split( ":" );
    this.currentHost = util.fromIndex( parts, 0 );
    port = util.fromIndex( parts, 1 );
    this.channelList.createConnection( this.currentHost, port, this.prefs, this.appVersion, this.ignores, this.getPassword( ) );
    this.connection = this.channelList.getConnection( this.currentHost );
    dojo.publish( diom.topics.CHANNELS_CHANGED, [ "connect", this.currentHost, this.currentHost ] );
  },

  getNextServer: function ( ) {
    if ( this.currentHostIndex === null || this.currentHostIndex === ( this.servers.length - 1 ) ) {
      this.currentHostIndex = 0;
    } else {
      do {
        this.currentHostIndex++;
      } while ( !this.servers[ this.currentHostIndex ].active );
    }
    return this.getServer( );
  },

  getHost: function ( ) {
    return this.currentHost;
  },

  getServer: function ( ) {
    return this.servers[ this.currentHostIndex ].name;
  },

  getPassword: function ( ) {
    if ( this.servers && this.servers.length && ( this.servers[ this.currentHostIndex ] ) ) {
      return this.servers[ this.currentHostIndex ].password;
    } else {
      return "";
    }
  },

  getConnection: function ( ) {
    return this.connection;
  },

  joinDefaultChannels: function ( ) {
		var channelsData, channels, i, channel;
    channelsData = this.channels;
    channels = [];
    for ( i = 0; i < channelsData.length; i ++ ) {
      channel = channelsData[ i ];
      channels.push( channel.name );
    }
    if ( channels.length ) {
      util.log("this.connection: " + this.connection );
      this.connection.sendCommand( "join", channels, null );
    }
  },

  perform: function ( ) {
    var performs = this.performs;
    if ( this.performsProgress >= performs.length ) {
      this.joinDefaultChannels( );
      this.performsProgress = 0;
      return;
    }
    dojo.publish( diom.topics.USER_INPUT, [ util.fromIndex( performs, this.performsProgress ).command, this.currentHost ] );
    this.performsProgress++;
    window.setTimeout( dojo.hitch( this, "perform" ), 2500 );
  },

  close: function ( ) {
    if ( this.currentHost ) {
      dojo.publish( diom.topics.CONNECTION_CLOSE, [ this.currentHost ] );
      this.connection.destroy( );
      this.connection = null;
      this.currentHost = null;
    }
  },

  destroy: function ( ) {
    this.close( );
  }

} );

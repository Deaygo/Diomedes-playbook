/*
  Copyright (c) 2009 Apphacker apphacker@gmail.com
*/

var dNetwork;

if ( !dNetwork ) {
  dNetwork = {};
}

if ( window.runtime && air && util ) {
  //requires AIR and util
  

  dNetwork.Network = function ( data, model, channelList, pollTime ) {
    this.data = data;
    this.channelList = channelList;
    this.pollTime = pollTime;
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
    var id = data.id;
    model.getServers( id, util.hitch( this, "handleServerInfo" ) ); 
    model.getChannels( id, util.hitch( this, "handleChannelInfo" ) );
    model.getPerforms( id, util.hitch( this, "handlePerformInfo" ) );
    this.checkInfoProgress( );
    util.subscribe( topics.CONNECTION_DISCONNECTED, this, "handleDisconnect" ) ;
    util.subscribe( topics.NETWORK_CHANGE, this, "handleNetworksChanged", [] );
  }

  var _nn = dNetwork.Network.prototype;

  _nn.handleNetworksChanged = function ( id ) {
    util.log("hnc in nn");
    if ( id && id == this.data.id ) {
      model.getServers( id, util.hitch( this, "handleServerInfo" ) ); 
      model.getChannels( id, util.hitch( this, "handleChannelInfo" ) );
      model.getPerforms( id, util.hitch( this, "handlePerformInfo" ) );
    }
  }

  _nn.handleServerInfo = function ( servers ) {
    if ( servers ) { 
      this.servers = servers;
    } else {
      this.servers = [];
    }
    this.serverInfoReceived = true;
  }

  _nn.handleChannelInfo = function ( channels ) {
    if ( channels ) {
      this.channels = channels;
    } else {
      this.channels = [];
    }
    this.channelInfoReceived = true;
  }

  _nn.handlePerformInfo = function ( performs ) {
    if ( performs ) {
      this.performs = performs;
    } else {
      this.performs = [];
    }
    this.performInfoReceived = true;
  }

  _nn.checkInfoProgress = function ( ) {
    if ( this.serverInfoReceived && this.channelInfoReceived && this.performInfoReceived ) {
      this.autoConnect( );
    } else {
      window.setTimeout( util.hitch( this, "checkInfoProgress" ), 1000 );
    }
  }

  _nn.autoConnect = function ( ) {
    if ( this.data && this.data.autoJoin && this.data.active ) {
      this.connect( );
    }
  }

  _nn.handleDisconnect = function ( host ) {
    if ( this.pollTime && host == this.currentHost ) {
      window.setTimeOut( util.hitch( this, "resetConnection" ), this.pollTime );
    }
  }

  _nn.resetConnection = function ( host ) {
    if ( this.currentHost ) {
      util.publish( topics.CONNECTION_CLOSE, [ this.currentHost ] );
    }
    this.connect( );
  }

  _nn.connect = function ( ) {
    if ( !this.servers.length ) return;
    var parts = this.getNextServer( ).split( ":" );
    this.currentHost = util.fromIndex( parts, 0 );
    var port = util.fromIndex( parts, 1 );
    this.channelList.createNewConnection( this.currentHost, port, this.model.prefs.getPrefs( ) );
    this.connection = this.channelList.getConnection( this.currentHost );
  }

  _nn.getNextServer = function ( ) {
    if ( this.currentHostIndex === null || this.currentHostIndex == ( this.servers.length - 1 ) ) {
      this.currentHostIndex = 0;
    } else {
      do {
        this.currentHostIndex++;
      } while ( !this.servers[ this.currentHostIndex ].active );
    }
    return this.getServer( );
  }

  _nn.getHost = function ( ) {
    return this.currentHost;
  }

  _nn.getServer = function ( ) {
    return this.servers[ this.currentHostIndex ].name;
  }

  _nn.getConnection = function ( ) {
    return this.connection;
  }

  _nn.joinDefaultChannels = function ( ) {
    var channels = this.channels;
    if ( channels.length ) {
      util.publish( topics.USER_INPUT, [ "/join " + channels.join(", ") ] );
    }
  }

  _nn.perform = function ( ) {
    var performs = this.performs;
    if ( this.performsProgress >= performs.length ) {
      this.joinDefaultChannels( );
      this.performsProgress = 0;
      return;
    }
    this.currentConnection
    util.publish( topics.USER_INPUT, [ util.fromIndex( performs, this.performsProgress ) ] );
    this.performsProgress++;
    window.setTimeout( util.hitch( this, "perform" ), 1000 );
  }

}


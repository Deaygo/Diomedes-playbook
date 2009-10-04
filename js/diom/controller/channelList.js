
dojo.provide( "diom.controller.channelList" );


  dController.ChannelList = function () {
    this.connections = {};
  }

  var _cclp = dController.ChannelList.prototype;

  _cclp.createConnection = function ( server, port, preferences, appVersion, ignores ) {
    if ( !( server in this.connections ) ) {
      this.connections[server] = new diom.connection.Connection( server, port, preferences, appVersion, ignores );
      this.connections[server].connect( );
      return true;
    } else {
      return false;
    } 
  }

  _cclp.getServerChannel = function ( host ) {
    return this.connections[host].getServerChannel( );
  }

  _cclp.getChannel = function ( channelName, host ) {
    if ( host in this.connections ) {
      return this.connections[host].getChannel( channelName );
    } 
    return null;
  }

  _cclp.destroyConnection = function ( host ) {
    if ( host in this.connections ) {
      this.connections[ host ].destroy( );
      delete this.connections[ host ];
    }
  }

  _cclp.getConnection = function ( host ) {
    if ( host in this.connections ) {
      return this.connections[ host ];
    } else {
      return null;
    }
  }

  _cclp.getChannels = function ( ) {
    var channels = {};
    for ( var i in this.connections ) {
      channels[ i ] = this.connections[ i ].getChannels( );
    }
    return channels;
  }

  _cclp.destroy = function () {
    //TODO: destroy connections;
  }


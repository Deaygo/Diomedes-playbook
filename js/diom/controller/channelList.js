/*jslint white: false */
/*jslint nomen: false */
/*jslint regexp: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, air, runtime */

dojo.provide( "diom.controller.channelList" );


dojo.declare( "diom.controller.ChannelList", null, {

  constructor: function ( ) {
    this.connections = {};
  },

  createConnection: function ( server, port, preferences, appVersion, ignores, password ) {
    if ( !( server in this.connections ) ) {
      this.connections[server] = new diom.connection.Connection( server, port, preferences, appVersion, ignores, password );
      this.connections[server].connect( );
      return true;
    } else {
      return false;
    }
  },

  getServerChannel: function ( host ) {
    return this.connections[host].getServerChannel( );
  },

  getChannel: function ( channelName, host ) {
    if ( host in this.connections ) {
      return this.connections[host].getChannel( channelName );
    }
    return null;
  },

  destroyConnection: function ( host ) {
    if ( host in this.connections ) {
      this.connections[ host ].destroy( );
      delete this.connections[ host ];
    }
  },

  getConnection: function ( host ) {
    if ( host in this.connections ) {
      return this.connections[ host ];
    } else {
      return null;
    }
  },

  getChannels: function ( ) {
    var channels = {}, i;
    for ( i in this.connections ) {
			if ( this.connections.hasOwnProperty( i ) ) {
      	channels[ i ] = this.connections[ i ].getChannels( );
			}
    }
    return channels;
  },

  destroy: function () {
    //TODO: destroy connections;
  }

} );

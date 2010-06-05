/*jslint white: false */
/*jslint nomen: false */
/*jslint regexp: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, air, runtime */

dojo.provide( "diom.controller.channelList" );


dojo.declare( "diom.controller.ChannelList", null, {

  /**
  * @constructor
  */
  constructor: function ( ) {
    this.connections = {};
  },

  /**
  * @param {String} server
  * @param {String} port
  * @param {Object} preferences
  * @param {String} appVersion
  * @param {Object} ignores
  * @param {String} password
  * @public
  * @return {diom.connection.Connection}
  */
  createConnection: function ( server, port, preferences, appVersion, ignores, password ) {

    var connection, connectionId;

    connection = new diom.connection.Connection( server, port, preferences, appVersion, ignores, password );
    connectionId = connection.getConnectionId();
    this.connections[connectionId] = connection;
    connection.connect( );
    return connection;
  },

  /**
  * @param {String} connectionId
  * @public
  * @return {diom.connection.Channel}
  */
  getServerChannel: function ( connectionId ) {
    return this.connections[connectionId].getServerChannel( );
  },

  /**
  * @param {String} channelName
  * @param {String} connectionId
  * @public
  * @return {diom.connection.Channel}
  */
  getChannel: function ( channelName, connectionId ) {
    if ( connectionId in this.connections ) {
      return this.connections[connectionId].getChannel( channelName );
    }
    return null;
  },

  /**
  * @param {String} connectionId
  * @public
  */
  destroyConnection: function ( connectionId ) {
    if ( connectionId in this.connections ) {
      this.connections[ connectionId ].destroy( );
      delete this.connections[ connectionId ];
    }
  },

  /**
  * @param {String} connectionId
  * @public
  * @return {diom.connection.Connection}
  */
  getConnection: function ( connectionId ) {
    if ( connectionId in this.connections ) {
      return this.connections[ connectionId ];
    } else {
      return null;
    }
  },

  /**
  * @public
  * @return {Array}
  */
  getChannels: function ( ) {

    var channels = {}, i;

    for ( i in this.connections ) {
      if ( this.connections.hasOwnProperty( i ) ) {
        channels[ i ] = this.connections[ i ].getChannels( );
      }
    }
    return channels;
  },

  /**
  * @public
  */
  destroy: function () {
    //TODO: destroy connections;
  }

} );

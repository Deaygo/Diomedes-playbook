/*
  Copyright (c) 2009 Apphacker apphacker@gmail.com
*/

var dController;

if(!dController) {
  dController = {};
}

if ( window.runtime && air && util ) {
  //requires AIR and util

  dController.Controller = function ( model, view ) {

    this.model = model;
    this.view = view;
    this.channelSubscription = null;
    this.channelList = new dController.ChannelList( );
    this.currentChannel = null;
    this.currentConnection = null;
    this.defaultNick = "diomedesuser"; //TODO: need model & preferences
    this.queryTimer = {};
    this.channelsWithActivity = {};
    this.channelsHighlighted  = {};

    this.aliases = {};
    this.getAliases( );

    this.networks = {};
    this.getNetworks( );

    util.subscribe( topics.USER_INPUT, this, "handleInput", [] );
    util.subscribe( topics.CHANNELS_CHANGED, this, "handleChannelChange", [] );
    util.subscribe( topics.CHANNEL_SELECTED, this, "handleChannelSelect", [] );
    util.subscribe( topics.CHANNEL_ACTIVITY, this, "handleChannelActivity", [] );
    util.subscribe( topics.USER_HIGHLIGHT, this, "handleHighlight", [] );
    util.subscribe( topics.PREFS_SAVE, this, "handlePrefsSave", [] );
    util.subscribe( topics.NETWORK_ADD, this, "handleNetworkAdd", [] );
    util.subscribe( topics.NETWORK_EDIT, this, "handleNetworksEdit", [] );
    util.subscribe( topics.NETWORK_DELETE, this, "handleNetworksDelete", [] );
    util.subscribe( topics.NETWORK_CHANGE, this, "handleNetworksChanged", [] );
    util.subscribe( topics.SERVER_ADD, this, "handleServerAdd", [] );
    util.subscribe( topics.SERVER_DELETE, this, "handleServerDelete", [] );
    util.subscribe( topics.CHANNEL_ADD, this, "handleChannelAdd", [] );
    util.subscribe( topics.CHANNEL_DELETE, this, "handleChannelDelete", [] );
    util.subscribe( topics.PERFORM_ADD, this, "handlePerformAdd", [] );
    util.subscribe( topics.PERFORM_DELETE, this, "handlePerformDelete", [] );
    util.subscribe( topics.ALIAS_ADD, this, "handleAliasAdd", [] );
    util.subscribe( topics.ALIAS_DELETE, this, "handleAliasDelete", [] );
    util.subscribe( topics.ALIAS_CHANGE, this, "getAliases", [] );
    util.subscribe( topics.CONNECTION_CLOSE, this, "closeConnection", [] );
    util.subscribe( topics.USER_ACTIVITY, this, "handleUserActivity", [] );
  }

  _ccp = dController.Controller.prototype;

  _ccp.getAliases = function ( ) {
    this.model.aliases.getAliases( util.hitch( this, "handleAliases" ) );
  }

  _ccp.handleAliases = function ( aliases ) {
    if ( !aliases ) {
      this.aliases = {};
      return;
    }
    for ( var i = 0; i < aliases.length; i++ ) {
      var alias = aliases[ i ];
      this.aliases[ alias.name ] = alias;
    }
  }

  _ccp.getNetworks = function ( ) {
    this.model.networks.getNetworks( util.hitch( this, "handleGetNetworks" ) );
  }

  _ccp.getNetwork = function ( networkName ) {
    networkName = this.formatNetworkName( networkName );
    if ( networkName in this.networks ) {
      return this.networks[ networkName ];
    } else {
      return null;
    }
  }

  _ccp.setNetwork = function ( networkName, network ) {
    networkName = this.formatNetworkName( networkName );
    this.networks[ networkName ] = network;
  }

  _ccp.removeNetwork = function ( networkName ) {
    networkName = this.formatNetworkName( networkName );
    this.networks[ networkName ].destroy( );
    delete this.networks[ networkName ] ;
  }

  _ccp.formatNetworkName = function ( networkName ) {
    return networkName.toLowerCase( );
  }

  _ccp.handleGetNetworks = function ( networks ) {
    util.log("handleGetNetworks");
    if ( !networks ) return;
    for ( var i = 0; i < networks.length; i++ ) {
      var network = networks[ i ];
      this.setNetwork( network.name, new dNetwork.Network( network, this.model.networks, this.channelList, this.model.prefs ) );
      var connection = this.getNetwork( network.name ).getConnection( );
      if ( connection ) {
        this.currentConnection = connection;
        this.setCurrentChannel( this.currentConnection.getServerChannel( ) );
      }
    }
  }

  _ccp.handleNetworksChanged = function ( ) {
    util.log("hnc in dController");
    this.model.networks.getNetworks( util.hitch( this, "handleUpdateNetworks" ) );
  }

  _ccp.handleUpdateNetworks = function ( networks ) {
    var networksFound = {};
    for ( var networkName in this.networks ) {
      networksFound[ networkName ] = 0;
    }
    if ( networks ) {
      for ( var i = 0; i< networks.length; i++ ) {
        var network = networks[ i ];
        networkName = this.formatNetworkName( networkName );
        var storedNetwork = this.getNetwork( network.name );
        if ( !( storedNetwork ) ) {
          this.setNetwork( network.name, new dNetwork.Network( network, this.model.networks, this.channelList, this.model.prefs ) );
        } else {
          delete networksFound[ this.formatNetworkName( network.name ) ];
        }
      }
    }
    for ( var networkName in networksFound ) {
      this.removeNetwork( networkName );
    }
  }

  _ccp.handleAliasDelete = function ( id ) {
    this.model.aliases.remAlias( id );
  }

  _ccp.handleAliasAdd = function ( data ) {
    this.model.aliases.addAlias( data.name, data.command, data.active, 0 );
  }

  _ccp.handlePerformDelete = function ( id, networkId ) {
    this.model.networks.remPerform( id, networkId );
  }

  _ccp.handlePerformAdd = function ( data ) {
    this.model.networks.addPerform( data.networkId, data.name, data.command, data.active );
  }

  _ccp.handleChannelDelete = function ( id, networkId ) {
    this.model.networks.remChannel( id, networkId );
  }

  _ccp.handleChannelAdd = function ( data ) {
    this.model.networks.addChannel( data.networkId, data.name, data.autoJoin );
  }

  _ccp.handleServerDelete = function ( id, networkId ) {
    this.model.networks.remServer( id, networkId );
  }

  _ccp.handleServerAdd = function ( data ) {
    this.model.networks.addServer( data.networkId, data.name, data.active );
  }

  _ccp.handlePrefsSave = function ( prefs ) {
    this.model.prefs.setPrefs( prefs );
  }

  _ccp.handleNetworkAdd = function ( data ) {
    this.model.networks.addNetwork( data.name, data.nick, data.altNick, data.userName, data.realName, data.finger, data.autoJoin, data.active );
  }

  _ccp.handleNetworksEdit = function ( id, data ) {
    this.model.networks.editNetwork( id, data.name, data.nick, data.altNick, data.userName, data.realName, data.finger, data.autoJoin, data.active );
  }

  _ccp.handleNetworksDelete = function ( id ) {
    this.model.networks.remNetwork( id );
  }

  _ccp.handleChannelSelect = function ( server, type, name ) {
    util.log( "handlechannelselect" );
    delete this.currentConnection;
    this.currentConnection = this.channelList.getConnection( server );
    if ( type == "SERVER" ) {
      this.setCurrentChannel( this.channelList.getServerChannel( server ) );
    } else {
      this.setCurrentChannel( this.channelList.getChannel( name, server ) );
    }
  }

  _ccp.handleInput = function ( input, server ) {
    util.log( "input: " + input + " server: " + server );
    if ( input.search( "/" ) == 0 ) {
      //it's a command
      var argsR = input.substr( 1 ).split( " " );
      var cmd = argsR.shift( ).toLowerCase( );
      util.log("cmd:" + cmd);
      if ( cmd == "server" ) {
        util.log( "Connecting to a server." );
        if ( argsR.length > 0 ) {
          //XXX: maybe get some preferences in this part
          var nick = this.defaultNick;
          var hostParts = argsR[0].split(":");
          var host = hostParts[0];
          var port = ( ( hostParts.length > 1 ) ? hostParts[1] : null );
          var connection = this.channelList.getConnection( host );
          if ( connection ) {
            connection.connect( );
            this.handleChannelSelect( host, "SERVER",  null );
          } else {
            this.channelList.createNewConnection( host, port, this.model.prefs.getPrefs( ) );
            if ( !this.currentConnection ) {
              this.currentConnection = this.channelList.getConnection( host );
              this.setCurrentChannel( this.currentConnection.getServerChannel( ) );
            }
          }
        } else {
          util.log( "not enough args given to connect to server" );
        }
      } else if ( cmd == "connect" ) {
        if ( argsR.length > 0 ) {
          var networkName = argsR.shift( );
          var network = this.getNetwork( networkName );
          if ( network ) {
            console.warn("connecting to network starting");
            network.connect( );
            console.warn("connecting to network finished");
            this.currentConnection = network.getConnection( host );
            this.setCurrentChannel( this.currentConnection.getServerChannel( ) );
          }
        }
      } else if ( cmd == "exit" ) {
        if ( this.view.getConfirmation( "exit the application" ) ) {
          window.close( );
        }
      } else if ( cmd == "close" ) {
        if ( this.view.getConfirmation( "close a connection" ) ) {
          console.info("closing ");
          if ( this.currentConnection ) {
            var network = this.getNetwork( this.currentConnection.server );
            console.info("network: " + network + " this.currentConnection.server: " + this.currentConnection.server);
            if ( network ) {
              network.close( );
            } else if ( this.currentConnection ) {
              this.closeConnection( this.currentConnection.server );
            }
          }
        }
      } else if ( cmd == "help" ) {
        this.view.displayHelp( );
      } else if ( cmd == "clear" ) {
        this.currentChannel.clearActivity( );
        this.view.clearActivityView( );
      } else if ( cmd in this.aliases ) {
        util.publish( topics.USER_INPUT, [ this.createInputFromAlias( this.aliases[ cmd ], argsR ), server ] );
      } else {
        //hand command over to currentConnection
        if ( server ) {
          var connection = this.channelList.getConnection( server );
          if ( connection ) {
            connection.sendCommand( cmd, this.replaceTokens( argsR, connection ), server );
          }
        } else if ( this.currentConnection ) {
          util.log("cascading cmd down to connection");
          this.currentConnection.sendCommand( cmd, this.replaceTokens( argsR, this.currentConnection ), this.getCurrentChannelName( ) );
        }
      }
    } else {
      //just a message, hand to currentConnection
      if ( this.currentConnection ) {
        this.currentConnection.sendMessage( this.getCurrentChannelName( ), input );
      }
    }
  }

  _ccp.createInputFromAlias = function ( alias, args ) {
    if ( !this.currentConnection ) return;
    var cmd = alias.command;
    args = this.replaceTokens( args, this.currentConnection );
    cmd = this.replaceTokens( cmd.split( " " ), this.currentConnection ).join( " " );
    for ( var i = 0; i < args.length; i++ ) {
      var arg = args[ i ];
      var token = "$" + ( i + 1 );
      cmd = cmd.split(token).join(arg);
    }
    return cmd;
  }

  _ccp.replaceTokens = function ( args, connection ) {
    if ( !args || !args.length ) return args;
    var tokens = {
      "$nick" : connection.getNick( ),
      "$channel" : ( this.currentChannel && this.currentChannel.name ? this.currentChannel.name : connection.server ),
      "$server" : connection,
    }
    var newArgs = [];
    for ( var i = 0; i < args.length; i++ ) {
      var arg = args[ i ];
      if ( arg in tokens ) {
        newArgs[ i ] = tokens[ arg ];
      } else {
        newArgs[ i ] = arg;
      }
    }
    return newArgs;
  }

  _ccp.closeConnection = function ( host ) {
    console.info("closeCOnnection0000000000000000");
    if ( !host ) return;
    console.info("closeCOnnection0000000000000001");
    var currentHost = null;
    console.info("closeCOnnection0000000000000002");
    if ( this.currentConnection ) {
    console.info("closeCOnnection0000000000000003");
      currentHost = this.currentConnection.server;
    console.info("closeCOnnection0000000000000004");
    } 
    console.info("closeCOnnection0000000000000005");
    var connection = this.channelList.getConnection( host );
    console.info("closeCOnnection0000000000000006");
    connection.sendCommand( "quit", ["Leaving."], this.getCurrentChannelName( ) );
    console.info("closeCOnnection0000000000000007");
    this.channelList.destroyConnection( host );
    console.info("closeCOnnection0000000000000008");
    this.handleChannelChange( "destroy", null , host );
    console.info("closeCOnnection0000000000000009");
    if ( currentHost == host ) {
    console.info("closeCOnnection000000000000000a");
      this.view.clearActivityView( );
    console.info("closeCOnnection000000000000000b");
      this.view.clearNickView( );
    console.info("closeCOnnection000000000000000c");
      delete this.currentConnection;
    console.info("closeCOnnection000000000000000d");
      delete this.currentChannel;
    console.info("closeCOnnection000000000000000e");
      this.currentConnection = null;
    console.info("closeCOnnection000000000000000f");
      this.currentChannel = null;
    console.info("closeCOnnection0000000000000010");
    }
    console.info("closeCOnnection0000000000000020");
  }

  _ccp.handleChannelChange = function ( type, channelName, serverName, arg ) {
    //handles changes to channel list
    //XXX: this sucks, this special magical flag shit, how does handleChannelsChange have
    //any guarantee that these types wont change, etc
    this.view.updateChannelView( this.channelList.getChannels( ), this.channelsWithActivity, this.channelsHighlighted );
    if ( this.currentConnection && type && type == "part" ) {
      var currentChannelName = this.currentConnection.getChannelName( this.currentChannel.name );
      if ( this.currentConnection.server == serverName && currentChannelName == channelName ) {
        this.setCurrentChannel( this.currentConnection.getServerChannel ( ) );
      }
    } else if ( this.currentConnection && type && type == "nick"  && arg ) {
      this.setCurrentChannel( this.currentConnection.getChannel( arg ) );
    } else if ( type && type == "connect" ) {
      this.handleChannelSelect( serverName, "SERVER",  null );
      this.currentConnection = this.channelList.getConnection( serverName );
      this.setCurrentChannel( this.channelList.getServerChannel( serverName ) );
    } else if ( this.currentConnection && type && type == "join" ) {
      this.setCurrentChannel( this.currentConnection.getChannel( channelName ) );
    }
  }

  _ccp.setCurrentChannel = function ( channel ) {
    if ( this.currentConnection ) {
      util.log("set currentChannel");
      if ( this.channelSubscription ) {
        util.unsubscribe( this.channelSubscription );
      }
      if ( this.nickListSubscription ) {
        util.unsubscribe( this.nickListSubscription );
      }
      delete this.currentChannel;
      var serverName = this.currentConnection.server;
      var channelName = this.currentConnection.getChannelName( channel.name );
      this.view.changeView( serverName, channelName );
      if ( serverName in this.channelsWithActivity  && channelName in this.channelsWithActivity[ serverName ] ) { 
        delete this.channelsWithActivity[ serverName ][ channelName ];
      }
      if ( serverName in this.channelsHighlighted  && channelName in this.channelsHighlighted[ serverName ] ) { 
        delete this.channelsHighlighted[ serverName ][ channelName ];
      }
      this.currentChannel = channel;
      this.currentChannel.publishUserActivity();
      this.view.finishChannelChange( );
      this.handleChannelChange( "set", channelName, serverName );
    }
  }

  _ccp.handleChannelActivity = function ( channelName, serverName, isPM ) {
    if ( !( serverName in this.queryTimer ) ) {
      this.queryTimer[ serverName ] = {};
    }
    if ( !( channelName in this.queryTimer[ serverName ] ) ) {
      this.queryTimer[ serverName ][ channelName ] = null;
    }
    if ( this.queryTimer[ serverName ][ channelName ] ) {
      window.clearTimeout( this.queryTimer[ serverName ][ channelName ] );
      this.queryTimer[ serverName][ channelName ] = null;
    }
    this.queryTimer[ serverName ][ channelName ] = window.setTimeout( util.hitch( this, "updateChannelFromTimer", [ channelName, serverName ] ), 100 );
    if ( this.currentConnection && isPM ) {
    util.log('this.currentConnection: ' + this.currentConnection );
    util.log('this.currentConnection.server: ' + this.currentConnection.server );
    util.log('this.currentConnection.getChannelName: ' + this.currentConnection.getChannelName );
    util.log("this.currentChannel: " + this.currentChannel );
    util.log("this.currentChannel.name: " + this.currentChannel.name );
      if ( !( this.currentConnection.server == serverName && channelName == this.currentConnection.getChannelName( this.currentChannel.name ) ) ) {
        this.updateUnreadActivity( this.channelsWithActivity, channelName, serverName );
      }
    }
  }

  _ccp.handleHighlight = function ( channelName, serverName, nick ) {
    if ( this.currentConnection ) {
      if ( !( this.currentConnection.server == serverName && channelName == this.currentConnection.getChannelName( this.currentChannel.name ) ) ) {
        this.updateUnreadActivity( this.channelsHighlighted, channelName, serverName );
      }
    }
  }

  _ccp.updateUnreadActivity = function ( o, channelName, serverName ) {
      if ( !( serverName in o ) ) {
        o[ serverName ] = {};
      }
      if ( channelName in o[ serverName ] ) {
        o[ serverName ][ channelName ]++;
      } else {
        o[ serverName ][ channelName ] = 1;
      }
      this.handleChannelChange( "update", channelName, serverName ); //activity added to non current window;
  }

  _ccp.updateChannelFromTimer = function ( channelName, serverName ) {
    window.clearTimeout( this.queryTimer[ serverName ][ channelName ] );
    this.queryTimer[ serverName ][ channelName ] = null;
    this.updateChannel( channelName, serverName );
  }

  _ccp.getCurrentChannelName = function ( ) {
    if ( this.currentChannel ) {
      return this.currentChannel.name;
    } else {
      return null;
    }
  }

  _ccp.handleNickListSelection = function ( nick ) {
  }

  _ccp.handleChannelListSelection = function ( channel, server ) {
  }

  _ccp.handleUserActivity = function ( serverName, channelName ) {
    var connection = this.channelList.getConnection( serverName );
    if ( connection ) {
      var channel = this.channelList.getChannel( channelName, serverName );
      if ( !channel ) {
        channel = connection.getServerChannel( );
      }
      if ( channel ) {
        var users = channel.getUsers( );
        var ops = channel.getOps( );
        var voiced = channel.getVoiced( );
        this.view.updateNickView( users, ops, voiced, serverName, channelName ); 
      }
    }
  }

  _ccp.updateChannel = function ( channelName, serverName ) {
    util.log("updateChannel channelName: " + channelName + " serverName: " + serverName );
    var connection = this.channelList.getConnection( serverName );
    if ( connection ) { 
      var channel = this.channelList.getChannel( channelName, serverName );
      if ( !channel ) { 
        channel = connection.getServerChannel( );
      }
      var ops = channel.getOps( );
      var voiced = channel.getVoiced( );
      var nick = connection.getNick( );
      this.view.updateActivityView( channel.getActivity( ), ops, voiced, nick, channelName, serverName );
    }
  }

  _ccp.destroy = function () {
    util.log("destroying dController");
    delete this.channelList;
  }

  //ChannelList Class

  dController.ChannelList = function () {
    this.connections = {};
  }

  _cclp = dController.ChannelList.prototype;

  _cclp.createNewConnection = function ( server, port, defaultChannels, nick, userName, realName ) {
    if ( !( server in this.connections ) ) {
      this.connections[server] = new dConnection.Connection( server, port, defaultChannels, nick, userName, realName );
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

}


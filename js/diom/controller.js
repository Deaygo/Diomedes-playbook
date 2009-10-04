/*
  Copyright (c) 2009 Apphacker apphacker@gmail.com
*/

dojo.provide( "diom.controller" );

var dController;

if(!dController) {
  dController = {};
}

if ( window.runtime && air && util ) {
  //requires AIR and util

  dController.Controller = function ( model, view ) {

    this.model = model;
    this.view = view;
    var u = new air.ApplicationUpdater( );
    this.appVersion = "Diomedes IRC Version: " + u.currentVersion;
    this.view.setAppVersion( this.appVersion );
    this.channelSubscription = null;
    this.channelList = new dController.ChannelList( );
    this.updater = new  dController.Updater( this.model.prefs.getPrefs( ).updateDelay, this.model.prefs.getPrefs( ).updateURL );
    this.linkLog = new dController.LinkLog( );
    this.currentChannel = null;
    this.currentConnection = null;
    this.defaultNick = "diomedesuser"; //TODO: need model & preferences
    this.queryTimer = {};
    this.channelsWithActivity = {};
    this.channelsHighlighted  = {};

    this.ignores = [];
    this.getIgnores( );

    this.aliases = {};
    this.getAliases( );

    this.networks = {};
    this.getNetworks( );

    util.subscribe( diom.topics.USER_INPUT, this, "handleInput", [] );
    util.subscribe( diom.topics.CHANNELS_CHANGED, this, "handleChannelChange", [] );
    util.subscribe( diom.topics.CHANNEL_SELECTED, this, "handleChannelSelect", [] );
    util.subscribe( diom.topics.CHANNEL_ACTIVITY, this, "handleChannelActivity", [] );
    util.subscribe( diom.topics.USER_HIGHLIGHT, this, "handleHighlight", [] );
    util.subscribe( diom.topics.PREFS_SAVE, this, "handlePrefsSave", [] );
    util.subscribe( diom.topics.NETWORK_ADD, this, "handleNetworkAdd", [] );
    util.subscribe( diom.topics.NETWORK_EDIT, this, "handleNetworksEdit", [] );
    util.subscribe( diom.topics.NETWORK_DELETE, this, "handleNetworksDelete", [] );
    util.subscribe( diom.topics.NETWORK_CHANGE, this, "handleNetworksChanged", [] );
    util.subscribe( diom.topics.NETWORK_CLOSE, this, "closeNetworkOrConnection", [] );
    util.subscribe( diom.topics.SERVER_ADD, this, "handleServerAdd", [] );
    util.subscribe( diom.topics.SERVER_DELETE, this, "handleServerDelete", [] );
    util.subscribe( diom.topics.CHANNEL_ADD, this, "handleChannelAdd", [] );
    util.subscribe( diom.topics.CHANNEL_DELETE, this, "handleChannelDelete", [] );
    util.subscribe( diom.topics.PERFORM_ADD, this, "handlePerformAdd", [] );
    util.subscribe( diom.topics.PERFORM_DELETE, this, "handlePerformDelete", [] );
    util.subscribe( diom.topics.ALIAS_ADD, this, "handleAliasAdd", [] );
    util.subscribe( diom.topics.ALIAS_DELETE, this, "handleAliasDelete", [] );
    util.subscribe( diom.topics.ALIAS_CHANGE, this, "getAliases", [] );
    util.subscribe( diom.topics.IGNORE_ADD, this, "handleIgnoreAdd", [] );
    util.subscribe( diom.topics.IGNORE_DELETE, this, "handleIgnoreDelete", [] );
    util.subscribe( diom.topics.IGNORES_CHANGE, this, "getIgnores", [] );
    util.subscribe( diom.topics.CONNECTION_CLOSE, this, "closeConnection", [] );
    util.subscribe( diom.topics.USER_ACTIVITY, this, "handleUserActivity", [] );
  }

  var _ccp = dController.Controller.prototype;

  _ccp.getIgnores= function ( ) {
    this.model.ignores.getIgnores( util.hitch( this, "handleIgnores" ) );
  }

  _ccp.handleIgnores = function ( ignores ) {
    if ( !ignores ) {
      this.ignores = [];
    } else {
      currentIgnores = {};
      for ( var i = 0; i < this.ignores.length; i++ ) {
        currentIgnores[ this.ignores[ i ] ] = 1;
      }
      for ( var i = 0; i < ignores.length; i++ ) {
        var ignore = ignores[ i ].regex;
        if ( !( ignore in currentIgnores ) ) {
          this.ignores.push( ignore );
        }
      }
    }
    util.publish( diom.topics.IGNORES_UPDATE, [ this.ignores ] );
  }

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

  _ccp.getNetworkByHost = function  ( host ) {
    for ( var networkName in this.networks ) {
      var network = this.networks[ networkName ];
      if ( host == network.getHost( ) ) {
        return network;
      }
    }
    return null;
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
    if ( networkName ) {
      return networkName.toLowerCase( );
    } else {
      return null;
    }
  }

  _ccp.handleGetNetworks = function ( networks ) {
    util.log("handleGetNetworks");
    if ( !networks ) return;
    for ( var i = 0; i < networks.length; i++ ) {
      var network = networks[ i ];
      this.setNetwork( network.name, new diom.Network( network, this.model.networks, this.channelList, this.model.prefs, this.appVersion, this.ignores ) );
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
          this.setNetwork( network.name, new diom.Network( network, this.model.networks, this.channelList, this.model.prefs ) );
        } else {
          delete networksFound[ this.formatNetworkName( network.name ) ];
        }
      }
    }
    for ( var networkName in networksFound ) {
      this.removeNetwork( networkName );
    }
  }

  _ccp.handleIgnoreDelete = function ( id ) {
    this.model.ignores.remIgnore( id );
  }

  _ccp.handleIgnoreAdd = function ( data ) {
    this.model.ignores.addIgnore( data.regex, data.active );
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
            this.channelList.createConnection( host, port, this.model.prefs.getPrefs( ), this.appVersion, this.ignores );
            if ( !this.currentConnection ) {
              this.currentConnection = this.channelList.getConnection( host );
              this.setCurrentChannel( this.currentConnection.getServerChannel( ) );
            }
          }
        } else {
          util.log( "not enough args given to connect to server" );
        }
      } else if ( cmd == "network" ) {
        if ( argsR.length > 0 ) {
          var networkName = argsR.shift( );
          var network = this.getNetwork( networkName );
          if ( network ) {
            network.connect( );
            this.currentConnection = network.getConnection( host );
            this.setCurrentChannel( this.currentConnection.getServerChannel( ) );
          }
        }
      } else if ( cmd == "exit" ) {
        if ( this.view.getConfirmation( "exit the application" ) ) {
          window.close( );
        }
      } else if ( cmd == "close" ) {
        if ( this.currentConnection ) {
          this.closeNetworkOrConnection( this.currentConnection.server );
        }
      } else if ( cmd == "help" ) {
        this.view.displayHelp( );
      } else if ( cmd == "clear" ) {
        this.currentChannel.clearActivity( );
        this.view.clearActivityView( );
      } else if ( cmd in this.aliases ) {
        util.publish( diom.topics.USER_INPUT, [ this.createInputFromAlias( this.aliases[ cmd ], argsR ), server ] );
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

  _ccp.closeNetworkOrConnection = function ( host ) {
    if ( this.view.getConfirmation( "close a connection" ) ) {
      var network = this.getNetworkByHost( host );
      if ( network ) {
        network.close( );
      } else {
        this.closeConnection( host );
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
    if ( !host ) return;
    var currentHost = null;
    if ( this.currentConnection ) {
      currentHost = this.currentConnection.server;
    } 
    var connection = this.channelList.getConnection( host );
    connection.sendCommand( "quit", ["Leaving."], this.getCurrentChannelName( ) );
    this.channelList.destroyConnection( host );
    this.handleChannelChange( "destroy", null , host );
    if ( currentHost == host ) {
      this.view.clearActivityView( );
      this.view.clearNickView( );
      delete this.currentConnection;
      delete this.currentChannel;
      this.currentConnection = null;
      this.currentChannel = null;
    }
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
    } else if ( serverName && type && type == "join" ) {
      this.currentConnection = this.channelList.getConnection( serverName );
      this.setCurrentChannel( this.currentConnection.getChannel( channelName ) );
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
      this.view.changeView( serverName, channelName, channel.getTopic( ) );
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

  _ccp.handleUserActivity = function ( serverName, channelName ) {
    var connection = this.channelList.getConnection( serverName );
    if ( connection ) {
      var channel = this.channelList.getChannel( channelName, serverName );
      if ( !channel ) {
        channel = connection.getServerChannel( );
      }
      if ( channel ) {
        var users = channel.getUsers( );
        this.view.updateNickView( users, serverName, channelName ); 
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
      var nick = connection.getNick( );
      this.view.updateActivityView( channel.getActivity( ), nick, channelName, serverName );
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

  dController.Updater = function ( updateDelay, updateURL ) {
    this.updateURL = updateURL;
    this.appUpdater = new runtime.air.update.ApplicationUpdaterUI( ); 
    this.didCheckNow = false;
    var file = new air.File( "app:/updateConfig.xml" );
    this.appUpdater.configurationFile = file;
    this.appUpdater.updateURL = this.updateURL;
    this.appUpdater.delay = updateDelay;
    this.appUpdater.addEventListener( air.StatusUpdateEvent.UPDATE_STATUS, util.hitch( this, "onStatus" ) ); 
    this.appUpdater.initialize();
    util.subscribe( diom.topics.UPDATE_CHECK, this, "checkNow", [] );
    util.subscribe( diom.topics.UPDATE_DELAY_CHANGE, this, "changeUpdateDelay", [] );
    util.subscribe( diom.topics.UPDATE_URL_CHANGE, this, "changeUpdateURL", [] );
  }

  var _cupr = dController.Updater.prototype;

  _cupr.onStatus = function ( event ) {
    if ( this.didCheckNow && !event.available ) {
      this.didCheckNow = false;
      util.publish( diom.topics.UPDATE_NO_NEW_UPDATES );
    }
  }

  _cupr.changeUpdateURL = function ( updateURL ) {
    this.appUpdater.delay = updateURL;
    this.appUpdater.initialize( );
  }

  _cupr.changeUpdateDelay = function ( updateDelay ) {
    this.appUpdater.delay = updateDelay;
    this.appUpdater.initialize( );
  }

  _cupr.checkNow = function ( ) {
    this.didCheckNow = true;
    this.appUpdater.checkNow( );
  }

  _cupr.destroy = function ( ) {
    delete this.appUpdater;
  }

  dController.LinkLog = function ( ) {
    util.subscribe( diom.topics.LINK_FOUND, this, "handleLink", [] );
    this.fetchers = {};
    util.subscribe( diom.topics.LINK_DATA, this, "handleLinkData", [] );
  }

  var _cllp = dController.LinkLog.prototype;

  _cllp.handleLink = function ( link, serverName, channelName, nick ) {
    if ( !( link in this.fetchers ) ) {
      this.fetchers[ link ] = new dController.LinkInfoFetcher( link, serverName, channelName,nick );
    }
  }

  _cllp.handleLinkData = function ( link ) {
    //explicitly deleting fetchers to reduce memory leaks
    if ( link in this.fetchers ) {
      this.fetchers[ link ].destroy( );
      delete this.fetchers[ link ];
    }
  }

  dController.LinkInfoFetcher = function ( link, serverName, channelName, nick ) {
    if ( !link ) return;
    //don't publish secure sites to link log to avoid annoying 
    //bad security certificate popups
    //XXX: in the future maybe just add url without doing deep url inspection
    if ( "https" == link.substr( 0, 5 ) ) return;
    this.url = link;
    link = link.substr( 7 );
    this.serverName = serverName;
    this.channelName = channelName;
    this.nick = nick;
    var linkParts = link.split( "/" );
    this.host = linkParts.shift( );
    this.path = "/";
    if ( linkParts.length ) {
      this.path +=  linkParts.join( "/" );
    }
    this.titleRegex = /<\s*title\s?.*>(.*)<\/\s*title\s*>/g;
    this.bytesRead = 0;
    this.headers = null;
    this.httpStatus = null;
    this.htmlInfo = {};
    this.request = new air.URLRequest( this.url );
    //do not attempt to authenticate
    //this creates an annoying popup box
    this.request.authenticate = false; 
    this.data = "";
    this.title = "";
    this.responseURL = "";
    this.stream = new air.URLStream( );
    this.stream.addEventListener( air.HTTPStatusEvent.HTTP_RESPONSE_STATUS, util.hitch( this, "onStatus" ) ); 
    this.stream.addEventListener( air.ProgressEvent.PROGRESS, util.hitch( this, "onProgress" ) ); 
    this.stream.addEventListener( air.Event.COMPLETE, util.hitch( this, "onComplete" ) ); 
    this.stream.addEventListener( air.IOErrorEvent.IO_ERROR, util.hitch( this, "onError" ) ); 
    this.stream.load( this.request );

  }

  var _clfp = dController.LinkInfoFetcher.prototype;

  _clfp.onComplete = function ( e ) {
    this.stream.close( );
  }

  _clfp.onProgress = function ( e ) {
    this.data = [ this.data, this.stream.readUTFBytes( this.stream.bytesAvailable ) ].join( "" );
    this.checkForTitle( );
  }

  _clfp.checkForTitle = function ( ) {
    var res = this.titleRegex.exec( this.data );
    if ( res && res.length > 1 ) {
      this.stream.close( );
      this.title = res[ 1 ];
      this.publishData( );
    }
  }

  _clfp.onStatus = function ( e ) {
    util.log( "onstatus" );
    this.headers = e.responseHeaders;
    this.httpStatus = e.status;
    this.responseURL = e.responseURL;
    var isHTML = false;
    if ( this.httpStatus == 200 ) {
      for ( var i = 0; i < this.headers.length; i++ ) {
        var header = this.headers[ i ];
        if ( header.name == "Content-Type" && header.value.search( "html" ) != -1 ) {
          isHTML = true;
          break;
        }
      }
    }
    if ( !isHTML ) {
      this.stream.close( );
      this.publishData( );
    }
  }


  _clfp.completeHandler = function ( e ) {
    util.log("complete");
  }


  _clfp.publishData = function( ) {
    util.log("publish");
    var d = new Date( ).toString( );
    util.publish( diom.topics.LINK_DATA, [
        this.url,
        {
          "url": this.url,
          "serverName": this.serverName,
          "channelName": this.channelName,
          "date": d,
          "nick": this.nick,
          "host": this.host,
          "path": this.path,
          "headers": this.headers,
          "httpStatus": this.httpStatus,
          "htmlInfo": this.htmlInfo,
          "responseURL": this.responseURL,
          "title": util.trim( this.title )
        }
    ] );
  }

  _clfp.onError = function ( e ) {
    util.log( " link info fetcher error" );
  }

  _clfp.destroy = function ( ) {
    util.log("destroy");
    delete this.stream;
    delete this.request;
  }

}

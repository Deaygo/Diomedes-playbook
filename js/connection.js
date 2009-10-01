/*
  Copyright (c) 2009 Apphacker apphacker@gmail.com
*/

var dConnection;

if ( !dConnection ) {
  dConnection = {};
}

if ( window.runtime && air && util ) {
  //requires AIR and util
  
  dConnection.CHANNEL_TYPES = { "SERVER":"server", "PM":"pm", "CHANNEL":"channel" }
  
  dConnection.Connection = function ( server, port, preferences, appVersion, ignores ) {

    var nick = preferences.nick;
    this.channels = {};
    this.users = {};
    this.preferences = preferences;
    //XXX: really need to fix the preferences thing - a nice global preferences custom object needed:
    this.logPref = preferences.logging === true || preferences.logging === "true";
    this.ignores = ignores;
    this.host = "";
    this.users[ nick ] = new dConnection.User( nick, "" ); 
    this.server = server;
    this.serverChannel = null;
    this.port = port;
    this.altNickTries = 0;

    this.pollTime = parseInt( preferences.pollTime, 10 );
    this.stayConnected = false;
    this.reconnectId = null;
    this.autoJoin = null;
    this.setAutoJoin( preferences.autoJoin );

    this.client = new irc.Client( server, port, [], nick, preferences.userName, preferences.realName );
    this.client.setClientInfo( appVersion );
    this.client.setFinger( preferences.finger );

    //this.names stores names in addition to channels,
    //because a) you can get the names command before you get the JOIN
    //and b) you can get names without joining channels
    //this.names[ channelName ]; has names
    //it's only ever used when joining a channel to a populate channel's nicklist
    this.names = {};

    //set delegates
    this.client.setConnectionDelegate(util.hitch(this,"handleConnection"));
    this.client.setInviteDelegate(util.hitch(this,"handleInvite"));
    this.client.setJoinDelegate(util.hitch(this,"handleJoin"));
    this.client.setNoticeDelegate(util.hitch(this,"handleNotice"));
    this.client.setQuitDelegate(util.hitch(this,"handleQuit"));
    this.client.setActionDelegate(util.hitch(this,"handleAction"));
    this.client.setMessageDelegate(util.hitch(this,"handleMessage"));
    this.client.setPartDelegate(util.hitch(this,"handlePart"));
    this.client.setNickDelegate(util.hitch(this,"handleNickChange"));
    this.client.setServerDelegate(util.hitch(this,"handleServerMessage"));
    this.client.setNamesDelegate(util.hitch(this,"handleNames"));
    this.client.setTopicDelegate(util.hitch(this,"handleTopic"));
    this.client.setModeDelegate(util.hitch(this, "handleMode"));
    this.client.setKickDelegate(util.hitch(this, "handleKick"));
    util.subscribe( topics.CHANNEL_CLOSE, this, "closeChannel", [] );
    util.subscribe( topics.PREFS_CHANGE_AUTOJOIN, this, "setAutoJoin", [] );
    util.subscribe( topics.IGNORES_UPDATE, this, "handleIgnoresUpdate", [] );
    util.subscribe( topics.PREFS_CHANGE_LOGGING, this, "handleChangeLoggingPref", [] );
  }

  var _cnp = dConnection.Connection.prototype;

  _cnp.handleChangeLoggingPref = function ( newValue ) {
    this.logPref = newValue;
  }

  _cnp.handleIgnoresUpdate = function ( ignores ) {
    util.log( "handle connection ignores update " );
    this.ignores = ignores;
  }

  _cnp.setAutoJoin = function ( autoJoin ) {
    this.autoJoin = ( autoJoin == "true" );
  }

  _cnp.getNick = function ( ) {
    return this.client.getNick( );
  }

  _cnp.getUser = function ( nick ) {
    if ( nick in this.users ) {
      return this.users[ nick ];
    }
    return null;
  }

  _cnp.isIgnored = function ( msg ) {
    if ( !msg.host ) return false;
    if ( !this.ignores ) return false;
    if ( !msg.nick == this.getNick( ) ) return false;
    var from = [ msg.nick, msg.host ].join( "!" );
    for ( var i = 0; i < this.ignores.length; i++ ) {
      var ignore = this.ignores[ i ];
      if ( from.search( ignore ) != -1 ) {
        return true;
      }
    }
    return false;
  }

  _cnp.addActivityToChannel = function( target, msg, from ) {
    //check to see if ignored first:
    if ( this.isIgnored( msg ) ) return;
    //from is optional and is explicit about who the message is from
    //only applicable to private messages
    var isPM = false;
    var _nick = this.getNick( );
    //determine if channel or PM first
    if ( !this.client.isChannelName( target ) ) {
      isPM = true;
      if ( from & from != _nick ) {
        var channelName = this.getChannelName( from );
      } else if ( msg.nick != _nick ) {
        var channelName = this.getChannelName( msg.nick );
      } else {
        var channelName = this.getChannelName( target );
      }
    } else {
      var channelName = this.getChannelName( target );
    }
    if ( channelName in this.channels ) {
      var channel = this.channels[ channelName ];
      channel.addActivity( msg );
    } else if ( isPM ) {
      //open new window for new PM
      if ( from && _nick == from ) {
        if ( this.serverChannel ) {
          msg.msg = [ "PM to ", target, ": ", msg.msg ].join( "" );
          this.serverChannel.addActivity( msg );
        }
      } else {
        util.log( "JOINING PM: " + target );
        this.channels[ channelName ] = new dConnection.Channel( channelName, dConnection.CHANNEL_TYPES.PM, this.server, this.logPref );
        var channel = this.channels[ channelName ];
        util.publish( topics.CHANNELS_CHANGED, [] );
        channel.addActivity( msg );
        if ( !( target in this.users ) ) {
          this.users[ target ] = new dConnection.User( target, "" );
        }
        channel.addUser( this.users[ target ] );
        channel.addUser( this.users[ _nick ] );
        channel.publishUserActivity( );
      }
    }
    delete msg;
  }

  _cnp.connect = function () {
    this.stayConnected = true;
    this.client.connect( );
    this.serverChannel = new dConnection.Channel( this.server, dConnection.CHANNEL_TYPES.SERVER, this.server, this.logPref );
    util.publish( topics.CHANNELS_CHANGED, [] );
  }

  _cnp.reconnect = function ( ) {
    if ( this.stayConnected ) {
      this.connect( );
    }
  }

  _cnp.isConnected = function ( ) {
    return this.client.isConnected( );
  }

  _cnp.close = function ( ) {
    this.cancelReconnect( );
    this.stayConnected = false;
    this.client.closeConnection( "Closed connection." );
  }

  _cnp.handleInvite = function ( nick, target ) {
    var msg_ = [ "You have been invited to", target, "by", nick ].join( " " ); 
    var msg = new dConnection.ActivityItem( "server", null, null, msg_, null, null );
    this.serverChannel.addActivity( msg );
    if ( this.autoJoin ) {
      this.client.join( target );
    }
  }

  _cnp.handleConnection = function ( msg, connected, nickInUse ) {
    var msg_ = new dConnection.ActivityItem( "server", null, null, msg, null, null );
    if ( nickInUse && this.getNick( ) != this.preferences.altNick && !this.altNickTries ) {
      this.altNickTries = 1;
      this.client.changeNick( this.preferences.altNick );
      return;
    }
    if ( !connected ) {
      for ( var target in this.channels ) {
        this.channels[ target ].addActivity( msg_ );
      }
      this.serverChannel.addActivity( msg_ );
      util.log("PUBLISHING CONNECTION_DISCONNECTED: " + this.server );
      util.publish( topics.CONNECTION_DISCONNECTED, [ this.server ] );
      var pollTime = this.pollTime;
      if ( pollTime && this.stayConnected ) {
        this.reconnectId = window.setTimeout( util.hitch( this, "reconnect" ), pollTime * 1000 );
      }
    } else {
      var channels = [];
      for ( var channelName in this.channels ) {
        channels.push( channelName );
      }
      this.serverChannel.addActivity( msg_ );
      if ( channels.length ) {
        this.client.join( channels );
      } 
      util.publish( topics.CHANNELS_CHANGED, [ "connect", null, this.server ] );
    }
  }

  _cnp.handleJoin = function ( nick, host, target ) {
    //add nick to connection users
    if ( !nick || !target ) return;
    var channelName = this.getChannelName( target );
    var _nick = this.getNick( );
    if ( nick == _nick ) {
      util.log( "JOINING CHANNEL: " + target );
      this.channels[ channelName ] = new dConnection.Channel( target, dConnection.CHANNEL_TYPES.CHANNEL, this.server, this.logPref );
      this.client.getTopic( target );
      util.publish( topics.CHANNELS_CHANGED, [ "join", channelName, this.server ] );
      if ( channelName in this.names ) {
        this.addNamesToChannel( channelName, this.names[ channelName ] );
      } else {
        this.client.sendNames( target );
      }
    }
    var user = this.getUser( nick );
    if ( !user ) {
      user = new dConnection.User( nick, host ); 
      this.users[nick] = user;
    }
    //add nick to channel
    if (channelName in this.channels) {
      var channel = this.channels[channelName];
      channel.addUser(user);
      channel.publishUserActivity( );
    }
    var msg = new dConnection.ActivityItem( "join", nick, target, null, user, host );
    this.addActivityToChannel( target, msg );
  }

  _cnp.handleNotice = function ( nick, host, target, msg ) {
    var user = this.getUser( nick );
    if ( user ) user.setHost( host );
    var msg = new dConnection.ActivityItem( "notice", nick, target, msg, user, host );
    for ( var channel in this.channels ) {
      this.addActivityToChannel( channel, msg, channel );
    }
    this.serverChannel.addActivity( msg );
  }

  _cnp.handleQuit = function ( nick, host, msg ) {
    //remove nick from channels
    var user = this.getUser( nick );
    if ( user ) {
      user.setHost( host );
      var msg = new dConnection.ActivityItem( "quit", nick, null, msg, user, host );
      for ( var target in this.channels ) {
        var channel = this.channels[ target ];
        if ( channel.hasUser( user.nick ) ) {
          //check channels nick is in
          channel.addActivity( msg );
          channel.remUser( user );
          channel.publishUserActivity( );
        }
      }
      //remove nick's user from Connection
      delete this.users[nick];
    }
  }

  _cnp.handleMode = function ( nick, host, target, msg, modes ) {
    if ( msg ) {
      var channelName = this.getChannelName( target );
      if ( channelName in this.channels ) {
        var channel = this.channels[ channelName ];
        channel.addModes( modes );
        channel.publishUserActivity( );
      }
      user = this.getUser( nick );
      var msg = new dConnection.ActivityItem("mode", nick, target, msg, user, host );
      this.addActivityToChannel( target, msg );
    }
  }

  _cnp.handleKick = function ( nick, kickedNick, host, target, msg ) {
    util.log( "handling kick nick: "  + nick + " kickedNick: " + kickedNick );
    var user = this.getUser( nick );
    if ( user ) user.setHost( host );
    var altUser = this.getUser( kickedNick );
    var msg = new dConnection.ActivityItem( "kick", nick, target, msg, user, host, altUser );
    if ( kickedNick != this.getNick( ) ) {
      this.remUserFromChannel( kickedNick, target );
      this.addActivityToChannel( target, msg );
    } else {
      var channelName = this.getChannelName( target );
      if ( channelName in this.channels ) {
        this.serverChannel.addActivity( msg );
        delete this.channels[ channelName ];
        util.publish( topics.CHANNELS_CHANGED, [ "part", channelName, this.server ] );
      }
    }
  }

  _cnp.handleAction = function ( nick, host, target, msg ) {
    var user = this.getUser( nick );
    if ( user ) user.setHost( host );
    var msg = new dConnection.ActivityItem( "action", nick, target, msg, user, host );
    if ( this.referencesUser( msg.msg ) ) {
      msg.setReferencesUser( );
    } 
    this.addActivityToChannel( target, msg );
  }

  _cnp.handleMessage = function ( nick, host, target, msg ) {
    //XXX: if target is this.getNick( ) and nick not a channel, open new channel
    var user = this.getUser( nick );
    if ( user ) user.setHost( host );
    var msg = new dConnection.ActivityItem( "privmsg", nick, target, msg, user, host );
    if ( this.referencesUser( msg.msg, target, nick ) ) {
      msg.setReferencesUser( );
    } 
    this.addActivityToChannel( target, msg, nick );
  }

  _cnp.referencesUser = function ( msg, target, nick ) {
    var _nick = this.getNick( );
    if ( msg && msg.length && ( nick != _nick ) ) { 
      var referencesUser = ( msg.search( _nick.split("-").join("\\-").split( "|" ).join( "\\|" ).split( "^" ).join( "\\^" ) ) != -1 );
      if ( referencesUser ) {
        util.publish( topics.USER_HIGHLIGHT, [ this.getChannelName( target ), this.server, _nick ] );
        return true;
      }
    }
    return false;
  }

  _cnp.remUserFromChannel = function ( nick, target ) {
    var user = this.getUser( nick );
    if ( user ) {
      var channelName = this.getChannelName( target );
      if ( channelName in this.channels ) {
        var channel = this.channels[ channelName ];
        channel.remUser( user );
        channel.publishUserActivity( );
      }
      userExists = false;
      //possibly remove nick from connection users
      for ( var channelName in this.channels ) {
        if ( this.channels[ channelName ].hasUser( user.nick ) ) {
          userExists = true;
          break;
        }
      }
      if ( !userExists ) {
        delete this.users[ nick ];
      }
    }
  }

  _cnp.handlePart = function ( nick, host, target, msg ) {
    if ( !msg ) msg = "";
    var user = this.getUser( nick );
    if ( user ) user.setHost( host );
    var msg = new dConnection.ActivityItem( "part", nick, target, msg, user, host );
    this.addActivityToChannel( target, msg );
    this.remUserFromChannel( nick, target );
  }

  _cnp.handleNickChange = function ( nick, host, newNick ) {
    util.log( "nick: " + nick + " host: " + host + " newNick: " + newNick );
    var user = this.getUser( nick );
    if ( user ) {
      user.setHost( host );
      user.rename( newNick );
      delete this.users [ nick ];
      this.users[ newNick ] = user;
      var msg = new dConnection.ActivityItem( "nick", nick, null, newNick, this.getUser( newNick ), host );
      //check channels nick is in
      for ( var target in this.channels ) {
        if ( this.channels[ target ].hasUser( nick ) ) {
          var channel = this.channels[target];
          util.log( "changing " + nick + " to " + user.nick + " in " + target );
          channel.renameUser( nick, newNick );
          channel.publishUserActivity( );
          this.addActivityToChannel( target, msg );
        }
      }
      //XXX: also check open channel names to see if they're the nick (PM's)
    }
    var channelName = this.getChannelName( nick );
    if ( channelName in this.channels ) {
      var newChannelName = this.getChannelName( newNick );
      this.channels[ newChannelName ] = this.channels[ channelName ];
      this.channels[ newChannelName ].setName( newNick );
      delete this.channels[ channelName ];
      util.publish( topics.CHANNELS_CHANGED, [ "nick", channelName, this.server, newChannelName ] );
    }

    if ( nick == this.getNick( ) ) {
      this.serverChannel.addActivity( msg );
    }
    delete msg;
  }

  _cnp.handleServerMessage = function ( host, msg, target ) {
    var msg = new dConnection.ActivityItem( "server", null, target, msg, host );
    if ( this.client.isChannelName( target ) ) {
      this.addActivityToChannel( target, msg );
    } else {
      this.serverChannel.addActivity( msg );
    }
    delete msg;
  }

  _cnp.getChannelName = function ( target ) {
    return target.toLowerCase( );
  }

  _cnp.addNamesToChannel = function ( channelName, nicks ) {
    var channel = this.channels[ channelName ];
    //user = new dConnection.User(nick, host); 
    //update names
    channel.remUsers( ); //if names not in this list then no longer in channel
    for ( var i = 0; i < nicks.length; i++ ) {
      //create users if don't exist
      //add to channel
      var nick = nicks[i];
      var mode = nick[0];
      var host = "";
      if (mode == "@" || mode == "+" || mode == "%" || mode == "!" ) {
        nick = nick.substr( 1 );
      } else {
        mode = null;
      }
      var user = this.getUser( nick );
      if (!user) {
        user = new dConnection.User( nick, host, mode ); 
        this.users[ nick ] = user;
      } 
      channel.addUser( user );
      if ( mode == "@" ) {
        user.op( channelName );
      } else if ( mode == "!" ) {
        user.creator( channelName );
      } else if ( mode == "+" ) { 
        user.voice( channelName );
      } else if ( mode == "%" ) { 
        user.halfOp( channelName );
      }
    }
    channel.publishUserActivity( );
  }

  _cnp.handleNames = function ( target, nicks ) {
    var channelName = this.getChannelName( target );
    if ( !( channelName in this.channels ) ) {
      this.names = [ channelName ] = nicks;
    } else {
      this.addNamesToChannel( channelName, nicks );
    }
  }

  _cnp.handleTopic = function ( host, target, topic, topicSetter, datetime ) {
    var msg = new dConnection.ActivityItem( "topic", topicSetter, target, topic, host );
    msg.setAltDatetime( datetime );
    this.addActivityToChannel( target, msg );
    var channelName = this.getChannelName( target );
    if ( channelName in this.channels ) {
      var channel = this.channels[ channelName ];
      channel.setTopic( topic );
    }
    util.publish( topics.CHANNEL_TOPIC, [ this.server, channelName, topic ] );
    delete msg;
  }

  _cnp.getServerChannel = function ( ) {
    return this.serverChannel;
  }

  _cnp.getChannel = function ( name ) {
    var channelName = this.getChannelName( name );
    if ( channelName in this.channels ) {
      var channel = this.channels[ channelName ];
      return channel;
    } else {
      return null;
    }
  }

  _cnp.addNewChannel = function ( name, type ) {
    this.channels[ name ] = new dConnection.Channel( name, type, this.server, this.logPref );
  }

  _cnp.getChannels = function ( ) {
    return this.channels;
  }

  _cnp.sendCommand = function ( cmd, args, target ) {
    //XXX: figure out what to do here
    //XXX: using a switch for now, need something better in the future
    switch ( cmd.toLowerCase( ) ) {
      case "nick":
        this.client.changeNick( args.shift( ) );
        util.log( "attempting to change nick" );
        break;
      case "join":
        this.client.join( args );
        util.log( "attempting to join channel(s)." );
        break;
      case "mode":
        var msg = "";
        if ( args && args.length ) {
          msg = args.join( " " );
        } 
        this.client.sendMode( msg );
        break;
      case "kick":
        var msg = "";
        if ( args && args.length > 1 ) {
          var channel = args.shift( );
          var nick = args.shift( );
          if ( !nick ) {
            nick = channel;
            channel = target;
          }
          if ( args.length ) {
            var msg = args.join( " " );
          }
        }
        this.client.sendKick( channel, nick, msg );
        break;
      case "motd":
        this.client.sendMOTD( );
        break;
      case "whois":
        var msg = "";
        if ( args && args.length ) {
          msg = args.join( " " );
        } 
        this.client.sendWhoIs( msg );
        break;
      case "whowas":
        var msg = "";
        if ( args && args.length ) {
          msg = args.join( " " );
        } 
        this.client.sendWhoWas( msg );
        break;
      case "squit":
        if ( args && args.length > 1 ) {
          var serverName = args.shift( );
          var msg = args.join( " " );
          this.client.sendSQuit( serverName, msg );
        }
        break;
      case "invite":
        if ( args && args.length > 1 ) {
          var nick = args.shift( );
          var channel = args.shift( );
          this.client.sendInvite( nick, channel );
        }
        break;
      case "die":
      case "restart":
      case "rehash":
        var _cmd = cmd;
        var funcName = "send" + _cmd; 
        if ( funcName in this.client ) {
          this.client[ funcName ]( );
        }
        break;
      case "away":
      case "pass":
      case "wallops":
      case "users":
      case "info":
      case "admin":
      case "trace":
      case "time":
      case "version":
        var param;
        if ( args && args.length ) {
          param = args.shift( );
        } else {
          param = null;
        }
        var _cmd = cmd;
        _cmd = _cmd[ 0 ].toUpperCase( ) + _cmd.substr( 1 );
        var funcName = "send" + _cmd; 
        if ( funcName in this.client ) {
          this.client[ funcName ]( param );
        }
        break;
      case "ison":
      case "list":
      case "userhost":
      case "summon":
      case "ping":
      case "kill":
      case "who":
      case "squery":
      case "connect":
      case "link":
      case "stats":
      case "lusers":
      case "oper":
      case "service":
        var params = "";
        if ( args && args.length ) {
          params = args.join( " " );
        } 
        var _cmd = cmd;
        _cmd = _cmd[ 0 ].toUpperCase( ) + _cmd.substr( 1 );
        var funcName = "send" + _cmd; 
        if ( funcName in this.client ) {
          this.client[ funcName ]( params );
        }
        break;
      case "part":
        var msg = "";
        if ( args && args.length ) {
          if ( this.client.isChannelName( args[0] ) ) {
            target = args.shift( );
          }
          if ( args.length ) {
            var msg = args.join( " " );
          }
        }
        this.partChannel( target, msg );
        break;
      case "quit":
        var msg = "";
        if ( args && args.length ) {
          msg = args.join( " " );
        } 
        this.client.sendQuit( msg );
        break;
      case "ctcp":
        if ( args && args.length > 1 ) {
          var target = args.shift( );
          var msg = args.join( " " );
          if ( util.trim( msg ).toLowerCase( ) == "ping" ) {
            this.client.sendCTCPPing( target );
          } else { 
            this.client.sendCTCP( target, msg );
          }
        }
        break;
      case "me":
        var msg = args.join( " " );
        this.client.sendAction( target, msg );
        this.handleAction( this.getNick( ), this.host, target, msg );
        break;
      case "names":
        if ( this.client.isChannelName( target ) ) {
          this.client.sendNames( target );
        }
      case "msg":
        if ( args && args.length > 1 ) {
          var target = args.shift( );
          var msg = args.join( " " );
          this.sendMessage( target, msg );
        }
        break;
      case "notice":
        if ( args && args.length > 1 ) {
          var target = args.shift( );
          var msg = args.join( " " );
          this.client.sendNotice( target, msg );
          this.handleNotice( this.getNick( ), this.host, target, msg );
        }
        break;
      case "topic":
        if ( args && args.length ) {
          var t = args.shift( );
          if ( !this.client.isChannelName( t ) ) {
            args.unshift( t );
            t = target;
          }
          var msg = args.join( " " );
        } else {
          msg = "";
          t = target;
        }
        this.client.topic( t, msg );
        break;
    }
  }

  _cnp.sendMessage = function ( target, msg ) {
    if ( msg && target ) {
      if ( target == this.server ) return;
      this.client.sendPM( target, msg ); 
      this.handleMessage( this.getNick( ), this.host, target, msg );
    }
  }

  _cnp.closeChannel = function ( serverName, channelName ) {
    if ( serverName == this.server ) {
      this.partChannel( channelName, "Closed channel window." );
    }
  }

  _cnp.partChannel = function ( target, msg ) {
    var channelName = this.getChannelName( target );
    if ( channelName && channelName in this.channels ) {
      if ( this.client.isChannelName( channelName ) ) {
        util.log( "parting " + channelName );
        this.client.part( target, msg );
      }
      var users = this.channels[ channelName ].getUsers( );
      for ( var user in users ) {
        var stillExists = false;
        for ( var target in this.channels ) {
          if ( target != channelName ) {
            var tempUsers = this.channels[ target ].getUsers( );
            if ( user.nick in tempUsers ) {
              stillExists = true;
              break;
            }
          }
        }
        if ( !stillExists ) {
          //if not delete from connection user list
          delete this.users[ user.nick ];
        }
      }
      //delete channel from connection
      delete this.channels[ channelName ];
      util.publish( topics.CHANNELS_CHANGED, [ "part", channelName, this.server ] );
    }
  }

  _cnp.cancelReconnect = function ( ) {
    if ( this.reconnectId ) {
      window.clearTimeout( this.reconnectId );
      this.reconnectId = null;
    }
  }

  _cnp.destroy = function ( ) {
    this.stayConnected = false;
    if ( this.client ) {
      this.client.destroy( );
      delete this.client;
      for ( user in this.users ) {
        this.users[ user ].destroy( );
        delete this.users[ user ];
      }
      for ( channel in this.channels ) {
        this.channels[ channel ].destroy( );
        delete this.channels[ channel ];
      }
      this.serverChannel.destroy( );
      delete this.serverChannel;
    }
  }

  //Channel Class
  dConnection.Channel = function ( name, type, server, logPref ) {
    this.name = name;
    this.type = type;
    this.server = server;
    this.users = {};
    this.topic = null;
    this.activityList = new dConnection.ActivityList( );
    this.logPref = logPref;
    this.logger = new logger.Logger( server, name );
    this.isLogOpen = false;
    if ( logPref ) {
      this.logger.open( );
      this.isLogOpen = true;
    }
    util.subscribe( topics.PREFS_CHANGE_LOGGING, this, "handleChangeLoggingPref", [] );
  }

  var _clp = dConnection.Channel.prototype;

  _clp.handleChangeLoggingPref = function ( newValue ) {
    this.logPref = newValue;
    if ( newValue && !this.isLogOpen ) {
      this.logger.open( );
      this.isLogOpen = true;
    } else if ( !newValue && this.isLogOpen ) {
      this.logger.close( );
      this.isLogOpen = false;
    }
  }

  _clp.getChannelName = dConnection.Connection.prototype.getChannelName;

  _clp.setTopic = function ( topic ) {
    this.topic = topic;
  }

  _clp.getTopic = function ( ) {
    return this.topic;
  }

  _clp.renameUser = function ( oldNick, newNick ) {
    if ( oldNick in this.users ) {
      var user = this.users[ oldNick ];
      delete this.users[ oldNick ];
      this.users[ newNick ] = user;
    }
  }

  _clp.addModes = function ( modes ) {
    for ( var i = 0; i < modes.length; i++ ) {
      var mode = modes[i];
      var nick = mode.arg;
      if ( nick in this.users ) {
        var user = this.users[ nick ];
        var channelName = this.getChannelName( this.name );
        if ( mode.type == "O" ) {
          if ( mode.toggle == "+" ) {
            user.creator( channelName );
          } else {
            user.deCreator( channelName );
          }
        } else if ( mode.type == "o" ) {
          if ( mode.toggle == "+" ) {
            user.op( channelName );
          } else {
            user.deOp( channelName );
          }
        } else if ( mode.type == "v" ) {
          if ( mode.toggle == "+" ) {
            user.voice( channelName );
          } else {
            user.deVoice( channelName );
          }
        } else if ( mode.type == "h" ) {
          if ( mode.toggle == "+" ) {
            user.halfOp( channelName );
          } else {
            user.deHalfOp( channelName );
          }
        }
      }
    }
  }

  _clp.setName = function ( name ) {
    //if it's actually a pm window user can change nicks
    this.name = name;
  }

  _clp.getName = function ( ) {
    return this.name;
  }

  _clp.remUsers = function ( ) {
    for ( var nick in this.users ) {
      delete this.users[nick];
    }
    this.users = {};
  }

  _clp.addUser = function ( user ) {
    this.users[ user.nick ] = user;
  }

  _clp.hasUser = function ( nick ) {
    return ( nick in this.users );
  }

  _clp.remUser = function ( user ) {
    var nick = user.nick;
    if ( nick in this.users ) {
      delete this.users[ user.nick ];
    }
  }

  _clp.getUsers = function ( ) {
    return this.users;
  }

  _clp.addActivity = function ( msg ) {
    this.activityList.addMessage( msg.clone( ) );
    if ( this.logPref ) {
      this.logger.addLine( msg.getNickWithStatus( this.name ), msg.getMsg( ), msg.datetime ); 
      this.logger.write( );
    }
    this.publishActivity( ( msg.cmd in { "privmsg" : 1, "action" : 1 } ) );
    delete msg;
  }

  _clp.clearActivity = function ( ) {
    this.activityList.clearActivity( );
  }

  _clp.publishActivity = function ( isPM ) {
    util.publish( topics.CHANNEL_ACTIVITY, [ this.getChannelName( this.name ), this.server, isPM ] );
  }

  _clp.publishUserActivity = function ( ) {
    util.publish( topics.USER_ACTIVITY, [ this.server, this.getChannelName( this.name ) ] );
  }

  _clp.getActivity = function ( msg ) {
    var msgs =  this.activityList.getMessages( );
    return msgs
  }

  _clp.destroy = function ( ) {
    this.activityList.destroy( );
    this.logger.close( );
    this.isLogOpen = false;
    this.logger.destroy( );
    delete this.logger;
    delete this.activityList;
    delete this.users;
  }

  //Activity Item Class
  dConnection.ActivityItem = function ( cmd, nick, target, msg, user, host, altUser ) {
    this.cmd = cmd;
    this.nick = nick;
    this.user = ( user ? user : null );
    this.host = host;
    this.target = target;
    this.msg = msg;
    this.datetime = new Date();
    this.altDatetime = null;
    this.displayMsg = null;
    this.altUser = altUser;
    this._referencesUser = false;

    this._isServer = false; 
    this._isAction = false;
    this._showBrackets = true;
    this._isNotice = false;
    this._useAltUser = null;
    this._altMsg = null;
    this._setProperties( );
  }

  var _cai = dConnection.ActivityItem.prototype;

  _cai.clone = function ( ) {
    var ai = new dConnection.ActivityItem( this.cmd, this.nick, this.target, null, this.user, this.host, this.altUser );
    ai.msg = this.msg; //avoid resanitizing
    ai.setDateTime( this.datetime );
    ai.setAltUser( this.altUser );
    ai.setAltDatetime( this.altDatetime );
    ai._referencesUser = this._referencesUser;

    ai._isServer = this._isServer;
    ai._isAction = this._isAction;
    ai._showBrackets = this._showBrackets;
    ai._isNotice = this._isNotice;
    ai._useAltUser = false;
    ai._altMsg = this._altMsg;

    return ai;
  }

  _cai.isServer = function ( ) {
    return this._isServer;
  }

  _cai.isAction = function ( ) {
    return this._isAction;
  }

  _cai.showBrackets = function ( ) {
    return this._showBrackets;
  }

  _cai.isNotice = function ( ) {
    return this._isNotice;
  }

  _cai.getUser = function ( ) {
    if ( this._useAltUser ) {
      return this.getAltUser( );
    } else {
      return this.user;
    }
  }

  _cai.getMsg = function ( ) {
    if ( this._altMsg ) {
      return this._altMsg;
    } else {
      return this.msg;
    }
  }

  _cai.getNickWithStatus = function ( channelName ) {
    if ( !channelName ) { 
      return null; 
    }
    var user = this.getUser( );
    if ( this.isServer( ) ) {
      return  "Server";
    } else if ( user && user.isCreator( channelName ) ) {
      return "!" + this.nick;
    } else if ( user && user.isOp( channelName ) ) {
      return this.nick;
    } else if ( user && user.isHalfOp( channelName ) ) {
      return "%" + this.nick;
    } else if ( user && user.isVoice( channelName ) ) {
      return "+" + this.nick;
    } 
    return this.nick;
  }

  _cai._setProperties = function ( ) {
    if ( this.cmd ) {
      //XXX: need to get rid of this switch statement some how
      switch ( this.cmd.toLowerCase( ) ) {
        case "mode":
          this._isServer = true;
          this._altMsg = this.nick + " has changed modes for " + this.target + " to: " + this.msg;
          break;
        case "action":
          this._isAction = true;
          this._showBrackets = false;
          break;
        case "kick":
          this._isServer = true;
          this._useAltUser = true;
          util.log( "bef getAltUser" );
          this._altMsg = this.nick + " has kicked " + this.makeFullID( this.getAltUser( ).nick, this.getAltUser( ) ) + " from " + this.target + ": " + this.msg;
          util.log( "after getAltUser" );
          break;
        case "part":
          this._isServer = true;
          //XXX: make a pref here about showing quit messages
          this._altMsg = this.makeFullID( this.nick, this.user ) + " has parted " + this.target + ": " + this.msg;
          break;
        case "topic":
          this._isServer = true;
          var d = " On " + this.getAltDatetime( ).toUTCString( ) + " "; 
          this._altMsg = d + this.nick + " set the topic for " + this.target + " to: " + this.msg;
          break;
        case "notice":
          this._altMsg = this.target + ": - NOTICE - " + this.msg;
          this._isNotice = true;
          break;
        case "join":
          this._isServer = true;
          this._altMsg = this.makeFullID( this.nick, this.user ) + " has joined " + this.target + ".";
          break;
        case "nick":
          this._altMsg = this.nick + " is now known as " + this.msg + ".";
          this._isServer = true;
          break;
        case "quit":
          this._altMsg = this.makeFullID( this.nick, this.user ) + " has quit: " + this.msg;
          this._isServer = true;
          break;
        case "server":
          this._isServer = true;
          break;
      }
    }
  }

  _cai.makeFullID = function ( nick, user ) {
    if ( user ) {
      var host = user.getHost( );
      if ( host ) {
        nick = [ nick, "!", host ].join( "" );
      }
    }
    return nick;
  }

  _cai.setDateTime = function ( datetime ) {
    delete this.datetime;
    this.datetime = datetime;
  }

  _cai.setAltDatetime = function ( datetime ) {
    if ( this.altDatetime ) delete this.altDatetime;
    this.altDatetime = datetime;
  }

  _cai.getAltDatetime = function ( ) {
    if ( this.altDatetime ) {
      return this.altDatetime;
    } else {
      return this.datetime;
    } 
  }

  _cai.setAltUser = function ( altUser ) {
    this.altUser = altUser;
  }

  _cai.setReferencesUser = function ( ) {
    this._referencesUser = true;
  }

  _cai.referencesUser = function ( ) {
    return this._referencesUser;
  }

  _cai.getAltUser = function ( ) {
    return this.altUser;
  }

  _cai.setDisplay = function ( display ) {
    this.displayMsg = display;
  }

  _cai.getDisplay = function ( ) {
    return this.displayMsg;
  }

  _cai.destroy = function ( ) {
    delete this.datetime;
  }

  //ActivityList Class
  dConnection.ActivityList = function ( maxItems ) {
    this.messages = [];
    this.maxItems = 500; //XXX: should be a preference
    util.subscribe( topics.PREFS_CHANGE_HISTORY_LENGTH, this, "handleChangeHistoryLength", [] );
  }

  var _cap = dConnection.ActivityList.prototype;

  _cap.handleChangeHistoryLength = function ( newLen ) {
    this.maxItems = newLen;
  }

  _cap.addMessage = function ( msg ) {
    if ( this.messages.length >= this.maxItems ) {
      var t_msg = this.messages.shift( );
      delete t_msg;
    }
    this.messages.push( msg );
    delete msg;
  }

  _cap.clearActivity = function ( ) {
    for ( var i = 0; i < this.messages.length; i++ ) {
      delete this.messages[i];
    }
    this.messages = [];
  }

  _cap.getMessages = function ( ) {
    return this.messages;
  }

  _cap.destroy = function ( ) {
    for ( var i = 0; i < this.messages.length; i++ ) {
      this.messages[ i ].destroy( );
      delete this.messages[ i ];
    }
  }

  //User Class
  dConnection.User = function ( nick, host ) {
    this.update( nick, host );
    this.nick = nick;
    this.host = host;
    this._op = {};
    this._voice = {};
    this._halfOp = {};
    this._creator = {};
  }

  var _cup = dConnection.User.prototype;

  _cup.rename = function ( newName ) {
    this.nick = newName;
  }

  _cup.setHost = function ( host ) {
    this.host = host;
  }

  _cup.getHost = function ( ) {
    return this.host;
  }

  _cup.op = function ( channelName ) {
    this._op[ channelName ] = true;
  }

  _cup.deOp = function ( channelName ) {
    if ( channelName in this._op ) delete this._op[ channelName ];
  }

  _cup.isOp = function ( channelName ) {
    return ( channelName in this._op );
  }

  _cup.voice = function ( channelName ) {
    this._voice[ channelName ] = true;
  }

  _cup.deVoice = function ( channelName ) {
    if ( channelName in this._voice ) delete this._voice[ channelName ];
  }

  _cup.isVoice = function ( channelName ) {
    return ( channelName in this._voice );
  }

  _cup.halfOp = function ( channelName ) {
    this._halfOp[ channelName ] = true;
  }

  _cup.deHalfOp = function ( channelName ) {
    if (channelName in this._halfOp ) delete this._halfOp[ channelName ];
  }

  _cup.isHalfOp = function ( channelName ) {
    return ( channelName in this._halfOp );
  }

  _cup.creator = function ( channelName ) {
    this._creator[ channelName ] = true;
  }

  _cup.deCreator = function ( channelName ) {
    if ( channelName in this._creator ) delete this._creator[ channelName ];
  }

  _cup.isCreator = function ( channelName ) {
    return ( channelName in this._creator );
  }

  _cup.update = function ( nick, host ) {
    this.nick = nick;
    this.host = host;
  }

  _cup.destroy = function ( ) {
    delete this.nick;
    delete this.host;
  }

}




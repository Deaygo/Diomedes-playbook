/*
  Copyright (c) 2009 Apphacker apphacker@gmail.com
*/
/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom */

dojo.provide( "diom.connection.connection" );

dojo.declare( "diom.connection.Connection", null, {

  CHANNEL_TYPES: { "SERVER":"server", "PM":"pm", "CHANNEL":"channel" },

  constructor: function ( server, port, preferences, appVersion, ignores ) {

    var nick = preferences.nick;
    this.channels = {};
    this.users = {};
    this.preferences = preferences;
    //XXX: really need to fix the preferences thing - a nice global preferences custom object needed:
    this.logPref = preferences.logging === true || preferences.logging === "true";
    this.ignores = ignores;
    this.host = "";
    this.users[ nick ] = new diom.connection.User( nick, "" ); 
    this.server = server;
    this.serverChannel = null;
    this.port = port;
    this.altNickTries = 0;

    this.pollTime = parseInt( preferences.pollTime, 10 );
    this.stayConnected = false;
    this.reconnectId = null;
    this.autoJoin = null;
    this.setAutoJoin( preferences.autoJoin );

    this.client = new diom.IRCClient( server, port, [], nick, preferences.userName, preferences.realName );
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
    util.subscribe( diom.topics.CHANNEL_CLOSE, this, "closeChannel", [] );
    util.subscribe( diom.topics.PREFS_CHANGE_AUTOJOIN, this, "setAutoJoin", [] );
    util.subscribe( diom.topics.IGNORES_UPDATE, this, "handleIgnoresUpdate", [] );
    util.subscribe( diom.topics.PREFS_CHANGE_LOGGING, this, "handleChangeLoggingPref", [] );
  },

  handleChangeLoggingPref: function ( newValue ) {
    this.logPref = newValue;
  },

  handleIgnoresUpdate: function ( ignores ) {
    util.log( "handle connection ignores update " );
    this.ignores = ignores;
  },

  setAutoJoin: function ( autoJoin ) {
    this.autoJoin = ( autoJoin === "true" );
  },

  getNick: function ( ) {
    return this.client.getNick( );
  },

  getUser: function ( nick ) {
    if ( nick in this.users ) {
      return this.users[ nick ];
    }
    return null;
  },

  isIgnored: function ( msg ) {
    var from, i, ignore;
    if ( !msg.host ) { return false; }
    if ( !this.ignores ) { return false; }
    if ( !msg.nick === this.getNick( ) ) { return false; }
    from = [ msg.nick, msg.host ].join( "!" );
    for ( i = 0; i < this.ignores.length; i++ ) {
      ignore = this.ignores[ i ];
      if ( from.search( ignore ) !== -1 ) {
        return true;
      }
    }
    return false;
  },

  addActivityToChannel: function( target, msg, from ) {
    var isPM, _nick, channelName, channel;
    //check to see if ignored first:
    if ( this.isIgnored( msg ) ) { return; }
    //from is optional and is explicit about who the message is from
    //only applicable to private messages
    isPM = false;
    _nick = this.getNick( );
    //determine if channel or PM first
    if ( !this.client.isChannelName( target ) ) {
      isPM = true;
      if ( from && from !== _nick ) {
        channelName = this.getChannelName( from );
      } else if ( msg.nick !== _nick ) {
        channelName = this.getChannelName( msg.nick );
      } else {
        channelName = this.getChannelName( target );
      }
    } else {
      channelName = this.getChannelName( target );
    }
    if ( channelName in this.channels ) {
      channel = this.channels[ channelName ];
      channel.addActivity( msg );
    } else if ( isPM ) {
      //open new window for new PM
      if ( from && _nick === from ) {
        if ( this.serverChannel ) {
          msg.msg = [ "PM to ", target, ": ", msg.msg ].join( "" );
          this.serverChannel.addActivity( msg );
        }
      } else {
        util.log( "JOINING PM: " + target );
        this.channels[ channelName ] = new diom.connection.Channel( channelName, this.CHANNEL_TYPES.PM, this.server, this.logPref );
        channel = this.channels[ channelName ];
        util.publish( diom.topics.CHANNELS_CHANGED, [] );
        channel.addActivity( msg );
        if ( !( target in this.users ) ) {
          this.users[ target ] = new diom.connection.User( target, "" );
        }
        channel.addUser( this.users[ target ] );
        channel.addUser( this.users[ _nick ] );
        channel.publishUserActivity( );
      }
    }
    msg = null;
  },

  connect: function () {
    this.stayConnected = true;
    this.client.connect( );
    this.serverChannel = new diom.connection.Channel( this.server, this.CHANNEL_TYPES.SERVER, this.server, this.logPref );
    util.publish( diom.topics.CHANNELS_CHANGED, [] );
  },

  reconnect: function ( ) {
    if ( this.stayConnected ) {
      this.connect( );
    }
  },

  isConnected: function ( ) {
    return this.client.isConnected( );
  },

  close: function ( ) {
    this.cancelReconnect( );
    this.stayConnected = false;
    this.client.closeConnection( "Closed connection." );
  },

  handleInvite: function ( nick, target ) {
    var msg_, msg;
    msg_ = [ "You have been invited to", target, "by", nick ].join( " " ); 
    msg = new diom.connection.ActivityItem( "server", null, null, msg_, null, null );
    this.serverChannel.addActivity( msg );
    if ( this.autoJoin ) {
      this.client.join( target );
    }
  },

  handleConnection: function ( msg, connected, nickInUse ) {
    var msg_, target, pollTime, channels, channelName;
    msg_ = new diom.connection.ActivityItem( "server", null, null, msg, null, null );
    if ( nickInUse && this.getNick( ) !== this.preferences.altNick && !this.altNickTries ) {
      this.altNickTries = 1;
      this.client.changeNick( this.preferences.altNick );
      return;
    }
    if ( !connected ) {
      for ( target in this.channels ) {
        if ( this.channels.hasOwnProperty( target ) ) {
          this.channels[ target ].addActivity( msg_ );
        }
      }
      this.serverChannel.addActivity( msg_ );
      util.log("PUBLISHING CONNECTION_DISCONNECTED: " + this.server );
      util.publish( diom.topics.CONNECTION_DISCONNECTED, [ this.server ] );
      pollTime = this.pollTime;
      if ( pollTime && this.stayConnected ) {
        this.reconnectId = window.setTimeout( util.hitch( this, "reconnect" ), pollTime * 1000 );
      }
    } else {
      channels = [];
      for ( channelName in this.channels ) {
        if ( this.channels.hasOwnProperty( channelName ) ) {
          channels.push( channelName );
        }
      }
      this.serverChannel.addActivity( msg_ );
      if ( channels.length ) {
        this.client.join( channels );
      } 
      util.publish( diom.topics.CHANNELS_CHANGED, [ "connect", null, this.server ] );
    }
  },

  handleJoin: function ( nick, host, target ) {
    var channelName, _nick, user, channel, msg; 
    //add nick to connection users
    if ( !nick || !target ) { return; }
    channelName = this.getChannelName( target );
    _nick = this.getNick( );
    if ( nick === _nick ) {
      util.log( "JOINING CHANNEL: " + target );
      this.channels[ channelName ] = new diom.connection.Channel( target, this.CHANNEL_TYPES.CHANNEL, this.server, this.logPref );
      this.client.getTopic( target );
      util.publish( diom.topics.CHANNELS_CHANGED, [ "join", channelName, this.server ] );
      if ( channelName in this.names ) {
        this.addNamesToChannel( channelName, this.names[ channelName ] );
      } else {
        this.client.sendNames( target );
      }
    }
    user = this.getUser( nick );
    if ( !user ) {
      user = new diom.connection.User( nick, host ); 
      this.users[nick] = user;
    }
    //add nick to channel
    if (channelName in this.channels) {
      channel = this.channels[channelName];
      channel.addUser(user);
      channel.publishUserActivity( );
    }
    msg = new diom.connection.ActivityItem( "join", nick, target, null, user, host );
    this.addActivityToChannel( target, msg );
  },

  handleNotice: function ( nick, host, target, msg ) {
    var user = this.getUser( nick ), channel;
    if ( user ) { user.setHost( host ); }
    msg = new diom.connection.ActivityItem( "notice", nick, target, msg, user, host );
    for ( channel in this.channels ) {
      if ( this.channels.hasOwnProperty( channel ) ) {
        this.addActivityToChannel( channel, msg, channel );
      }
    }
    this.serverChannel.addActivity( msg );
  },

  handleQuit: function ( nick, host, msg ) {
    var user, channel, target;
    //remove nick from channels
    user = this.getUser( nick );
    if ( user ) {
      user.setHost( host );
      msg = new diom.connection.ActivityItem( "quit", nick, null, msg, user, host );
      for ( target in this.channels ) {
        if ( this.channels.hasOwnProperty( target ) ) {
          channel = this.channels[ target ];
          if ( channel.hasUser( user.nick ) ) {
            //check channels nick is in
            channel.addActivity( msg );
            channel.remUser( user );
            channel.publishUserActivity( );
          }
        }
      }
      //remove nick's user from Connection
      delete this.users[nick];
    }
  },

  handleMode: function ( nick, host, target, msg, modes ) {
    var channelName, channel, user;
    if ( msg ) {
      channelName = this.getChannelName( target );
      if ( channelName in this.channels ) {
        channel = this.channels[ channelName ];
        channel.addModes( modes );
        channel.publishUserActivity( );
      }
      user = this.getUser( nick );
      msg = new diom.connection.ActivityItem("mode", nick, target, msg, user, host );
      this.addActivityToChannel( target, msg );
    }
  },

  handleKick: function ( nick, kickedNick, host, target, msg ) {
    var user, altUser, channelName;
    util.log( "handling kick nick: "  + nick + " kickedNick: " + kickedNick );
    user = this.getUser( nick );
    if ( user ) { user.setHost( host ); }
    altUser = this.getUser( kickedNick );
    msg = new diom.connection.ActivityItem( "kick", nick, target, msg, user, host, altUser );
    if ( kickedNick !== this.getNick( ) ) {
      this.remUserFromChannel( kickedNick, target );
      this.addActivityToChannel( target, msg );
    } else {
      channelName = this.getChannelName( target );
      if ( channelName in this.channels ) {
        this.serverChannel.addActivity( msg );
        delete this.channels[ channelName ];
        util.publish( diom.topics.CHANNELS_CHANGED, [ "part", channelName, this.server ] );
      }
    }
  },

  handleAction: function ( nick, host, target, msg ) {
    var user;
    user = this.getUser( nick );
    if ( user ) { user.setHost( host ); }
    msg = new diom.connection.ActivityItem( "action", nick, target, msg, user, host );
    if ( this.referencesUser( msg.msg ) ) {
      msg.setReferencesUser( );
    } 
    this.addActivityToChannel( target, msg );
  },

  handleMessage: function ( nick, host, target, msg ) {
    var user ;
    //XXX: if target is this.getNick( ) and nick not a channel, open new channel
    user = this.getUser( nick );
    if ( user ) { user.setHost( host ); }
    msg = new diom.connection.ActivityItem( "privmsg", nick, target, msg, user, host );
    if ( this.referencesUser( msg.msg, target, nick ) ) {
      msg.setReferencesUser( );
    } 
    this.addActivityToChannel( target, msg, nick );
  },

  referencesUser: function ( msg, target, nick ) {
    var _nick, referencesUser;
    _nick = this.getNick( );
    if ( msg && msg.length && ( nick !== _nick ) ) { 
      referencesUser = ( msg.search( _nick.split("-").join("\\-").split( "|" ).join( "\\|" ).split( "^" ).join( "\\^" ) ) !== -1 );
      if ( referencesUser ) {
        util.publish( diom.topics.USER_HIGHLIGHT, [ this.getChannelName( target ), this.server, _nick ] );
        return true;
      }
    }
    return false;
  },

  remUserFromChannel: function ( nick, target ) {
    var user, channelName, channel, userExists;
    user = this.getUser( nick );
    if ( user ) {
      channelName = this.getChannelName( target );
      if ( channelName in this.channels ) {
        channel = this.channels[ channelName ];
        channel.remUser( user );
        channel.publishUserActivity( );
      }
      userExists = false;
      //possibly remove nick from connection users
      for ( channelName in this.channels ) {
        if ( this.channels[ channelName ].hasUser( user.nick ) ) {
          userExists = true;
          break;
        }
      }
      if ( !userExists ) {
        delete this.users[ nick ];
      }
    }
  },

  handlePart: function ( nick, host, target, msg ) {
    var user;
    if ( !msg ) { msg = ""; }
    user = this.getUser( nick );
    if ( user ) { user.setHost( host ); }
    msg = new diom.connection.ActivityItem( "part", nick, target, msg, user, host );
    this.addActivityToChannel( target, msg );
    this.remUserFromChannel( nick, target );
  },

  handleNickChange: function ( nick, host, newNick ) {
    var user, msg, target, channel, channelName, newChannelName;
    util.log( "nick: " + nick + " host: " + host + " newNick: " + newNick );
    user = this.getUser( nick );
    if ( user ) {
      user.setHost( host );
      user.rename( newNick );
      delete this.users [ nick ];
      this.users[ newNick ] = user;
      msg = new diom.connection.ActivityItem( "nick", nick, null, newNick, this.getUser( newNick ), host );
      //check channels nick is in
      for ( target in this.channels ) {
        if ( this.channels[ target ].hasUser( nick ) ) {
          channel = this.channels[target];
          util.log( "changing " + nick + " to " + user.nick + " in " + target );
          channel.renameUser( nick, newNick );
          channel.publishUserActivity( );
          this.addActivityToChannel( target, msg );
        }
      }
      //XXX: also check open channel names to see if they're the nick (PM's)
    }
    channelName = this.getChannelName( nick );
    if ( channelName in this.channels ) {
      newChannelName = this.getChannelName( newNick );
      this.channels[ newChannelName ] = this.channels[ channelName ];
      this.channels[ newChannelName ].setName( newNick );
      delete this.channels[ channelName ];
      util.publish( diom.topics.CHANNELS_CHANGED, [ "nick", channelName, this.server, newChannelName ] );
    }
    if ( nick === this.getNick( ) ) {
      this.serverChannel.addActivity( msg );
    }
    msg = null;
  },

  handleServerMessage: function ( host, msg, target ) {
    msg = new diom.connection.ActivityItem( "server", null, target, msg, host );
    if ( this.client.isChannelName( target ) ) {
      this.addActivityToChannel( target, msg );
    } else {
      this.serverChannel.addActivity( msg );
    }
    msg = null;
  },

  getChannelName: function ( target ) {
    return target.toLowerCase( );
  },

  addNamesToChannel: function ( channelName, nicks ) {
    var channel, i, nick, mode, host, user;
    channel = this.channels[ channelName ];
    //user = new diom.connection.User(nick, host); 
    //update names
    channel.remUsers( ); //if names not in this list then no longer in channel
    for ( i = 0; i < nicks.length; i++ ) {
      //create users if don't exist
      //add to channel
      nick = nicks[i];
      mode = nick[0];
      host = "";
      if (mode === "@" || mode === "+" || mode === "%" || mode === "!" ) {
        nick = nick.substr( 1 );
      } else {
        mode = null;
      }
      user = this.getUser( nick );
      if (!user) {
        user = new diom.connection.User( nick, host, mode ); 
        this.users[ nick ] = user;
      } 
      channel.addUser( user );
      if ( mode === "@" ) {
        user.op( channelName );
      } else if ( mode === "!" ) {
        user.creator( channelName );
      } else if ( mode === "+" ) { 
        user.voice( channelName );
      } else if ( mode === "%" ) { 
        user.halfOp( channelName );
      }
    }
    channel.publishUserActivity( );
  },

  handleNames: function ( target, nicks ) {
    var channelName = this.getChannelName( target );
    if ( !( channelName in this.channels ) ) {
      this.names[ channelName ] = nicks;
    } else {
      this.addNamesToChannel( channelName, nicks );
    }
  },

  handleTopic: function ( host, target, topic, topicSetter, datetime ) {
    var msg, channelName, channel;
    msg = new diom.connection.ActivityItem( "topic", topicSetter, target, topic, host );
    msg.setAltDatetime( datetime );
    this.addActivityToChannel( target, msg );
    channelName = this.getChannelName( target );
    if ( channelName in this.channels ) {
      channel = this.channels[ channelName ];
      channel.setTopic( topic );
    }
    util.publish( diom.topics.CHANNEL_TOPIC, [ this.server, channelName, topic ] );
    msg = null;
  },

  getServerChannel: function ( ) {
    return this.serverChannel;
  },

  getChannel: function ( name ) {
    var channelName, channel;
    channelName = this.getChannelName( name );
    if ( channelName in this.channels ) {
      channel = this.channels[ channelName ];
      return channel;
    } else {
      return null;
    }
  },

  addNewChannel: function ( name, type ) {
    this.channels[ name ] = new diom.connection.Channel( name, type, this.server, this.logPref );
  },

  getChannels: function ( ) {
    return this.channels;
  },

  sendCommand: function ( cmd, args, target ) {
    var msg, channel, nick, serverName, 
      _cmd, funcName, param, params, t;
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
        msg = "";
        if ( args && args.length ) {
          msg = args.join( " " );
        } 
        this.client.sendMode( msg );
        break;
      case "kick":
        msg = "";
        if ( args && args.length > 1 ) {
          channel = args.shift( );
          nick = args.shift( );
          if ( !nick ) {
            nick = channel;
            channel = target;
          }
          if ( args.length ) {
            msg = args.join( " " );
          }
        }
        this.client.sendKick( channel, nick, msg );
        break;
      case "motd":
        this.client.sendMOTD( );
        break;
      case "whois":
        msg = "";
        if ( args && args.length ) {
          msg = args.join( " " );
        } 
        this.client.sendWhoIs( msg );
        break;
      case "whowas":
        msg = "";
        if ( args && args.length ) {
          msg = args.join( " " );
        } 
        this.client.sendWhoWas( msg );
        break;
      case "squit":
        if ( args && args.length > 1 ) {
          serverName = args.shift( );
          msg = args.join( " " );
          this.client.sendSQuit( serverName, msg );
        }
        break;
      case "invite":
        if ( args && args.length > 1 ) {
          nick = args.shift( );
          channel = args.shift( );
          this.client.sendInvite( nick, channel );
        }
        break;
      case "die":
      case "restart":
      case "rehash":
        _cmd = cmd;
        funcName = "send" + _cmd; 
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
        if ( args && args.length ) {
          param = args.shift( );
        } else {
          param = null;
        }
        _cmd = cmd;
        _cmd = _cmd[ 0 ].toUpperCase( ) + _cmd.substr( 1 );
        funcName = "send" + _cmd; 
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
        params = "";
        if ( args && args.length ) {
          params = args.join( " " );
        } 
        _cmd = cmd;
        _cmd = _cmd[ 0 ].toUpperCase( ) + _cmd.substr( 1 );
        funcName = "send" + _cmd; 
        if ( funcName in this.client ) {
          this.client[ funcName ]( params );
        }
        break;
      case "part":
        msg = "";
        if ( args && args.length ) {
          if ( this.client.isChannelName( args[0] ) ) {
            target = args.shift( );
          }
          if ( args.length ) {
            msg = args.join( " " );
          }
        }
        this.partChannel( target, msg );
        break;
      case "quit":
        msg = "";
        if ( args && args.length ) {
          msg = args.join( " " );
        } 
        this.client.sendQuit( msg );
        break;
      case "ctcp":
        if ( args && args.length > 1 ) {
          target = args.shift( );
          msg = args.join( " " );
          if ( util.trim( msg ).toLowerCase( ) === "ping" ) {
            this.client.sendCTCPPing( target );
          } else { 
            this.client.sendCTCP( target, msg );
          }
        }
        break;
      case "me":
        msg = args.join( " " );
        this.client.sendAction( target, msg );
        this.handleAction( this.getNick( ), this.host, target, msg );
        break;
      case "names":
        if ( this.client.isChannelName( target ) ) {
          this.client.sendNames( target );
        }
        break;
      case "msg":
        if ( args && args.length > 1 ) {
          target = args.shift( );
          msg = args.join( " " );
          this.sendMessage( target, msg );
        }
        break;
      case "notice":
        if ( args && args.length > 1 ) {
          target = args.shift( );
          msg = args.join( " " );
          this.client.sendNotice( target, msg );
          this.handleNotice( this.getNick( ), this.host, target, msg );
        }
        break;
      case "topic":
        if ( args && args.length ) {
          t = args.shift( );
          if ( !this.client.isChannelName( t ) ) {
            args.unshift( t );
            t = target;
          }
          msg = args.join( " " );
        } else {
          msg = "";
          t = target;
        }
        this.client.topic( t, msg );
        break;
    }
  },

  sendMessage: function ( target, msg ) {
    if ( msg && target ) {
      if ( target === this.server ) { return; }
      this.client.sendPM( target, msg ); 
      this.handleMessage( this.getNick( ), this.host, target, msg );
    }
  },

  closeChannel: function ( serverName, channelName ) {
    if ( serverName === this.server ) {
      this.partChannel( channelName, "Closed channel window." );
    }
  },

  partChannel: function ( target, msg ) {
    var channelName, users, user, stillExists, tempUsers, channel;
    channelName = this.getChannelName( target );
    if ( channelName && channelName in this.channels ) {
      if ( this.client.isChannelName( channelName ) ) {
        util.log( "parting " + channelName );
        this.client.part( target, msg );
      }
      users = this.channels[ channelName ].getUsers( );
      for ( user in users ) {
        if ( users.hasOwnProperty( user ) ) {
          stillExists = false;
          for ( channel in this.channels ) {
            if ( this.channels.hasOwnProperty( channel ) ) {
              if ( channel !== channelName ) {
                tempUsers = this.channels[ channel ].getusers( );
                if ( user.nick in tempUsers ) {
                  stillExists = true;
                  break;
                }
              }
            }
          }
          if ( !stillExists ) {
            //if not delete from connection user list
            delete this.users[ user.nick ];
          }
        }
      }
      //delete channel from connection
      delete this.channels[ channelName ];
      util.publish( diom.topics.CHANNELS_CHANGED, [ "part", channelName, this.server ] );
    }
  },

  cancelReconnect: function ( ) {
    if ( this.reconnectId ) {
      window.clearTimeout( this.reconnectId );
      this.reconnectId = null;
    }
  },

  destroy: function ( ) {
    var user, channel;
    this.stayConnected = false;
    if ( this.client ) {
      this.client.destroy( );
      delete this.client;
      for ( user in this.users ) {
        if ( this.users.hasOwnProperty( user ) ) {
          this.users[ user ].destroy( );
          delete this.users[ user ];
        }
      }
      for ( channel in this.channels ) {
        if ( this.channels.hasOwnProperty( channel ) ) {
          this.channels[ channel ].destroy( );
          delete this.channels[ channel ];
        }
      }
      this.serverChannel.destroy( );
      delete this.serverChannel;
    }
  }

} );





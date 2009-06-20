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
  
  dConnection.Connection = function ( server, port, preferences, appVersion ) {

    var nick = preferences.nick;
    this.channels = {};
    this.users = {};
    this.preferences = preferences;
    this.host = "";
    this.users[ nick ] = new dConnection.User( nick, "" ); 
    this.server = server;
    this.serverChannel = null;
    this.port = port;
    this.altNickTries = 0;

    this.pollTime = parseInt( preferences.pollTime, 10 );

    this.client = new irc.Client( server, port, [], nick, preferences.userName, preferences.realName );
    this.client.setClientInfo( appVersion );

    //set delegates
    this.client.setConnectionDelegate(util.hitch(this,"handleConnection"));
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
  }

  _cnp = dConnection.Connection.prototype;

  _cnp.getNick = function ( ) {
    return this.client.getNick( );
  }

  _cnp.getUser = function (nick) {
    if (nick in this.users) {
      return this.users[nick];
    }
    return null;
  }

  _cnp.addActivityToChannel = function( target, msg, from ) {
    //from is optional and is explicit about who the message is from
    //only applicable to private messages
    var isPM = false;
    var _nick = this.getNick( );
    //determine if channel or PM first
    if ( !this.client.isChannelName( target ) ) {
      isPM = true;
      if ( from ) {
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
      util.log( "JOINING PM: " + target );
      this.channels[ channelName ] = new dConnection.Channel( channelName, dConnection.CHANNEL_TYPES.PM, this.server );
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
    delete msg;
  }

  _cnp.connect = function () {
    this.client.connect( );
    this.serverChannel = new dConnection.Channel( this.server, dConnection.CHANNEL_TYPES.SERVER, this.server );
    util.publish( topics.CHANNELS_CHANGED, [] );
  }

  _cnp.isConnected = function ( ) {
    return this.client.isConnected( );
  }

  _cnp.close = function () {
    this.client.closeConnection( "Closed connection." );
  }

  _cnp.handleConnection = function ( msg, connected, nickInUse ) {
    var msg_ = new dConnection.ActivityItem("server", null, null, msg);
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
      if ( pollTime ) {
        window.setTimeout( util.hitch( this, "connect" ), pollTime * 1000 );
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
    if ( !nick ) return;
    var user = this.getUser( nick );
    if ( !user ) {
      user = new dConnection.User( nick, host ); 
      this.users[nick] = user;
    }
    //add nick to channel
    var channelName = this.getChannelName( target );
    if (channelName in this.channels) {
      var channel = this.channels[channelName];
      channel.addUser(user);
      channel.publishUserActivity( );
    }
    var msg = new dConnection.ActivityItem( "join", nick, target, null );
    this.addActivityToChannel( target, msg );
  }

  _cnp.handleNotice = function ( nick, host, target, msg ) {
    var msg = new dConnection.ActivityItem( "notice", nick, target, msg );
    for ( var channel in this.channels ) {
      this.addActivityToChannel( channel, msg, channel );
    }
    this.serverChannel.addActivity( msg );
  }

  _cnp.handleQuit = function ( nick, host, msg ) {
    //remove nick from channels
    var user = this.getUser( nick );
    if ( user ) {
      var msg = new dConnection.ActivityItem( "quit", nick, null, msg );
      for ( var target in this.channels ) {
        var channel = this.channels[target];
        if ( channel.hasUser( user ) ) {
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
        var channel = this.channels[channelName];
        channel.addModes( modes );
        channel.publishUserActivity( );
      }
      var msg = new dConnection.ActivityItem("mode", nick, target, msg);
      this.addActivityToChannel(target, msg);
    }
  }

  _cnp.handleKick = function ( nick, kickedNick, host, target, msg ) {
    util.log( "handling kick nick: "  + nick + " kickedNick: " + kickedNick );
    var msg = new dConnection.ActivityItem( "kick", nick, target, msg );
    msg.setAltNick( kickedNick );
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
    var msg = new dConnection.ActivityItem( "action", nick, target, msg );
    if ( this.referencesUser( msg.msg ) ) {
      msg.setReferencesUser( );
    } 
    this.addActivityToChannel( target, msg );
  }

  _cnp.handleMessage = function ( nick, host, target, msg ) {
    //XXX: if target is this.getNick( ) and nick not a channel, open new channel
    var msg = new dConnection.ActivityItem( "privmsg", nick, target, msg );
    if ( this.referencesUser( msg.msg, target, nick ) ) {
      msg.setReferencesUser( );
    } 
    this.addActivityToChannel( target, msg );
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
    var user = this.getUser(nick);
    if (user) {
      var channelName = this.getChannelName(target);
      if (channelName in this.channels) {
        var channel = this.channels[channelName];
        channel.remUser(user);
        channel.publishUserActivity( );
      }
      userExists = false;
      //possibly remove nick from connection users
      for (var channelName in this.channels) {
        if (this.channels[channelName].hasUser(user)) {
          userExists = true;
          break;
        }
      }
      if ( !userExists ) {
        delete this.users[nick];
      }
    }
  }

  _cnp.handlePart = function (nick, host, target, msg) {
    this.remUserFromChannel( nick, target );
    if ( !msg ) msg = "";
    var msg = new dConnection.ActivityItem( "part", nick, target, msg );
    this.addActivityToChannel( target, msg );
  }

  _cnp.handleNickChange = function ( nick, host, newNick ) {
    util.log( "nick: " + nick + " host: " + host + " newNick: " + newNick );
    var user = this.getUser( nick );
    if ( user ) {
      var newUser = new dConnection.User( newNick, host ); 
      delete this.users[nick];
      this.users[newNick] = newUser;
      var msg = new dConnection.ActivityItem( "nick", nick, null, newNick );
      //check channels nick is in
      for ( var target in this.channels ) {
        if ( this.channels[target].hasUser( user ) ) {
          var channel = this.channels[target];
          util.log( "changing " + user.nick + " to " + newUser.nick + " in " + target );
          var hasOps = channel.userHasOps( user.nick );
          var hasVoice = channel.userHasVoice( user.nick );
          channel.remUser( user );
          channel.addUser( newUser );
          if ( hasOps ) channel.opUser( newUser.nick );
          if ( hasVoice ) channel.voiceUser( newUser.nick );
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
    var msg = new dConnection.ActivityItem( "server", null, target, msg );
    if ( target ) {
      this.addActivityToChannel( target, msg );
    } else {
      this.serverChannel.addActivity( msg );
    }
    delete msg;
  }

  _cnp.getChannelName = function ( target ) {
    return target.toLowerCase( );
  }

  _cnp.handleNames = function ( target, nicks ) {
    var channelName = this.getChannelName( target );
    if ( !( channelName in this.channels ) ) {
      util.log( "JOINING CHANNEL: " + target );
      this.channels[channelName] = new dConnection.Channel( target, dConnection.CHANNEL_TYPES.CHANNEL, this.server );
      this.client.getTopic( target );
      util.publish( topics.CHANNELS_CHANGED, [ "join", channelName, this.server ] );
    }
    var channel = this.channels[channelName];
    //user = new dConnection.User(nick, host); 
    //update names
    channel.remUsers( ); //if names not in this list then no longer in channel
    for ( var i = 0; i < nicks.length; i++ ) {
      //create users if don't exist
      //add to channel
      var nick = nicks[i];
      var mode = nick[0];
      var host = "";
      if (mode == "@" || mode == "+") {
        nick = nick.substr( 1 );
      } else {
        mode = null;
      }
      var user = this.getUser( nick );
      if (!user) {
        user = new dConnection.User( nick, host, mode ); 
        this.users[nick] = user;
      } 
      channel.addUser( user );
      if ( mode == "@" ) {
        channel.opUser( user.nick );
      } else if ( mode == "+" ) { 
        channel.voiceUser( user.nick );
      }
    }
    channel.publishUserActivity( );
  }

  _cnp.handleTopic = function (host, target, topic, topicSetter, datetime) {
    var msg = new dConnection.ActivityItem("topic", topicSetter, target, topic);
    this.addActivityToChannel(target, msg);
    delete msg;
  }

  _cnp.getServerChannel = function ( ) {
    return this.serverChannel;
  }

  _cnp.getChannel = function ( name ) {
    var channelName = this.getChannelName( name );
    if ( channelName in this.channels) {
      var channel = this.channels[channelName];
      return channel;
    } else {
      return null;
    }
  }

  _cnp.addNewChannel = function (name, type) {
    this.channels[name] = new dConnection.Channel(name, type, this.server);
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
          target = args.shift( );
          if ( args.length ) {
            var msg = args.join( " " );
          }
        }
        this.client.sendKick( channel, target, msg );
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
      case "ping": 
        if ( args && args.length ) {
          var target = args.shift( );
          this.client.sendPing( target );
        }
      case "ctcp":
        if ( args && args.length > 1 ) {
          var target = args.shift( );
          var msg = args.join( " " );
          this.client.sendCTCP( target, msg );
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
    if ( msg ) {
      this.client.sendPM( target, msg ); 
      this.handleMessage( this.getNick( ), this.host, target, msg );
    }
  }

  _cnp.partChannel = function (target, msg) {
    var channelName = this.getChannelName(target);
    if (channelName && channelName in this.channels) {
      if ( this.client.isChannelName( channelName ) ) {
        util.log("parting " + channelName);
        this.client.part(target, msg);
      }
      var users = this.channels[channelName].getUsers();
      for (var user in users) {
        var stillExists = false;
        for (var target in this.channels) {
          if (target != channelName) {
            var tempUsers = this.channels[target].getUsers();
            if (user.nick in tempUsers) {
              stillExists = true;
              break;
            }
          }
        }
        if (!stillExists) {
          //if not delete from connection user list
          delete this.users[user.nick];
        }
      }
      //delete channel from connection
      delete this.channels[channelName];
      util.publish(topics.CHANNELS_CHANGED, [ "part", channelName, this.server ]);
    }
  }

  _cnp.destroy = function ( ) {
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
    return;
  }

  //Channel Class
  dConnection.Channel = function ( name, type, server ) {
    this.name = name;
    this.type = type;
    this.server = server;
    this.users = {};
    this.voiced = {};
    this.ops = {};
    this.activityList = new dConnection.ActivityList( );
  }

  _clp = dConnection.Channel.prototype;

  _clp.getVoiced = function ( ) {
    return this.voiced;
  }

  _clp.getOps = function ( ) {
    return this.ops;
  }

  _clp.addModes = function ( modes ) {
    for ( var i = 0; i < modes.length; i++ ) {
      var mode = modes[i];
      var nick = mode.arg;
      if ( mode.type == "o" && ( nick in this.users ) ) {
        if ( mode.toggle == "+" ) {
          this.opUser( nick );
        } else {
          this.deOpUser( nick );
        }
      } else if ( mode.type == "v" && ( nick in this.users ) ) {
        if ( mode.toggle == "+" ) {
          this.voiceUser( nick );
        } else {
          this.deVoiceUser( nick );
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

  _clp.userHasOps = function ( nick ) {
    return ( nick in this.ops );
  }

  _clp.userHasVoice = function ( nick ) {
    return ( nick in this.voiced );
  }

  _clp.opUser = function ( nick ) {
    this.ops[nick] = this.users[nick];
  }

  _clp.deOpUser = function ( nick ) {
    if ( nick in this.ops ) {
      delete this.ops[nick];
    }
  }

  _clp.voiceUser = function ( nick ) {
    this.voiced[nick] = this.users[nick];
  }

  _clp.deVoiceUser = function ( nick ) {
    if ( nick in this.voiced ) {
      delete this.voiced[nick];
    }
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

  _clp.hasUser = function ( user ) {
    return ( user.nick in this.users );
  }

  _clp.remUser = function ( user ) {
    var nick = user.nick;
    if ( nick in this.users ) {
      delete this.users[ user.nick ];
    }
    if ( nick in this.voiced ) {
      delete this.voiced[ nick ];
    }
    if ( nick in this.ops ) {
      delete this.ops[ nick ];
    }
  }

  _clp.getUsers = function ( ) {
    return this.users;
  }

  _clp.addActivity = function ( msg ) {
    this.activityList.addMessage( msg.clone( ) );
    var activityTypes = {"privmsg":1,"action":1};
    this.publishActivity( ( msg.cmd in activityTypes ) );
    delete msg;
  }

  _clp.clearActivity = function ( ) {
    this.activityList.clearActivity( );
  }

  _clp.publishActivity = function ( isPM ) {
    util.publish( topics.CHANNEL_ACTIVITY, [ dConnection.Connection.prototype.getChannelName( this.name ), this.server, isPM ] );
  }

  _clp.publishUserActivity = function ( ) {
    util.publish( topics.USER_ACTIVITY, [ this.server, this.name ] );
  }

  _clp.getActivity = function ( msg ) {
    var msgs =  this.activityList.getMessages( );
    return msgs
  }

  _clp.destroy = function ( ) {
    this.activityList.destroy( );
    delete this.activityList;
    delete this.users;
    delete this.ops;
    delete this.voiced;
  }

  //Activity Item Class
  dConnection.ActivityItem = function ( cmd, nick, target, msg ) {
    this.cmd = cmd;
    this.nick = nick;
    this.target = target;
    this.msg = msg;
    this.datetime = new Date();
    this.displayMsg = null;
    this.altNick;
    this._referencesUser = false;
  }

  _cai = dConnection.ActivityItem.prototype;

  _cai.clone = function ( ) {
    var ai = new dConnection.ActivityItem( this.cmd, this.nick, this.target, null );
    ai.msg = this.msg; //avoid resanitizing
    ai.setDateTime( this.datetime );
    ai.setAltNick( this.altNick );
    ai._referencesUser = this._referencesUser;
    return ai;
  }

  _cai.setDateTime = function ( datetime ) {
    delete this.datetime;
    this.datetime = datetime;
  }

  _cai.setAltNick = function ( altNick ) {
    this.altNick = altNick;
  }

  _cai.setReferencesUser = function ( ) {
    this._referencesUser = true;
  }

  _cai.referencesUser = function ( ) {
    return this._referencesUser;
  }

  _cai.getAltNick = function ( ) {
    return this.altNick;
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

  _cap = dConnection.ActivityList.prototype;

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
  }

  _cup = dConnection.User.prototype;


  _cup.update = function ( nick, host ) {
    this.nick = nick;
    this.host = host;
  }

  _cup.destroy = function ( ) {
    delete this.nick;
    delete this.host;
  }

}





dojo.provide( "diom.connection.channel" );

  //Channel Class
  dConnection.Channel = function ( name, type, server, logPref ) {
    this.name = name;
    this.type = type;
    this.server = server;
    this.users = {};
    this.topic = null;
    this.activityList = new dConnection.ActivityList( );
    this.logPref = logPref;
    this.logger = new diom.Logger( server, name );
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


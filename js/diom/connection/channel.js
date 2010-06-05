/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom */

dojo.provide( "diom.connection.channel" );

dojo.declare( "diom.connection.Channel", null, {

  constructor: function ( name, type, server, logPref, connectionId ) {
    this.name = name;
    this.type = type;
    this.server = server;
    this.users = {};
    this.topic = null;
    this.activityList = new diom.connection.ActivityList( );
    this.logPref = logPref;
    this.connectionId = connectionId;
    this.logger = new diom.Logger( server, name );
    this.isLogOpen = false;
    if ( logPref ) {
      this.logger.open( );
      this.isLogOpen = true;
    }
    dojo.subscribe(  diom.topics.PREFS_CHANGE_LOGGING, this, "handleChangeLoggingPref" );
  },

  handleChangeLoggingPref: function ( newValue ) {
    this.logPref = newValue;
    if ( newValue && !this.isLogOpen ) {
      this.logger.open( );
      this.isLogOpen = true;
    } else if ( !newValue && this.isLogOpen ) {
      this.logger.close( );
      this.isLogOpen = false;
    }
  },

  getChannelName: function ( target ) {
    return target.toLowerCase( );
	},

  setTopic: function ( topic ) {
    this.topic = topic;
  },

  getTopic: function ( ) {
    return this.topic;
  },

  renameUser: function ( oldNick, newNick ) {
  	var user;
    if ( oldNick in this.users ) {
      user = this.users[ oldNick ];
      delete this.users[ oldNick ];
      this.users[ newNick ] = user;
    }
  },

  addModes: function ( modes ) {
  	var i, mode, nick, user, channelName;
    for ( i = 0; i < modes.length; i++ ) {
      mode = modes[i];
      nick = mode.arg;
      if ( nick in this.users ) {
        user = this.users[ nick ];
        channelName = this.getChannelName( this.name );
        if ( mode.type === "O" ) {
          if ( mode.toggle === "+" ) {
            user.creator( channelName );
          } else {
            user.deCreator( channelName );
          }
        } else if ( mode.type === "o" ) {
          if ( mode.toggle === "+" ) {
            user.op( channelName );
          } else {
            user.deOp( channelName );
          }
        } else if ( mode.type === "v" ) {
          if ( mode.toggle === "+" ) {
            user.voice( channelName );
          } else {
            user.deVoice( channelName );
          }
        } else if ( mode.type === "h" ) {
          if ( mode.toggle === "+" ) {
            user.halfOp( channelName );
          } else {
            user.deHalfOp( channelName );
          }
        }
      }
    }
  },

  setName: function ( name ) {
    //if it's actually a pm window user can change nicks
    this.name = name;
  },

  getName: function ( ) {
    return this.name;
  },

  remUsers: function ( ) {
  	var nick;
    for ( nick in this.users ) {
			if ( this.users.hasOwnProperty( nick ) ) {
      	delete this.users[ nick ];
			}
    }
    this.users = {};
  },

  addUser: function ( user ) {
    this.users[ user.nick ] = user;
  },

  hasUser: function ( nick ) {
    return ( nick in this.users );
  },

  remUser: function ( user ) {
    var nick = user.nick;
    if ( nick in this.users ) {
      delete this.users[ user.nick ];
    }
  },

  getUsers: function ( ) {
    return this.users;
  },

  addActivity: function ( msg ) {
    if ( !msg ) { return; }
    this.activityList.addMessage( msg.clone( ) );
    if ( this.logPref ) {
      this.logger.addLine( msg.getNickWithStatus( this.name ), msg.getMsg( ), msg.datetime );
      this.logger.write( );
    }
    this.publishActivity( ( msg.cmd in { "privmsg" : 1, "action" : 1 } ) );
		msg = null;
  },

  clearActivity: function ( ) {
    this.activityList.clearActivity( );
  },

  publishActivity: function ( isPM ) {
    dojo.publish( diom.topics.CHANNEL_ACTIVITY, [ this.getChannelName( this.name ), this.server, isPM, this.connectionId ] );
  },

  publishUserActivity: function ( ) {
    dojo.publish( diom.topics.USER_ACTIVITY, [ this.server, this.getChannelName( this.name ), this.connectionId ] );
  },

  getActivity: function ( msg ) {
    var msgs = this.activityList.getMessages( );
    return msgs;
  },

  destroy: function ( ) {
    this.activityList.destroy( );
    this.logger.close( );
    this.isLogOpen = false;
    this.logger.destroy( );
    delete this.logger;
    delete this.activityList;
    delete this.users;
  }

} );


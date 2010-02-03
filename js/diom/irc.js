/*
  Copyright (c) 2009 Apphacker apphacker@gmail.com twitter.com/apphacker
*/
/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, air */

dojo.provide( "diom.irc" );

dojo.declare( "diom.IRCClient", null, {

  constructor: function ( server, port, defaultChannels, nick, userName, realName, password ) {

    //Connection info
    this.host = null;
    this.server = server;
    this.password = ( password ? password : null );
    this.port = ( port ? port : 6667 );

    //Socket and connectivity
    this.socket = null;
    this.socketMonitor = null;
    this.stayConnected = false;
    this._isConnected = false;
    this.connectionEstablished = false;
    this.connectionAccepted = false;
    this.createConnection( );
    this.PING_TIME_OUT_WAIT = 60000;

    this.pollTime = 0;

    //User Info
    this.defaultChannels = defaultChannels;
    this.nick = nick;
    this.userName = userName;
    this.realName = realName;

    //Buffers for Handling IRC issues
    this.beginningFragment = null;
    this.namesList = {}; //stores names during NAMES irc list requests (multiple lines)
    this.topics = {}; //stores topics by channel name;
    this.lastCTCPReq = new Date( ).getTime( );
    this.CTCP_RESPONSE_WAIT = 5 * 1000; //only one ctcp response
    this.pingResponses = {}; //buffer for pings waiting for responses
    this.clientInfo = "";
    this.finger = "";

    //Delegates
    this.connectionDelegate = null; //called when for connectivity issues
    this.namesDelegate = null; //called when server sends names list
    this.topicDelegate = null; //called when server updaes topic for a channel
    this.serverDelegate = null; //called for all messages from server
    this.joinDelegate = null;
    this.noticeDelegate = null;
    this.quitDelegate = null;
    this.actionDelegate = null;
    this.messageDelegate = null;
    this.partDelegate = null;
    this.nickDelegate = null;
    this.modeDelegate = null;
    this.kickDelegate = null;
    this.kickDelegate = null;
    this.inviteDelegate = null;

    //IRC RFC
    this.CHANNEL_MODE_TYPES = {
      "&":"&",
      "#":"#",
      "+":"+",
      "!":"!"
    };
  },

  setFinger: function ( info ) {
    this.finger = info;
  },

  setClientInfo: function ( info ) {
    this.clientInfo = info;
  },

  getNick: function ( ) {
    return this.nick;
  },

  setJoinDelegate: function ( del ) {
    //delegate signature must be
      //joinDelegate(nick, host, target)
      this.joinDelegate = del;
  },
  setInviteDelegate: function ( del ) {
    //delegate signature must be
      //inviteDelegate(nick, target)
      this.inviteDelegate = del;
  },
  setNoticeDelegate: function ( del ) {
    //delegate signature must be
      //noticeDelegate(nick, host, target, msg)
      this.noticeDelegate = del;
  },
  setQuitDelegate: function ( del ) {
    //delegate signature must be
      //quitDelegate(nick, host, msg)
      this.quitDelegate = del;
  },
  setActionDelegate: function ( del ) {
    //delegate signature must be
      //actionDelegate(nick, host, target, msg)
      this.actionDelegate = del;
  },
  setMessageDelegate: function ( del ) {
    //delegate signature must be
      //messageDelegate(nick, host, target, msg)
      this.messageDelegate = del;
  },
  setPartDelegate: function ( del ) {
    //delegate signature must be
      //partDelegate(nick, host, target, msg)
      this.partDelegate = del;
  },
  setNickDelegate: function ( del ) {
    //delegate signature must be
      //nickDelegate(nick, host, msg)
      this.nickDelegate = del;
  },
  setServerDelegate: function ( del ) {
    //delegate signature must be
      //serverDelegate(host, msg)
      this.serverDelegate = del;
  },
  setNamesDelegate: function ( del ) {
    //delegate signature must be
    // namesDelegate(host, target, nicks)
    //  nicks is an array
    this.namesDelegate = del;
  },
  setConnectionDelegate: function ( del ) {
    //delegate signature must be:
    //nickInUse is a boolean and only is triggered when first joining
    // connectionDelegate( msg, connected, nickInUse )
    this.connectionDelegate = del;
  },
  setTopicDelegate: function ( del ) {
    //delegate signature must be:
    // topicDelegate(host, target, topic, topicSetter, datetime)
    this.topicDelegate = del;
  },
  setModeDelegate: function ( del ) {
    //delegate signature must be:
    // modeDelegate(nick, host, target, modes, cmdParts)
    this.modeDelegate = del;
  },
  setKickDelegate: function ( del ) {
    //delegate signature must be:
    // kickDelegate(nick, kickedNick, host, target, msg)
    this.kickDelegate = del;
  },

  connect: function ( ) {
    if ( this._isConnected) { return; }
    this.log( "Attempting connection on server: " + this.server + ", on host: " + this.host );
    this.stayConnected = true;
    this.socketMonitor = new air.SocketMonitor( this.server, this.port );
    this.socketMonitor.addEventListener( air.StatusEvent.STATUS, dojo.hitch( this, "onStatus" ) );
    this.socketMonitor.start( );
    this._connect( );
  },

  isConnected: function ( ) {
    return this._isConnected;
  },

  _connect: function ( ) {
    util.log("attempting connection: ");
    if( this.socketMonitor.available ) {
      this.socket.connect( this.server, this.port );
    }
  },

  onStatus: function ( e ) {
    var status_ = this.socketMonitor.available;
    if ( status_ && this.stayConnected && !this._isConnected ) {
      this._connect( );
      if ( this.connectionDelegate ) {
        this.connectionDelegate( "Connecting to server.", false, false );
      }
    } else if ( !status_ && this.stayConnected && this._isConnected ) {
      this.setDisconnectedStatus( );
    } else if ( !status_ && this.stayConnected ) {
      this.connectionDelegate( "Can't connect to server.", false, false );
    }
  },

  setDisconnectedStatus: function( ) {
    this.stopPingService( );
    this.connectionEstablished = false;
    this.connectionAccepted = false;
    this._isConnected = false;
    if ( this.connectionDelegate ) {
      this.connectionDelegate( "Disconnected from server.", false, false );
    }
  },

  onConnect: function ( e ) {
    this.log( "Found server, connecting..." );
    if ( this.password ) {
      this.pass( this.password );
    }
    this._send( "NICK " + this.nick );
    this._send( "USER " + this.userName + " " + this.server + " serverName " + " :"  + this.realName );
    this._isConnected = true;
  },

  startPingService: function ( ) {
    this.log( "startingPingService" );
    if ( this.connectionEstablished ) {
      this._send( "PING DiomedesIRC" );
      this.pingTimeoutID = window.setTimeout( dojo.hitch( this, "pingTimeout" ), this.PING_TIME_OUT_WAIT );
    }
  },

  pingTimeout: function ( ) {
    this.log( "ping timedout" );
    this.setDisconnectedStatus( );
  },

  stopPingService: function ( ) {
    this.log( "stopping ping service" );
    if ( this.pingTimeoutID ) {
      window.clearTimeout( this.pingTimeoutID );
      this.pingTmeoutId = null;
    }
  },

  handlePingReply: function ( ) {
    this.log( "handling ping reply" );
    this.stopPingService( );
    window.setTimeout( dojo.hitch( this, "startPingService" ), this.PING_TIME_OUT_WAIT );
  },

  onSocketData: function ( e ) {
    var data, i, d, _d, dataR, pong;
    if ( !this._isConnected ) { return; } //not sure why this happens but it does
    data = this.socket.readUTFBytes( this.socket.bytesAvailable );
    this.log( "RAW rec:" + data );
    if ( !this.connectionEstablished ) {
      _d = data.split( "\r\n" );
      for ( i = 0; i < _d.length; i++ ) {
        if ( !this.connectionEstablished && this.serverDelegate && _d[ i ] ) {
          this.serverDelegate( this.server , _d[ i ], null );
        }
      }
      if ( data.search( "NOTICE" ) !== -1 || data.search( this.COMMAND_NUMBERS.SERVER_CONNECT ) !== -1 )  {
        this.log( "found ident" );
        this.log( "Connection established." );
        this.connectionEstablished = true;
      } else if ( data.search( "ERROR" ) !== -1 ) {
        this.closeConnection( data );
        return;
      }
    }
    dataR = data.split( "\n" );
    if ( this.connectionEstablished ) {
      for ( i = 0; i < dataR.length; i++ ) {
        d = dataR[ i ];
        if ( d.search( "PING" ) === 0 ) {
          pong = d.split(" ")[ 1 ];
          this._send( "PONG " + pong );
        } else if ( d.length ) {
          this.handleData( d );
        }
      }
    }
    if ( this.socket && this.socket.connected ) {
      this.socket.flush( );
    }
  },

  getIndex: function ( arr, index ) {
    if ( arr.length && arr.length > index ) {
      return arr[ index ];
    } else {
      return null;
    }
  },

  handleData: function ( line ) {
    var endFragment = null,
      b, i, msg, cmdParts, newNick, host;
    this.log( "Handling line: " + line );
    if ( line[ 0 ] !== ":" ) {
      this.log( "lost beginning of line, line length: " + line.length );
      endFragment = line;
    } else {
      line = line.substr( 1 ); //strip beginning :
    }
    if ( line.substr( -1 ) !== "\r" ) {
      this.beginningFragment = line;
      return;
    } else {
      if ( endFragment ) {
        //lost a line between data reads
        //connection asynch so no guarantee
        this.log( "lost a line,  beginning: " + this.beginningFragment + " end:" + endFragment );
        if( line.search( "ERROR" ) === 0 ) {
            util.log("error caught");
            this.closeConnection( line );
            return;
        }
        if ( this.beginningFragment ) {
          //attempting to recover
          b = this.beginningFragment;
          this.beginningFragment = null;
          this.handleData( ":" + b + endFragment );
        }
        return;
      } else {
        line = line.substr( 0, line.length - 1 ); //strip end \r
      }
    }
    i = line.search( ":" );
    if ( i !== -1 ) {
      msg = line.substr( i + 1 );
      line = line.substr( 0, i - 1 ); //getting rid of ":"
    } else {
      msg = null;
    }
    cmdParts = line.split( " " );
    if ( !this.connectionAccepted && ( line.search( this.COMMAND_NUMBERS.NICK_IS_ALREADY_IN_USE ) !== -1 ) && this.connectionDelegate ) {
      this.connectionDelegate( "Nickname is alread in use. Type /nick newNick to change it.", true, true );
    }
    if ( !this.connectionAccepted && ( line.search( this.COMMAND_NUMBERS.INVALID_PASSWORD ) !== -1 ) ) {
      if ( this.connectionDelegate ) {
        this.connectionDelegate( "Invalid password.", false, false );
        //this.serverDelegate( this.getIndex( cmdParts, 0 ), "Invalid Password, type /pass PASSWORD using the correct password", this.getIndex( cmdParts, 0 ) );
        this.close( );
        this.setDisconnectedStatus( );
      }
    }
    if ( !this.connectionAccepted && ( line.search( this.COMMAND_NUMBERS.SERVER_CONNECT ) !== -1 ) ) {
      this.host = this.getIndex( cmdParts, 0 );
      newNick = this.getIndex( cmdParts, 2 );
      if ( this.nickDelegate && newNick ) {
        this.nickDelegate( this.nick, this.server, newNick );
        this.nick = newNick;
      }
      this.log( "nick: " + this.nick );
      this.log( "host: " + this.host );
      this.connectionAccepted = true;
      this.startPingService( );
      if ( this.connectionDelegate ) {
        this.connectionDelegate( "Connected to server.", true, false );
      }
    }
    host = this.getIndex( cmdParts, 0 );
    //there are either messages from the server
    //or messages from a user
    if ( host && host === this.host ) {
      this.handleServerMessage( cmdParts, msg );
    } else {
      this.handleUserMessage( cmdParts, msg );
    }
  },

  INVITE: function ( nick, host, cmd, target, msg ) {
    if ( target && this.inviteDelegate && this.isChannelName( msg ) ) {
      this.inviteDelegate( nick, msg );
    }
  },

  JOIN: function ( nick, host, cmd, target, msg ) {
    if ( target && this.joinDelegate ) {
      this.joinDelegate( nick, host, target );
    }
  },

  NOTICE: function ( nick, host, cmd, target, msg ) {
    var parts, then, now, diff, i;
    if ( target && this.noticeDelegate ) {
      if ( this.isCTCP( msg ) ) {
        msg = this.getMsgFromCTCP( msg );
        if ( msg && msg.length > 1 ) {
          parts = msg.split( " " );
          cmd = parts.shift( );
          msg = parts.join ( "  " );
          if ( cmd === "PING" && msg in this.pingResponses ) {
            then = this.pingResponses[ msg ];
            now = new Date( ).getTime( );
            diff = ( now - then ) / 1000;
            msg = "PING response from " + nick + " took " + diff + " seconds.";
          } else {
            msg = "CTCP Reply for " + cmd + ": " + msg;
          }
        }
      }
      this.noticeDelegate( nick, host, target, msg );
    }
  },

  QUIT: function ( nick, host, cmd, target, msg ) {
    if ( this.quitDelegate ) {
      this.quitDelegate( nick, host, msg );
    }
  },
  PRIVMSG: function ( nick, host, cmd, target, msg ) {
    var action = this.getAction( msg );
    if ( action && target && this.actionDelegate ) {
      this.actionDelegate( nick, host, target, action );
    } else if ( this.isCTCP( msg ) ) {
      this.handleCTCP( nick, host, target, msg );
    } else if ( target && this.messageDelegate ) {
      this.messageDelegate( nick, host, target, msg );
    }
  },

  PART: function ( nick, host, cmd, target, msg ) {
    if ( target && this.partDelegate ) {
      this.partDelegate( nick, host, target, msg );
    }
  },

  MODE: function ( nick, host, cmd, target, msg, cmdParts ) {
    var args, modes;
    if ( cmdParts && cmdParts.length > 3 ) {
      args = cmdParts.splice( 3, cmdParts.length );
      msg = args.join( " " );
      if ( target && this.modeDelegate && msg ) {
        modes = this.getModes( msg, target );
        this.modeDelegate( nick, host, target, msg, modes );
      }
    }
  },

  KICK: function ( nick, host, cmd, target, msg, cmdParts ) {
    var kickedNick = cmdParts[ 3 ];
    if ( target && kickedNick ) {
      this.kickDelegate( nick, kickedNick, host, target, msg );
    }
  },

  TOPIC: function ( nick, host, cmd, target, msg ) {
    if ( target ) {
      this.topic ( target, "" );
    }
  },

  NICK: function ( nick, host, cmd, target, msg ) {
    if ( this.nickDelegate && nick && msg ) {
      this.nickDelegate( nick, host, msg );
    }
    if ( nick === this.nick && msg ) {
      this.nick = msg;
    }
  },

  handleUserMessage: function ( cmdParts, msg ) {
    var userAddress, userParts, nick, host, cmd, target;
    userAddress = this.getIndex(cmdParts, 0);
    userParts = userAddress.split("!");
    nick = this.getIndex(userParts, 0);
    host = this.getIndex(userParts, 1);
    cmd = this.getIndex(cmdParts, 1);
    target = this.getTarget(cmdParts, msg);
    if ( cmd in this && dojo.isFunction( this[ cmd ] ) ) {
      this[ cmd ]( nick, host, cmd, target, msg, cmdParts);
    }
  },

  getModes: function ( modes, target ) {
    var parts, modeChanges, setTypes, toggleTypes,
      i, j, c, part, toggle, modeObj;
    parts = modes.split( " " );
    //array items for the below array follow this structure:
    // { "toggle": "+", "type": "o", "arg": "user1", "target": "#myChannel" }
    // { "toggle": "-", "type": "n", "arg": null, "target": "#myChannel" }
    modeChanges = [];
    setTypes = {
      O : 'give "channel creator" status;',
      o : 'give/take channel operator privilege;',
      h : 'give/take halfop operator privilege;',
      v : 'give/take the voice privilege;',
      k : 'set/remove the channel key (password);',
      l : 'set/remove the user limit to channel;',
      b : 'set/remove ban mask to keep users out;',
      e : 'set/remove an exception mask to override a ban mask;',
      I : 'set/remove an invitation mask to automatically override the invite-only flag;'
    };
    toggleTypes = {
      a : 'toggle the anonymous channel flag;',
      i : 'toggle the invite-only channel flag;',
      m : 'toggle the moderated channel;',
      n : 'toggle the no messages to channel from clients on the outside;',
      q : 'toggle the quiet channel flag;',
      p : 'toggle the private channel flag;',
      s : 'toggle the secret channel flag;',
      r : 'toggle the server reop channel flag;',
      t : 'toggle the topic settable by channel operator only flag;'
    };
    for ( i = 0; i < parts.length; i++ ) {
      part = parts[ i ];
      if ( part ) {
        toggle = part[ 0 ];
        if ( toggle === "+" || toggle === "-" ) {
          for ( j = 1; j < part.length; j++ ) {
            c = part[ j ];
            modeObj = {};
            modeObj.toggle = toggle;
            modeObj.target = target;
            if ( c === "+" || c === "-" ) {
              toggle = c;
              modeObj = null;
              continue;
            }
            if ( c in setTypes ) {
              modeObj.arg = undefined;
              modeObj.type = c;
              modeChanges.push( modeObj );
              continue;
            }
            if ( c in toggleTypes ) {
              modeObj.arg = null;
              modeObj.type = c;
              modeChanges.push( modeObj );
            }
          }
        } else {
          for ( j = 0; j < modeChanges.length; j++ ){
            if ( modeChanges[ j ].arg === undefined ) {
              modeChanges[ j ].arg = part;
              break;
            }
          }
        }
      }
    }
    return modeChanges;
  },

  handleCTCP: function ( nick, host, target, msg ) {
    var nowDate, now, cmdParts, cmd;
    nowDate = new Date( );
    now = nowDate.getTime( );
    if ( ( now - this.lastCTCPReq ) > this.CTCP_RESPONSE_WAIT ) {
      msg = msg.substr( 1, msg.length - 2 );
      cmdParts = msg.split( " " );
      cmd = this.getIndex( cmdParts, 0 );
      if ( cmd ) {
        if ( this.serverDelegate ) {
          this.serverDelegate( host, [ cmd, "from", nick ].join( " " ), null );
        }
        switch ( cmd ) {
          case "PING":
            this.sendNotice( nick, this.makeCTCP( msg ) );
            break;
          case "VERSION":
            this.sendNotice( nick, this.makeCTCP( [ cmd, this.clientInfo ].join( " " ) ) );
            break;
          case "TIME":
            this.sendNotice( nick, this.makeCTCP( [ cmd, nowDate.toString( ) ].join( " " ) ) );
            break;
          case "FINGER":
            this.sendNotice( nick, this.makeCTCP( [ cmd, this.finger ].join( " " ) ) );
            break;
        }
      }
    }
    this.lastCTCPReq = new Date( ).getTime( );
  },

  isCTCP: function ( msg ) {
    if ( !msg ) { return false; }
    var token = String.fromCharCode( 1 );
    return (msg[ 0 ] === token);
  },

  getMsgFromCTCP: function ( msg ) {
    if ( msg && msg.length && this.isCTCP( msg ) ) {
      var token = String.fromCharCode( 1 );
      return msg.split( token ).join( "" );
    }
    return msg;
  },

  getAction: function ( msg ) {
    var token, actionCheck;
    token = String.fromCharCode( 1 );
    actionCheck = token + "ACTION ";
    if ( msg.search( actionCheck ) !== -1 ) {
      return msg.substr( actionCheck.length, msg.length - 1 );
    }
    return null;
  },

  getTarget: function ( cmdParts, msg ) {
    var target = null, i;
    for ( i = 0; i < cmdParts.length; i++ ) {
      if ( cmdParts[ i][0 ] === "#" ) {
        target = cmdParts[ i ];
        break;
      }
    }
    if ( !target ) {
      target = this.getIndex( cmdParts, 2 );
    }
    if ( !target ) {
      target = msg;
    }
    return target;
  },

  COMMAND_NUMBERS: {
    "SERVER_CONNECT" : "001",
    "SERVER_INFO" : "004",
    "MAP" : "005",
    "NUM_OPS" : "252",
    "NUM_UNKNOWN" : "253",
    "NUM_CHANNELS" : "254",
    "NAMES_LIST_ADD" : "353",
    "NAMES_END_LIST" : "366",
    "TOPIC" : "332",
    "TOPIC_INFO" : "333",
    "NICK_AWAY" : "301",
    "NICK_LOOKS_VERY_HELPFUL" : "310",
    "NICK_USER_INFO" : "311",
    "NICK_USER_INFO2" : "314",
    "NICK_SERVER_INFO": "312",
    "NICK_IS_IRCOP" : "313",
    "END_OF_WHO" : "315",
    "NICK_SECONDS_SIGNON" : "317",
    "END_OF_WHOIS" : "318",
    "NICK_CHANNELS" : "319",
    "NICK_SIGNED_ON_AS": "320",
    "CHANNEL_INFO": "322",
    "WHO": "352",
    "END_OF_WHO_WAS" : "369",
    "HOST_CHANGE" : "396",
    "CANNOT_SEND_TO_CHANNEL" : "404",
    "NICK_IS_ALREADY_IN_USE" : "433",
    "INVALID_PASSWORD" : "464"
  },

  handleServerMessage: function ( cmdParts, msg ) {
    var host, commandNumber, userNick, aboutArg, target,
      channel, username, address, server, nick, flags,
      arg1, arg2, nicks, namesList, r, i;
    if ( !this.serverDelegate ) { return; }
    host = this.getIndex( cmdParts, 0 );
    if ( this.getIndex( cmdParts, 1 ).toLowerCase( ) === "pong" && msg === "DiomedesIRC" ) {
      this.handlePingReply( );
      return;
    }
    commandNumber = this.getIndex( cmdParts, 1 );
    userNick = this.getIndex( cmdParts, 2 );
    aboutArg = this.getIndex( cmdParts, 3 );
    target = this.getTarget( cmdParts, msg );

    //XXX: GET RID OF THIS SWITCH
    switch ( commandNumber ) {
      //with certain server messages it makes go to add channel/target info
      //if this is the case adding it here
      case this.COMMAND_NUMBERS.SERVER_INFO:
        this.host = this.getIndex( cmdParts, 3 );
        break;
      case this.COMMAND_NUMBERS.MAP:
        //what server supports && server info
        return;
      case this.COMMAND_NUMBERS.WHO:
        channel = this.getIndex( cmdParts, 4 );
        username = this.getIndex( cmdParts, 5 );
        address = this.getIndex( cmdParts, 6 );
        server = this.getIndex( cmdParts, 7 );
        nick = this.getIndex( cmdParts, 8 );
        flags = this.getIndex( cmdParts, 9 );
        msg = [
          channel,
          username,
          address,
          server,
          nick,
          flags,
          ":",
          msg
        ].join( " " );
        break;
      case this.COMMAND_NUMBERS.CHANNEL_INFO:
      case this.COMMAND_NUMBERS.NICK_USER_INFO:
      case this.COMMAND_NUMBERS.NICK_USER_INFO2:
      case this.COMMAND_NUMBERS.NICK_SECONDS_SIGNON:
        arg1 = this.getIndex( cmdParts, 4 );
        arg2 = this.getIndex( cmdParts, 5 );
        msg = [ aboutArg, ": ", arg1, " ", arg2, " ", msg ].join( "" );
        break;
      case this.COMMAND_NUMBERS.NICK_SERVER_INFO:
        arg1 = this.getIndex( cmdParts, 4 );
        msg = [ aboutArg, ": ", arg1, " ", msg ].join( "" );
        msg = [ aboutArg, ": ", msg ].join( "" );
        break;
      case this.COMMAND_NUMBERS.NICK_AWAY:
        msg = [ aboutArg, " is away: ", msg ].join( "" );
        break;
      case this.COMMAND_NUMBERS.END_OF_WHO:
      case this.COMMAND_NUMBERS.END_OF_WHOIS:
      case this.COMMAND_NUMBERS.NICK_CHANNELS:
      case this.COMMAND_NUMBERS.NICK_LOOKS_VERY_HELPFUL:
      case this.COMMAND_NUMBERS.NICK_IS_IRCOP:
      case this.COMMAND_NUMBERS.NICK_SIGNED_ON_AS:
      case this.COMMAND_NUMBERS.END_OF_WHO_WAS:
      case this.COMMAND_NUMBERS.NUM_OPS:
      case this.COMMAND_NUMBERS.NUM_CHANNELS:
      case this.COMMAND_NUMBERS.NUM_UNKNOWN:
      case this.COMMAND_NUMBERS.HOST_CHANGE:
        msg = [ aboutArg, ": ", msg ].join( "" );
        break;
      case this.COMMAND_NUMBERS.CANNOT_SEND_TO_CHANNEL:
        if ( target ) {
          this.serverDelegate( host, msg, target );
        }
        break;
      case this.COMMAND_NUMBERS.NICK_IS_ALREADY_IN_USE:
        if ( target ) {
          this.serverDelegate( host, msg, target );
        }
        break;
      case this.COMMAND_NUMBERS.TOPIC:
        if ( target ) {
          this.topics[ target ] = {};
          this.topics[ target ].topic = msg;
        }
        break;
      case this.COMMAND_NUMBERS.TOPIC_INFO:
        if ( target && ( target in this.topics ) ) {
          this.topics[ target ].nick = this.getIndex( cmdParts, 4 );
          this.topics[ target ].time = new Date( this.getIndex( cmdParts, 5 ) * 1000 );
          this.topics[ target ].host = host;
          this.getTopic( target );
        }
        break;
      case this.COMMAND_NUMBERS.NAMES_LIST_ADD:
        target = target.toLowerCase( );
        if ( target ) {
          if ( !( target in this.namesList ) ) {
            this.namesList[ target ] = [  ];
          }
        }
        this.namesList[ target ].push( msg );
        break;
      case this.COMMAND_NUMBERS.NAMES_END_LIST:
        target = target.toLowerCase( );
        if ( target && target in this.namesList ) {
          nicks = [];
          namesList = this.namesList[ target ];
          this.namesList[ target ] = null;
          delete this.namesList[ target ];
          for ( i = 0; i < namesList.length; i++ ) {
            if ( namesList[ i ] ) {
              r = namesList[ i ].split( " " );
              nicks = nicks.concat( r );
            }
          }
          if ( this.namesDelegate ) {
            this.namesDelegate( target, nicks );
          }
        }
        break;
      default:
        break;
    }
    if ( this.serverDelegate && msg ) {
      this.serverDelegate( host, msg, null );
    }
  },

  getTopic: function ( target ) {
    var topic;
    if (this.topicDelegate && ( target in this.topics )  ) {
      topic = this.topics[ target ];
      this.topicDelegate( topic.host, target, topic.topic, topic.nick, topic.time );
    }
  },

  sendRaw: function ( msg ) {
    this._send(msg);
  },

  pass: function ( password ) {
    this._send( [ "PASS", password ].join( " " ) );
  },

  join: function ( channels ) {
    if ( dojo.isString( channels ) ) {
      this._send( [ "JOIN", channels ].join( " " ) );
    } else {
      this._send( [ "JOIN", channels.join( "," ) ].join( " " ) );
    }
  },

  sendCTCPPing: function ( target ) {
    var pingKey = util.rand(0, 99999999).toString( );
    this.pingResponses[ pingKey ] = new Date( ).getTime( );
    this.sendCTCP( target, [ "PING", pingKey ].join( " " ) );
  },

  sendCTCP: function ( target, msg ) {
    var token, parts, cmd;
    token = String.fromCharCode( 1 );
    if ( msg ) {
      parts = msg.split( " " );
      if ( parts && parts.length ) {
        cmd = parts.shift( );
        msg = parts.join( " " );
        this.sendPM( target, [ token, cmd.toUpperCase( ), " ", msg, token ].join( "" ) );
      }
    }
  },

  sendMOTD: function ( ) {
    this._send( "MOTD" );
  },

  sendSimpleParam: function ( cmd, params ) {
    if ( !cmd ) { return; }
    if ( !params ) { params = ""; }
    this._send( [ cmd.toUpperCase( ), params ].join( " " ) );
  },

  sendOptionalParam: function ( cmd, param ) {
    cmd = [ cmd.toUpperCase( ) ];
    if ( param ) {
      cmd.push( param );
    }
    this._send( cmd.join( " " ) );
  },

  changeNick: function ( nick ) {
    this.sendSimpleParam( "NICK", nick );
  },

  sendIson: function ( params ) {
    this.sendSimpleParam( "ISON", params );
  },

  sendUserhost: function ( params ) {
    this.sendSimpleParam( "USERHOST", params );
  },

  sendWallops: function ( msg ) {
    this._send( [ "WALLOPS", ":" + msg ].join( " " ) );
  },

  sendUsers: function ( target ) {
    this.sendOptionalParam( "USERS", target );
  },

  sendSummon: function ( params ) {
    this.sendSimpleParam( "SUMMON", params );
  },

  sendRestart: function ( ) {
    this._send( "RESTART" );
  },

  sendDie: function ( ) {
    this._send( "DIE" );
  },

  sendRehash: function ( ) {
    this._send( "REHASH" );
  },

  sendAway: function ( msg ) {
    if ( msg ) {
      this._send( [ "AWAY", ":" + msg ].join( " " ) );
    } else {
      this._send( "AWAY" );
    }
  },

  sendPing: function ( params ) {
    this.sendSimpleParam( "PING", params );
  },

  sendKill: function ( params ) {
    this.sendSimpleParam( "KILL", params );
  },

  sendWho: function ( params ) {
    this.sendSimpleParam( "WHO", params );
  },

  sendSquery: function ( params ) {
    this.sendSimpleParam( "SQUERY", params );
  },

  sendServlist: function ( params ) {
    this.sendSimpleParam( "SERVLIST", params );
  },

  sendInfo: function ( target ) {
    this.sendOptionalParam( "INFO", target );
  },

  sendAdmin: function ( target ) {
    this.sendOptionalParam( "ADMIN", target );
  },

  sendTrace: function ( target ) {
    this.sendOptionalParam( "TRACE", target );
  },

  sendConnect: function ( params ) {
    this.sendSimpleParam( "CONNECT", params );
  },

  sendLinks: function ( params ) {
    this.sendSimpleParam( "LINK", params );
  },

  sendStats: function ( params ) {
    this.sendSimpleParam( "STATS", params );
  },

  sendTime: function ( target ) {
    this.sendOptionalParam( "TIME", target );
  },

  sendVersion: function ( target ) {
    this.sendOptionalParam( "VERSION", target );
  },

  sendLusers: function ( params ) {
    this.sendSimpleParam( "LUSERS", params );
  },

  sendPass: function ( password ) {
    this._send( [ "PASS", password ].join( " " ) );
  },

  sendOper: function ( params ) {
    this.sendSimpleParam( "OPER", params );
  },

  sendService: function ( params ) {
    this.sendSimpleParam( "SERVICE", params );
  },

  sendSQuit: function ( serverName, msg ) {
    this._send( [ "SQUIT", serverName, ":" + msg ].join( " " ) );
  },

  sendList: function ( channels, target ) {
    var cmd;
    if ( !dojo.isString( channels ) ) { channels = channels.join( "," ); }
    cmd = [ "LIST", channels ];
    if ( target ) {
      cmd.push( target );
    }
    this._send( cmd.join( " " ) );
  },

  sendInvite: function ( nick, channel ) {
    if ( nick && channel ) {
      this._send( [ "INVITE", nick, channel ].join( " " ) );
    }
  },

  sendMode: function ( msg ) {
    if ( msg ) {
      this._send( [ "MODE", msg ].join( " " ) );
    }
  },

  sendPM: function ( target, msg ) {
    this._send( [ "PRIVMSG", target, ":" + msg ].join ( " " ) );
  },

  sendNames: function ( target ) {
    this._send( [ "NAMES", target ].join( " " ) );
  },

  sendAction: function ( target, msg ) {
    this.sendCTCP( target, [ "ACTION", msg ].join( " " ) );
  },

  sendNotice: function ( target, msg ) {
    this._send( [ "NOTICE", target, ":" + msg ].join( " " ) );
  },

  quit: function ( msg ) {
    this._send( [ "QUIT",  ":" + msg ].join( " " ) );
    this.connectionEstablished = false;
    this.connectionAccepted = false;
  },

  topic: function ( target, topic ) {
    var cmd = [ "TOPIC", target ];
    if ( topic ) {
      cmd.push( ":" + topic );
    }
    this._send( cmd.join( " " ) );
  },

  part: function ( channel, msg ) {
    this._send( [ "PART", channel, ":" + msg ].join( " " ) );
  },

  sendQuit: function ( msg ) {
    if ( !msg ) { msg = ""; }
    this._send( [ "QUIT :", msg ].join( "" ) );
    this.closeConnection( );
  },

  sendWhoIs: function ( msg ) {
    this.sendSimpleParam( "WHOIS", msg );
  },

  sendWhoWas: function ( msg ) {
    this.sendSimpleParam( "WHOWAS", msg );
  },

  sendKick: function ( channel, target, msg ) {
    if ( !msg ) { msg = ""; }
    if ( target ) {
      this._send( [ "KICK", channel, target, ":" + msg ].join( " " ) );
    }
  },

  makeCTCP: function ( data ) {
    var token = String.fromCharCode( 1 );
    return [ token, data, token ].join( "" );
  },

  _send: function ( data ) {
    data = data += "\r\n";
    if ( this.socket && this.socket.connected ) {
      this.socket.writeUTFBytes( data );
      this.socket.flush( );
      this.log( data );
    } else {
      this.log( "Falied send, not connected: " + data );
    }
  },

  log: function ( data ) {
    util.log( "\n" + data );
  },

  createConnection: function ( ) {
    this.socket = new air.Socket( );
    this.socket.addEventListener( air.Event.CONNECT, dojo.hitch( this, "onConnect" ) );
    this.socket.addEventListener( air.ProgressEvent.SOCKET_DATA, dojo.hitch( this, "onSocketData" ) );
  },

  isChannelName: function ( name ) {
    //as per RFC 2812
    //returns if given string could be a channel name
    //this should be used instead of checking for a # for first character
    if ( name && name.length && ( name[ 0 ] in this.CHANNEL_MODE_TYPES ) ) { return true; }
    return false;
  },

  close: function ( ) {
    if ( this.socket && this.socket.connected ) {
      this.socket.close( );
    }
    if ( this.socketMonitor && this.socketMonitor.running ) {
      this.socketMonitor.stop( );
    }
  },

  closeConnection: function ( msg ) {
    this.stayConnected = false;
    this._isConnected = false;
    this.connectionEstablished = false;
    this.connectionAccepted = false;
    this.close( );
    if ( this.connectionDelegate ) {
      var quitMsg = "Quit: ";
      if ( msg ) {
        quitMsg += msg;
      }
      this.connectionDelegate( quitMsg, false, false );
    }
  },

  destroy: function ( data ) {
    this.log( "destroying irc client" );
    this.close( );
    delete this.socket;
    this.socket = null;
    delete this.socketMonitor;
    this.socketMonitor = null;
  }

} );


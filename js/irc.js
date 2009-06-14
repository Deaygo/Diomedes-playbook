/*
  Copyright (c) 2009 Apphacker apphacker@gmail.com twitter.com/apphacker
*/

var irc;

if ( !irc ){
  irc = {};
}

if ( window.runtime && air && util ) {
  //requires AIR and util
  
  //irc.Client Class
  irc.Client = function ( server, port, defaultChannels, nick, userName, realName ){

    this.clientInfo = "Diomedes alpha 0.1"

    //Connection info
    this.host = null;
    this.server = server;
    this.port = ( port ? port : 6667 );

    //Socket and connectivity 
    this.socket = null;
    this.socketMonitor = null;
    this.stayConnected = false;
    this.isConnected = false;
    this.connectionEstablished = false;
    this.connectionAccepted = false;
    this.createConnection( );

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
  }

  var _icp = irc.Client.prototype;

  _icp.getNick = function ( ) {
    return this.nick;
  }

  _icp.setJoinDelegate = function ( del ) {
    //delegate signature must be
      //joinDelegate(nick, host, target)
      this.joinDelegate = del;
  }
  _icp.setNoticeDelegate = function ( del ) {
    //delegate signature must be
      //noticeDelegate(nick, host, target, msg)
      this.noticeDelegate = del;
  }
  _icp.setQuitDelegate = function ( del ) {
    //delegate signature must be
      //quitDelegate(nick, host, msg)
      this.quitDelegate = del;
  }
  _icp.setActionDelegate = function ( del ) {
    //delegate signature must be
      //actionDelegate(nick, host, target, msg)
      this.actionDelegate = del;
  }
  _icp.setMessageDelegate = function ( del ) {
    //delegate signature must be
      //messageDelegate(nick, host, target, msg)
      this.messageDelegate = del;
  }
  _icp.setPartDelegate = function ( del ) {
    //delegate signature must be
      //partDelegate(nick, host, target, msg)
      this.partDelegate = del;
  }
  _icp.setNickDelegate = function ( del ) {
    //delegate signature must be
      //nickDelegate(nick, host, msg)
      this.nickDelegate = del;
  }
  _icp.setServerDelegate = function ( del ) {
    //delegate signature must be
      //serverDelegate(host, msg)
      this.serverDelegate = del;
  }
  _icp.setNamesDelegate = function ( del ) {
    //delegate signature must be
    // namesDelegate(host, target, nicks)
    //  nicks is an array
    this.namesDelegate = del;
  }
  _icp.setConnectionDelegate = function ( del ) {
    //delegate signature must be:
    //nickInUse is a boolean and only is triggered when first joining
    // connectionDelegate( msg, connected, nickInUse )
    this.connectionDelegate = del;
  }
  _icp.setTopicDelegate = function ( del ) {
    //delegate signature must be:
    // topicDelegate(host, target, topic, topicSetter, datetime)
    this.topicDelegate = del;
  }
  _icp.setModeDelegate = function ( del ) {
    //delegate signature must be:
    // modeDelegate(nick, host, target, modes, cmdParts)
    this.modeDelegate = del;
  }
  _icp.setKickDelegate = function ( del ) {
    //delegate signature must be:
    // kickDelegate(nick, kickedNick, host, target, msg)
    this.kickDelegate = del;
  }

  _icp.connect = function ( ) {
    this.log( "Attempting connection on server: " + this.server + ", on host: " + this.host ); 
    this.stayConnected = true;
    this.socketMonitor = new air.SocketMonitor( this.server, this.port ); 
    this.socketMonitor.addEventListener( air.StatusEvent.STATUS, util.hitch( this, "onStatus" ) ); 
    this.socketMonitor.start( ); 
    this._connect( );
  }

  _icp._connect = function ( ) {
    if( this.socketMonitor.available ) {
      this.socket.connect( this.server, this.port );
    }
  }

  _icp.onStatus = function ( e ) {
    var status_ = this.socketMonitor.available;
    if ( this.stayConnected && !this.isConnected ) {
      this._connect( );
      if ( this.connectionDelegate ) {
        this.connectionDelegate( "Connecting to server.", false, false );
      }
    } else if ( !status_ && this.stayConnected && this.isConnected ) {
      this.connectionEstablished = false;
      this.connectionAccepted = false;
      this.isConnected = false;
      if ( this.connectionDelegate ) {
        this.connectionDelegate( "Disconnected from server.", false, false );
      }
    }
  }

  _icp.onConnect = function ( e ) {
    this.log( "Found server, connecting..." );
    this.isConnected = true;
  }

  _icp.onSocketData = function ( e ) {
    if ( !this.isConnected ) return; //not sure why this happens but it does
    var data = this.socket.readUTFBytes( this.socket.bytesAvailable );
    this.log( "RAW rec:" + data );
    if ( !this.connectionEstablished ) {
      var _d = data.split( "\r\n" );
      for ( var i = 0; i < _d.length; i++ ) {
        if ( this.serverDelegate && _d[ i ] ) {
          this.serverDelegate( this.server , _d[ i ], null );
        }
      }
      if ( data.search( "NOTICE AUTH" ) != -1 )  {
        this.log( "found ident" );
        this._send( "NICK " + this.nick );
        this._send( "USER " + this.userName + " " + this.server + " serverName " + " :"  + this.realName );
        this.log( "Connection established." );
        this.connectionEstablished = true;
      } else if ( data.search( "ERROR" ) != -1 ) {
        this.closeConnection( data );
        return;
      }
    }
    var dataR = data.split( "\n" );
    if ( this.connectionEstablished ) {
      for ( var i = 0; i < dataR.length; i++ ) {
        var d = dataR[i];
        if ( d.search( "PING" ) == 0 ) {
          var pong = data.split(" ")[1];
          this._send( "PONG " + pong );
        } else if ( d.length ) {
          this.handleData( d );
        }
      }
    } 
    if ( this.socket && this.socket.connected ) {
      this.socket.flush( );
    }
  }

  _icp.getIndex = function ( arr, index ) {
    if ( arr.length && arr.length > index ) {
      return arr[index];
    } else {
      return null;
    }
  }

  _icp.handleData = function ( line ) {
    this.log( "Handling line: " + line );
    if ( line[0] != ":" ) {
      this.log( "lost beginning of line, line length: " + line.length );
      var endFragment = line;
    } else {
      line = line.substr( 1 ); //strip beginning :
    }
    if ( line.substr( -1 ) != "\r" ) {
      this.beginningFragment = line;
      return;
    } else {
      if ( endFragment ) { 
        //lost a line between data reads
        //connection asynch so no guarantee
        this.log( "lost a line,  beginning: " + this.beginningFragment + " end:" + endFragment );
        if( line.search( "ERROR" ) == 0 ) {
            util.log("error caught");
            this.closeConnection( line );
            return;
        }
        if ( this.beginningFragment ) {
          //attempting to recover
          var b = this.beginningFragment;
          this.beginningFragment = null;
          this.handleData( ":" + b + endFragment );
        }
        return;
      } else {
        line = line.substr( 0, line.length - 1 ); //strip end \r
      }
    }
    var i = line.search( ":" ), msg;
    if ( i != -1 ) {
      msg = line.substr( i + 1 );
      line = line.substr( 0, i - 1 ); //getting rid of ":" 
    } else {
      msg = null;
    }
    var cmdParts = line.split( " " );
    if ( !this.connectionAccepted && ( line.search( "433" ) != -1 ) && this.connectionDelegate ) {
        this.connectionDelegate( "Nickname is alread in use. Type /nick newNick to change it.", true, true );
    }
    if ( !this.connectionAccepted && ( line.search( "001" ) != -1 ) ) {
      this.host = this.getIndex( cmdParts, 0 );
      var newNick = this.getIndex( cmdParts, 2 );
      if ( this.nickDelegate && newNick ) {
        this.nickDelegate( this.nick, this.server, newNick );
        this.nick = newNick;
      }
      this.log( "nick: " + this.nick );
      this.log( "host: " + this.host );
      this.connectionAccepted = true;
      if ( this.connectionDelegate ) {
        this.connectionDelegate( "Connected to server.", true, false );
      }
    }
    var host = this.getIndex( cmdParts, 0 );
    //there are either messages from the server
    //or messages from a user
    if ( host && host == this.host ) {
      this.handleServerMessage( cmdParts, msg );
    } else {
      this.handleUserMessage( cmdParts, msg );
    }
  }

  _icp.JOIN = function ( nick, host, cmd, target, msg ) {
    if ( target && this.joinDelegate ) {
      this.joinDelegate( nick, host, target );
    }
  }

  _icp.NOTICE = function ( nick, host, cmd, target, msg ) {
    if ( target && this.noticeDelegate ) {
      this.noticeDelegate( nick, host, target, msg );
    }
  }
  
  _icp.QUIT = function ( nick, host, cmd, target, msg ) {
    if ( this.quitDelegate ) {
      this.quitDelegate( nick, host, msg );
    }
  }
  _icp.PRIVMSG = function ( nick, host, cmd, target, msg ) {
    var action = this.getAction( msg );        
    if ( action && target && this.actionDelegate ) {
      this.actionDelegate( nick, host, target, action );
    } else if ( this.isCTCP( msg ) ) {
      this.handleCTCP( nick, host, target, msg );
    } else if ( target && this.messageDelegate ) {
      this.messageDelegate( nick, host, target, msg );
    }
  }
  
  _icp.PART = function ( nick, host, cmd, target, msg ) {
    if ( target && this.partDelegate ) {
      this.partDelegate( nick, host, target, msg );
    }
  }

  _icp.MODE = function ( nick, host, cmd, target, msg, cmdParts ) {
    if ( cmdParts && cmdParts.length > 3 ) {
      var args = cmdParts.splice( 3, cmdParts.length );
      var msg = args.join( " " );
      if ( target && this.modeDelegate && msg ) {
        var modes = this.getModes( msg, target );
        this.modeDelegate( nick, host, target, msg, modes );
      }
    }
  }

  _icp.KICK = function ( nick, host, cmd, target, msg, cmdParts ) {
    var kickedNick = cmdParts[3];
    if ( target && kickedNick ) {
      this.kickDelegate( nick, kickedNick, host, target, msg );
    }
  }

  _icp.TOPIC = function ( nick, host, cmd, target, msg ) {
    if ( target ) {
      this.topic ( target, "" ); 
    }
  }

  _icp.NICK = function ( nick, host, cmd, target, msg ) {
    if ( this.nickDelegate && nick && msg ) {
      this.nickDelegate( nick, host, msg );
    }
    if ( nick == this.nick && msg ) {
      this.nick = msg;
    }
  }

  _icp.handleUserMessage = function ( cmdParts, msg ) {
    var userAddress = this.getIndex(cmdParts, 0);
    var userParts = userAddress.split("!");
    var nick = this.getIndex(userParts, 0);
    var host = this.getIndex(userParts, 1);
    var cmd = this.getIndex(cmdParts, 1);
    var target = this.getTarget(cmdParts, msg);
    if ( cmd in this && util.isFunction( this[cmd] ) ) {
      this[cmd]( nick, host, cmd, target, msg, cmdParts);
    }
  }

  _icp.getModes = function ( modes, target ) {
    var parts = modes.split( " " );
    //array items for the below array follow this structure:
    // { "toggle": "+", "type": "o", "arg": "user1", "target": "#myChannel" }
    // { "toggle": "-", "type": "n", "arg": null, "target": "#myChannel" }
    var modeChanges = []; 
    var setTypes = {
      O : 'give "channel creator" status;',
      o : 'give/take channel operator privilege;',
      v : 'give/take the voice privilege;',
      k : 'set/remove the channel key (password);',
      l : 'set/remove the user limit to channel;',
      b : 'set/remove ban mask to keep users out;',
      e : 'set/remove an exception mask to override a ban mask;',
      I : 'set/remove an invitation mask to automatically override the invite-only flag;',
    }
    var toggleTypes = {
      a : 'toggle the anonymous channel flag;',
      i : 'toggle the invite-only channel flag;',
      m : 'toggle the moderated channel;',
      n : 'toggle the no messages to channel from clients on the outside;',
      q : 'toggle the quiet channel flag;',
      p : 'toggle the private channel flag;',
      s : 'toggle the secret channel flag;',
      r : 'toggle the server reop channel flag;',
      t : 'toggle the topic settable by channel operator only flag;',
    }
    for ( var i = 0; i < parts.length; i++ ) {
      var part = parts[i];
      if ( part ) {
        var toggle = part[0];
        if ( toggle == "+" || toggle == "-" ) {
          for ( var j = 1; j < part.length; j++ ) {
            var c = part[j];
            var modeObj = {};
            modeObj.toggle = toggle;
            modeObj.target = target;
            if ( c == "+" || c == "-" ) {
              toggle = c;
              delete modeObj;
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
          for ( var j = 0; j < modeChanges.length; j++ ){
            if ( modeChanges[j].arg === undefined ) {
              modeChanges[j].arg = part;
              break;
            }
          }
        }
      }
    }
    return modeChanges;
  }

  _icp.handleCTCP = function ( nick, host, target, msg ) {

    var nowDate = new Date( );
    var now = nowDate.getTime( );
    if ( ( now - this.lastCTCPReq ) > this.CTCP_RESPONSE_WAIT ) {
      msg = msg.substr( 1, msg.length - 2 );
      var cmdParts = msg.split( " " );
      var cmd = this.getIndex( cmdParts, 0 );
      if ( cmd ) {
        if ( this.serverDelegate ) this.serverDelegate( host, [ cmd, "from", nick ].join( " " ), null );
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
        }
      }
    }
    this.lastCTCPReq = new Date( ).getTime( );
  }

  _icp.isCTCP = function ( msg ) {
    var token = String.fromCharCode( 001 );
    return (msg[0] == token); 
  }

  _icp.getAction = function ( msg ) {
    var token = String.fromCharCode( 001 );
    var actionCheck = token + "ACTION ";
    if ( msg.search( actionCheck ) != -1 ) {
      return msg.substr( actionCheck.length, msg.length - 1 );
    }
    return null;
  }

  _icp.getTarget = function ( cmdParts, msg ) {
    var target = null;
    for ( var i = 0; i < cmdParts.length; i++ ) {
      if ( cmdParts[i][0] == "#" ) {
        target = cmdParts[i];
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
  }

  _icp.COMMAND_NUMBERS = {
    "NAMES_LIST_ADD": "353",
    "NAMES_END_LIST": "366",
    "TOPIC": "332",
    "CANNOT_SEND_TO_CHANNEL": "404",
    "TOPIC_INFO": "333",
    "NICK_IS_ALREADY_IN_USE": "433",
  }

  _icp.handleServerMessage = function ( cmdParts, msg ) {
    var host = this.getIndex( cmdParts, 0 );
    var commandNumber = this.getIndex( cmdParts, 1 );
    var userNick = this.getIndex( cmdParts, 2 );
    var target = this.getTarget( cmdParts, msg );

    switch ( commandNumber ) {
      //with certain server messages it makes go to add channel/target info
      //if this is the case adding it here
      case this.COMMAND_NUMBERS["CANNOT_SEND_TO_CHANNEL"]:
        if ( target ) {
          this.serverDelegate( host, msg, target );
        }
        break;
      case this.COMMAND_NUMBERS["NICK_IS_ALREADY_IN_USE"]:
        if ( target ) {
          this.serverDelegate( host, msg, target );
        }
        break;
      case this.COMMAND_NUMBERS["TOPIC"]:
        if ( target ) {
          this.topics[target] = {};
          this.topics[target]["topic"] = msg;
        }
        break;
      case this.COMMAND_NUMBERS["TOPIC_INFO"]:
        if ( target && ( target in this.topics ) ) {
          this.topics[target]["nick"] = this.getIndex( cmdParts, 4 );
          this.topics[target]["time"] = new Date( this.getIndex( cmdParts, 5 ) * 1000 );
          this.topics[target]["host"] = host;
          this.getTopic( target );
        }
      case this.COMMAND_NUMBERS["NAMES_LIST_ADD"]:
        if ( target ) {
          if ( !( target in this.namesList ) ) {
            this.namesList[target] = [];
          }
        }
        this.namesList[target].push( msg );
        break;
      case this.COMMAND_NUMBERS["NAMES_END_LIST"]:
        if ( target && target in this.namesList ) {
          var nicks = [];
          var namesList = this.namesList[target];
          this.namesList[target] = null;
          delete this.namesList[target];
          for ( var i = 0; i < namesList.length; i++ ) {
            if ( namesList[i] ) {
              var r = namesList[i].split( " " );
              nicks = nicks.concat( r );
            }
          }
          if ( this.namesDelegate ) {
            this.namesDelegate( target, nicks );
          }
        }
        break;
    }
    if ( this.serverDelegate && msg ) {
      this.serverDelegate( host, msg, null );
    }
  }

  _icp.getTopic = function ( target ) {
    if (this.topicDelegate && ( target in this.topics )  ) {
      var topic = this.topics[target];
      this.topicDelegate( topic.host, target, topic.topic, topic.nick, topic.time );
    }
  }

  _icp.sendRaw = function ( msg ) {
    this._send(msg);
  }

  _icp.join = function ( channels ) {
    if ( util.isString( channels ) ) {
      this._send( "JOIN " + channels );
    } else {
      this._send( "JOIN " + channels.join( "," ) );
    }
  }

  _icp.sendMOTD = function ( ) {
    this._send( "MOTD" );
  }

  _icp.changeNick = function ( nick ) {
    this._send( "NICK " + nick );
  }
 
  _icp.sendPM = function ( target, msg ) {
    this._send( "PRIVMSG " + target + " :" + msg );
  }

  _icp.sendNames = function ( target ) {
    this._send("NAMES " + target);
  }

  _icp.sendAction = function ( target, msg ) {
    var token = String.fromCharCode( 001 );
    this.sendPM( target, token + "ACTION " + msg + token );
  }

  _icp.sendNotice = function ( target, msg ) {
    this._send( "NOTICE " + target + " :" + msg );
  }

  _icp.quit = function ( msg ) {
    this._send( "QUIT :" + msg );
    this.connectionEstablished = false;
    this.connectionAccepted = false;
  }

  _icp.topic = function ( target, topic ) {
    var cmd = "TOPIC " + target;
    if ( topic ) {
      cmd += " :" + topic;
    }
    this._send( cmd );
  }

  _icp.part = function ( channel, msg ) {
    this._send( "PART " + channel + " :" + msg );
  }

  _icp.sendQuit = function ( msg ) {
    if ( !msg ) msg = "";
    this._send( "QUIT : " + msg );
    this.closeConnection( );
  }

  _icp.sendWhoIs = function ( msg ) {
    if ( msg ) {
      this._send( "WHOIS " + msg );
    }
  }

  _icp.sendWhoWas = function ( msg ) {
    if ( msg ) {
      this._send( "WHOWAS " + msg );
    }
  }

  _icp.sendKick = function ( channel, target, msg ) {
    if ( !msg ) msg = "";
    if ( target ) {
      this._send( "KICK " + channel + " " + target + " :" + msg );
    }
  }

  _icp.sendMode = function ( msg ) {
    if ( msg ) {
      this._send( "MODE " + msg );
    }
  }

  _icp.makeCTCP = function ( data ) {
    var token = String.fromCharCode( 001 );
    return [ token, data, token ].join( "" );
  }

  _icp._send = function ( data ) {
    //XXX: send data back as delegate? 
    data = data += "\r\n";
    if ( this.socket && this.socket.connected ) {
      this.socket.writeUTFBytes( data );
      this.socket.flush( );
      this.log( data );
    } else {
      this.log( "Falied send, not connected: " + data );
    }
  }

  _icp.log = function ( data ) {
    util.log( "\n" + data ); 
  }

  _icp.createConnection = function ( ) {
    this.socket = new air.Socket( );

    this.socket.addEventListener( air.Event.CONNECT, util.hitch( this, "onConnect" ) ); 
    this.socket.addEventListener( air.ProgressEvent.SOCKET_DATA, util.hitch( this, "onSocketData" ) ); 
  }

  _icp.closeConnection = function ( msg ) {
    this.stayConnected = false;
    this.isConnected = false;
    this.connectionEstablished = false;
    this.connectionAccepted = false;
    if ( this.socket && this.socket.connected ) {
      this.socket.close( );
    }
    if ( this.connectionDelegate ) {
      var quitMsg = "Quit: ";
      if ( msg ) {
        quitMsg += msg;
      }
      this.connectionDelegate( quitMsg, false, false );
    }
    if ( this.socketMonitor && this.socketMonitor.running ) {
      this.socketMonitor.stop( );
    }
  }

  _icp.destroy = function ( data ) {
    this.log( "destroying irc client" );
    delete this.socket;
    this.socket = null;
    this.closeConnection( );
  }

}



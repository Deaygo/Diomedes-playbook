
dojo.provide( "diom.connection.activityItem" );

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


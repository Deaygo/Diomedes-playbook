
dojo.provide( "diom.connection.user" );

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


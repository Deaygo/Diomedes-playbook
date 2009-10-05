
dojo.provide( "diom.view.nickView" );

  dView.NickWindow = function ( serverName, channelName ) {
    this.serverName = serverName;
    this.channelName = channelName;
    this.win = document.createElement( "div" );
    this.win.setAttribute( "class", "nickWin" );
    this.win.setAttribute( "server", this.serverName );
    this.win.setAttribute( "channel", this.channelName );
  }

  var _vnw = dView.NickWindow.prototype;

  _vnw.sanitize = dView.View.prototype.sanitize;

  _vnw.setContents = _vvp.setContents;

  _vnw.clear = function ( ) {
    this.win.innerHTML = "";
  }

  _vnw.getNode = function ( ) {
    return this.win;
  }

  _vnw.getNicks = function ( ) {
    return this.nicks;
  }

  _vnw.update = function ( users, channelName ) {
    if ( !users ) return;
    var mode;
    var r = [];
    var usersR = [];
    var creatorsR = [];
    var opsR = [];
    var halfOpsR = [];
    var voicedR = [];
    var nicks = this.sort( users );
    var tmpNicks = [];
    for ( var i = 0; i < nicks.length; i++ ) {
      var nick = nicks[ i ];
      if ( nick ) {
        tmpNicks.push( nick );
      } else {
        continue;
      }
      var user = users[ nick ];
      if ( user.isCreator( channelName ) ) {
        mode = "!";
        creatorsR.push( this.getNickButton( user, mode ) );
      } else if ( user.isOp( channelName ) ) {
        mode = "@";
        opsR.push( this.getNickButton( user, mode ) );
      } else if ( user.isHalfOp( channelName ) ) {
        mode = "%";
        halfOpsR.push( this.getNickButton( user, mode ) );
      } else if ( user.isVoice( channelName ) ) {
        mode = "+";
        voicedR.push( this.getNickButton( user, mode ) );
      } else {
        mode = "";
        usersR.push( this.getNickButton( user, mode ) );
      }
    }
    nicks = tmpNicks;
    r = r.concat( creatorsR );
    r = r.concat( opsR );
    r = r.concat( halfOpsR );
    r = r.concat( voicedR );
    r = r.concat( usersR );
    this.setContents( this.win, r.join( "" ), false );
    this.nicks = nicks;
    util.publish( diom.topics.NICK_CHANGE, [ nicks, this.serverName, this.channelName ] );
  }

  _vnw.sort = function ( users ) {
    var r = [];
    for ( var nick in users ) {
      r.push( nick );
    }
    r.sort( this.nickCompare );
    return r;
  }

  _vnw.getNickButton = function ( user, mode ) {
    return [
        ' <span class="nickButton',
        ( mode == "@" ? " op" : "" ),
        ( mode == "%" ? " halfOp" : "" ),
        ( mode == "+" ? " voiced" : "" ),
        '" mode="',
        mode,
        '" nick="',
        this.sanitize( user.nick ),
        '" host="',
        this.sanitize( user.host ),
        '">',
          mode,
          this.sanitize( user.nick ),
        '</span> '
      ].join("");
  }

  _vnw.nickCompare = function ( nick1, nick2 ) {
    nick1 = nick1.toLowerCase( );
    nick2 = nick2.toLowerCase( );
    if ( nick1 < nick2 ) {
      return -1;
    }
    if ( nick1 > nick2 ) {
      return 1;
    }
    return 0;
  } 


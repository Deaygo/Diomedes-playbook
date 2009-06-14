/*
  Copyright (c) 2009 Apphacker apphacker@gmail.com
*/

var view;

if ( !view ) {
  view = { };
}

if ( window.runtime && air && util ) {
  //requires AIR and util

  view.View = function ( model ) {
    this.model = model;
    this.prevWord = null;
    this.input = new view.FormInput( util.get( "textInput" ), util.get("inputForm") );
    this.activityWindow = util.get( "activityWindow" );
    this.channelList = util.get( "channelList" );
    this.titleBar = util.get( "titleBar" );
    this.nickList = util.get( "nickList" );
    this.activityWindows = {};
    this.activeWin = null;
    util.connect( this.channelList, "onclick", this, "handleChannelListClick" );
    util.connect( this.activityWindow, "onclick", this, "handleActivityWindowClick" );
    util.connect( this.titleBar, "onclick", this, "handleTitleBarClick" );
    util.subscribe(topics.USER_HIGHLIGHT, this, "highlight", []);
  }

  _vvp = view.View.prototype;

  _vvp.getConfirmation = function ( msg ) {
    return window.confirm( "You're about to " + msg + ". Are you sure? " );
  }

  _vvp.setContents = function ( node, contents, synchronous ) {
    if ( synchronous ) {
      node.innerHTML = contents;
    } else {
      //performance gain
      window.setTimeout( function() { node.innerHTML = contents; }, 0 );
    }
  }

  _vvp.clearActivityView = function ( ) {
    if ( this.activeWin ) {
      this.activeWin.clear( );
    }
  }

  _vvp.clearNickView = function ( ) {
    this.nickList.innerHTML = "";
  }

  _vvp.displayHelp = function ( ) {
    window.open("help.html", "helpWindow", "height=600, width=400, top=10, left=10");
  }

  _vvp.changeView = function ( serverName, channelName ) {
    if ( !( serverName in this.activityWindows ) ) {
      this.activityWindows[ serverName ] = {};
    }
    if ( !( channelName in this.activityWindows[ serverName ] ) ) {
      this.activityWindows[ serverName ][ channelName ] = new view.ActivityWindow( serverName, channelName, this.model.prefs.getPrefs().historyLength );
    }
    this.activeWin = this.activityWindows[ serverName ][ channelName ];
    if ( this.activityWindow.childNodes.length ) {
      this.activityWindow.replaceChild( this.activeWin.getNode( ), this.activityWindow.firstChild );
    } else {
      this.activityWindow.appendChild( this.activeWin.getNode( ) );
    }
    this.activeWin.changeView( );
  }

  _vvp.handleActivityWindowClick = function ( e ) {
    util.stopEvent( e );
    if ( e.target.nodeName == "A" ) {
      var url = e.target.getAttribute("href");
      if ( url ) {
        var urlReq = new air.URLRequest( url ); 
        air.navigateToURL(urlReq);
      }
    }
    this.input.focus( );
  }

  _vvp.handleChannelListClick = function ( e ) {
    util.stopEvent( e );
    var n = e.target;
    if ( !n ) return;
    if ( n.hasAttribute( "class" ) && ( n.getAttribute( "class" ) == "channelActivity" ) ) {
      n = n.parentNode;
    }
    if ( n.hasAttribute( "class" ) && ( n.getAttribute( "class" ).search( "channelButton" ) != -1 ) ) {
      var server = n.getAttribute( "server" );
      var type = n.getAttribute( "type" );
      var name = n.getAttribute( "name" );
      window.setTimeout( function() {
        util.publish( topics.CHANNEL_SELECTED, [server, type, name] );
      }, 0);
    }
  }

  _vvp.getSortedNicks = function ( users ) {
    var r = [];
    for ( var nick in users ) {
      r.push( nick );
    }
    r.sort( this.nickCompare );
    return r;
  }

  _vvp.nickCompare = function ( nick1, nick2 ) {
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

  _vvp.updateNickView = function ( users, ops, voiced ) {
    if ( !users ) return;
    var mode;
    var r = [];
    var usersR = [];
    var opsR = [];
    var voicedR = [];
    var begTime = new Date().getTime();
    var nicks = this.getSortedNicks( users );
    for ( var i = 0; i < nicks.length; i++ ) {
      var nick = nicks[i];
      if ( nick in ops ) {
        mode = "@";
        opsR.push( this.getNickButton( users[nick], mode ) );
      } else if ( nick in voiced ) {
        mode = "+";
        voicedR.push( this.getNickButton( users[nick], mode ) );
      } else {
        mode = "";
        usersR.push( this.getNickButton( users[nick], mode ) );
      }
    }
    r = r.concat(opsR);
    r = r.concat(voicedR);
    r = r.concat(usersR);
    this.setContents( this.nickList, r.join( "" ), false );
    var endTime = new Date().getTime();
    this.input.setNicks( nicks ); //for tab completion
  }

  _vvp.getNickButton = function ( user, mode ) {
    return [
        ' <span class="nickButton',
        ( mode == "@" ? " op" : "" ),
        ( mode == "+" ? " voiced" : "" ),
        '" mode="',
        mode,
        '" nick="',
        user.nick,
        '" host="',
        user.host,
        '">',
          mode,
          user.nick,
        '</span> '
      ].join("");
  }

  _vvp.updateChannelView = function ( channels, channelsWithActivity, channelsWithHighlight ) {
    if ( !channels ) return;
    var r = [];
    for ( var serverName in channels ) {
      r.push( this.getChannelButton( serverName, serverName, "SERVER" ) );
      var server = channels[ serverName ];
      if ( serverName in channelsWithActivity ) {
        var activeChannels = channelsWithActivity[ serverName ];
      } else {
        var activeChannels = null;
      }
      if ( serverName in channelsWithHighlight ) {
        var highlightedChannels = channelsWithHighlight[ serverName ];
      } else {
        var highlightedChannels = null;
      }
      for ( var channel in server ) {
        var activity = 0;
        if ( activeChannels && ( channel in activeChannels ) ) {
          activity = activeChannels[ channel ];
        } 
        var highlight = false;
        if ( highlightedChannels && ( channel in highlightedChannels ) ) {
          highlight = true;
        }
        r.push( this.getChannelButton( serverName, channel, "CHANNEL",  activity, highlight) );
      }
    }
    this.setContents( this.channelList, r.join( "" ), false ); }

  _vvp.getChannelButton = function ( server, name, type, activity, highlight ) {
    var channelActivity = "";
    if ( activity ) {
      channelActivity = [
        ' <span class="channelActivity">&nbsp;',
        activity,
        ' </span> '
      ].join( "" );
    } 
    return [
        ' <a href="#" class="channelButton',
        ( activity ? " hasActivity " : "" ),
        ( highlight ? " highlight " : "" ),
        '" type="',
        type,
        '" server="',
        server,
        '" name="',
        name,
        '">',
          channelActivity,
          name,
        '</a> '
      ].join( "" );
  }

  _vvp.finishChannelChange = function ( ) {
    this.input.focus( );
  }

  _vvp.updateActivityView = function ( messages, ops, voiced, userNick ) {
    this.activeWin.update( messages, ops, voiced, userNick )
  }

  _vvp.highlight = function ( ) {
    var na = air.NativeApplication;
    var nt = air.NotificationType;
    var nw = air.NativeWindow;
    if ( na.supportsDockIcon ) {
      //bounce dock icon
      var icon = na.nativeApplication.icon;
      icon.bounce( nt.CRITICAL );
    } else if ( nw.supportsNotification ) {
      //flash taskbar
      window.nativeWindow.notifyUser( nt.CRITICAL );
    }
  }

  _vvp.getInput = function ( ) {
    return this.input.getValue( );
  }

  _vvp.destroy = function ( ) {
    util.log( "destroying view" );
    this.input.destroy();
  }
  
  _vvp.openPerformsWindow = function ( networks ) {
    if ( !networks ) networks = [];
    window.performsBridge = {
      util : util,
      topics : topics,
      networks : networks,
      getPerforms : util.hitch( this.model.networks, "getPerforms" ),
    }
    var x = window.nativeWindow.x + 150;
    var y = window.nativeWindow.y + 100;
    var win = window.open("performs.html", "performsWindow", "height=400, width=600, top=" + y + ", left=" + x);
    win = win.nativeWindow;
  }

  _vvp.handlePerformBtnClick = function ( e ) {
    this.model.networks.getNetworks( util.hitch( this, "openPerformsWindow" ) );
  }
  
  _vvp.openChannelsWindow = function ( networks ) {
    if ( !networks ) networks = [];
    window.channelsBridge = {
      util : util,
      topics : topics,
      networks : networks,
      getChannels : util.hitch( this.model.networks, "getChannels" ),
    }
    var x = window.nativeWindow.x + 150;
    var y = window.nativeWindow.y + 100;
    var win = window.open("channels.html", "channelsWindow", "height=500, width=500, top=" + y + ", left=" + x);
    win = win.nativeWindow;
  }

  _vvp.handleChannelsBtnClick = function ( e ) {
    this.model.networks.getNetworks( util.hitch( this, "openChannelsWindow" ) );
  }

  _vvp.openServersWindow = function ( networks ) {
    if ( !networks ) networks = [];
    window.serversBridge = {
      util : util,
      topics : topics,
      networks : networks,
      getServers : util.hitch( this.model.networks, "getServers" ),
    }
    var x = window.nativeWindow.x + 150;
    var y = window.nativeWindow.y + 100;
    var win = window.open("servers.html", "serversWindow", "height=500, width=500, top=" + y + ", left=" + x);
    win = win.nativeWindow;
  }

  _vvp.handleServersBtnClick = function ( e ) {
    this.model.networks.getNetworks( util.hitch( this, "openServersWindow" ) );
  }

  _vvp.handleAliasesBtnClick = function ( e ) {
    this.model.aliases.getAliases( util.hitch( this, "openAliasesWindow" ) );
  }

  _vvp.openAliasesWindow = function ( aliases ) {
    if ( !aliases ) aliases = [];
    window.aliasesBridge = {
      util : util,
      topics : topics,
      aliases : aliases,
    }
    var x = window.nativeWindow.x + 150;
    var y = window.nativeWindow.y + 100;
    var win = window.open("aliases.html", "aliasesWindow", "height=400, width=600, top=" + y + ", left=" + x);
    win = win.nativeWindow;
  }

  _vvp.handleNetworksBtnClick = function ( e ) {
    this.model.networks.getNetworks( util.hitch( this, "openNetworksWindow" ) );
  }

  _vvp.openNetworksWindow = function ( networks ) {
    if ( !networks ) networks = [];
    window.networksBridge = {
      util : util,
      topics : topics,
      preferences : this.model.prefs.getPrefs( ),
      networks : networks,
    }
    var x = window.nativeWindow.x + 150;
    var y = window.nativeWindow.y + 100;
    var win = window.open("networks.html", "networksWindow", "height=400, width=500, top=" + y + ", left=" + x);
    win = win.nativeWindow;
  }


  _vvp.handlePrefBtnClick = function ( e ) {
    window.prefBridge = {
      util : util,
      topics : topics,
      preferences : this.model.prefs.getPrefs( ),
    }
    var x = window.nativeWindow.x + 150;
    var y = window.nativeWindow.y + 100;
    var win = window.open("prefs.html", "prefsWindow", "height=400, width=500, top=" + y + ", left=" + x);
    win = win.nativeWindow;
    this.model.prefs.savePrefs( );
    win.addEventListener( air.Event.CLOSE, util.hitch( this.model.prefs, "savePrefs" )  ); 
  }

  _vvp.handleTitleBarClick = function ( e ) {
    util.stopEvent( e );
    var id = e.target.id;
    if ( id ) { 
      var funcName = "handle" + id + "Click"; 
      if ( this[ funcName ] ) {
        this[ funcName ]( e );
      }
    }
  }

  //FormInput Class

  view.FormInput = function ( node, form ) {
    this.MAX_HISTORY_LENGTH = 50;
    this.input = node;
    this.form = form;
    util.connect(this.form, "onsubmit", this, "handleInput");
    util.connect(this.input, "onkeydown", this, "handleInputChange");
    this.nicks = [];
    this.nickIndex = 0;
    this.input.focus( );
    this.needsResetting = true;
    this.history = [];
    this.historyIndex = 0;
    this.reset( );
  }

  _vip = view.FormInput.prototype;

  _vip.getValue = function ( ) {
    //TODO: add history here and uparrow behavior
    var value = this.input.value;
    this.setValue( "" );
    this.input.focus( );
    return value;
  }

  _vip.setValue = function ( value ) {
    this.input.value = value;
  }

  _vip.focus = function ( ) {
    this.input.focus( );
  }

  _vip.handleInput = function ( e ) {
    var input = util.trim( this.getValue( ) );
    this.addToHistory( input );
    util.log("getInput: " + input );
    util.publish( topics.USER_INPUT, [ input ] );
  }

  _vip.addToHistory = function ( input ) {
    this.history.unshift( input );
    if ( this.history.length > this.MAX_HISTORY_LENGTH ) {
      this.history.pop( );
    }
  }

  _vip.setNicks = function ( nicks ) {
    this.nicks = nicks;
  }

  _vip.handleInputChange = function ( e ) {
    // window.runtime.flash.display
    var key = e.keyCode;
    if ( key == 9 ) {
      this.nickTabCompletion( e );
    } else if ( key == 13 ) {
      this.handleInput ( e );
    } else if ( key == 38 ) {
      this.handleHistoryUp( );
    } else if ( key == 40 ) {
      this.handleHistoryDown( );
    } else {
      this.reset( );
    }
  }

  _vip.handleHistoryUp = function ( ) {
    var value = this.history[ this.historyIndex ];
    if ( value ) {
      this.setValue( this.history[ this.historyIndex ] );
    }
    this.historyIndex++;
    if (this.history.length < this.historyIndex || this.historyIndex > this.MAX_HISTORY_LENGTH ) {
      this.historyIndex = 0;
    }
    this.needsResetting = true;
  }

  _vip.handleHistoryDown = function ( ) {
    if ( this.historyIndex ) {
      var value = this.history[ this.historyIndex ];
      this.historyIndex--;
      if ( value ) {
        this.setValue( value );
        this.needsResetting = true;
        return;
      } 
    } 
    this.setValue( "" );
  }

  _vip.reset = function ( ) {
    //reset whatever tracking code used by fancy
    //key stuff
    if ( this.needsResetting ) {
      this.nickIndex = 0;
      this.nickFragment = null;
      this.savedValue = null;
      this.nickStart = 0;
      this.nickFragEnd = 0;
      this.needsResetting = false;
      this.historyIndex = 0;
    }
  }

  _vip.nickTabCompletion = function ( e ) {
    util.stopEvent( e );
    var n = e.srcElement;
    this.needsResetting = true;
    if ( this.nicks.length ) {
      if ( this.nickFragment ) {
        var startIndex = this.nickIndex;
        var word = this.nickFragment;
        var value = this.savedValue;
        var c = this.nickStart;
        var lc = this.nickFragEnd;
      } else {
        var c = 0;
        var value = n.value;
        var lc = n.selectionStart;
        for ( c = ( lc - 1 ); c > 0; c-- ) {
          if ( value[c] == " " ) break;
        }
        this.nickStart = c;
        this.nickFragEnd = lc;
        var startIndex = 0;
        var word = util.trim( value.substring( c, lc ) ).toLowerCase( );
        this.nickFragment = word;
        this.savedValue = value;
      }
      word = word.split("|").join("\\|").split("^").join("\\^").split("-").join("\\-");
      for ( var i = startIndex; i < this.nicks.length; i++ ) {
        var nick = this.nicks[i];
        var nickLC = nick.toLowerCase( );
        if ( nickLC.search( word ) == 0 ) {
          //add nick
          this.nickIndex = i + 1;
          //if c is 0 replace at beginning, if not, one char after c (that is after space)
          var beg = value.slice( 0, ( c ? c + 1 : c ) );
          var end = value.slice( lc, 0 );
          //if c is 0 add : and space, else add just a space
          this.setValue( [ beg, nick, ( c ? " " : ": " ), end ].join( "" ) );
          //place cursor?
          return;
        }
      }
      //didn't find a match
      this.nickIndex = 0;
      return;
    }
  }

  _vip.destroy = function ( ) {
    delete this.nicks;
    delete this.history;
    delete this.input;
    delete this.form;
  }

  view.ActivityWindow = function ( serverName, channelName, maxItems ) {
    this.linkRegex = /(https?:\/\/\S+)\s?/g;
    this.colorCode = String.fromCharCode( 003 );
    this.normalCode = String.fromCharCode( 017 );
    this.boldCode = String.fromCharCode( 002 );
    this.underlineCode = String.fromCharCode( 037 );
    this.italicsCode = String.fromCharCode( 026 );
    this.COLOR_CODES = [
      "#fff", //white
      "#000", //black
      "#0000FF", //blue
      "#339900", //green
      "#FF0000", //lightred
      "#A62A2A", //brown
      "#CC0099", //purple
      "#FF7F00", //orange
      "#FFFF00", //yellow
      "#00FF00", //lightgreen
      "#008888", //cyan
      "#9999FF", //lightcyan
      "#0066FF", //light blue
      "#BC8F8F", //pink
      "#C0C0C0", //grey
      "#A8A8A8", //lightgrey
    ]
    this.win = document.createElement( "div" );
    this.win.setAttribute( "class", "activityWin" );
    this.serverName = serverName; 
    this.channelName = channelName;
    this.isInStyle = false;
    this.isInBold = false;
    this.maxItems = maxItems;
    util.subscribe( topics.PREFS_CHANGE_HISTORY_LENGTH, this, "handleChangeHistoryLength", [] );
  }

  _vap = view.ActivityWindow.prototype;

  _vap.setContents = _vvp.setContents;

  _vap.handleChangeHistoryLength = function ( newLen ) {
    this.maxItems = newLen;
    window.setTimeout( util.hitch( this, "shrinkActivity", [ newLen ] ), 0 );
  }

  _vap.shrinkActivity = function ( len ) {
    var w = this.win;
    for ( var i = this.win.childNodes.length; i > len; i-- ) {
      w.removeChild( w.firstChild );
    }
  }

  _vap.clear = function ( ) {
    this.win.innerHTML = "";
  }

  _vap.update = function ( messages, ops, voiced, userNick ) {
    var w = this.win;
    var diff = Math.abs( w.scrollTop - ( w.scrollHeight - w.offsetHeight ) );
    var variance = 5;
    var isAtBottom = false;
    if ( diff < variance ) {
      isAtBottom = true;
    }
    if ( !messages || !messages.length) return;
    var r = [], msg;
    while ( messages.length ) {
      msg = messages.shift( );
      var newMsg = msg.getDisplay( );
      if ( !newMsg ) {
        var showBrackets = true;
        var isServer = false;
        var isAction = false;
        var isNotice = false;
        var referencesUser = msg.referencesUser( );
        var m = msg.msg;
        if ( msg.cmd ) {
          //XXX: need to get rid of this switch statement some how
          switch ( msg.cmd.toLowerCase( ) ) {
            case "mode":
              isServer = true;
              m = msg.nick + " has changed modes for " + msg.target + " to: " + m;
              break;
            case "action":
              isAction = true;
              showBrackets = false;
              break;
            case "kick":
              isServer = true;
              m = msg.nick + " has " + msg.getAltNick( ) + " kicked from " + msg.target + ": " + m;
              break;
            case "part":
              isServer = true;
              //XXX: make a pref here about showing quit messages
              m = msg.nick + " has parted " + msg.target + ": " + m;
              break;
            case "topic":
              isServer = true;
              var d = " On " + msg.datetime.toUTCString( ) + " "; 
              m = d + msg.nick + " set the topic for " + msg.target + " to: " + m ;
              break;
            case "notice":
              m = msg.target + ": - NOTICE - " + m;
              isNotice = true;
              break;
            case "join":
              isServer = true;
              m = msg.nick + " has joined " + msg.target + ".";
              break;
            case "nick":
              m = msg.nick + " is now known as " + m + ".";
              isServer = true;
              break;
            case "quit":
              m = msg.nick + " has quit: " + m;
              isServer = true;
              break;
            case "server":
              isServer = true;
              break;
          }
        }
        if ( msg.isAction ) showBrackets = false;
        if ( isServer ) {
          var nick = "Server";
        } else if ( msg.nick in ops ) {
          var nick = "@" + msg.nick;
        } else if ( msg.nick in voiced ) {
          var nick = "+" + msg.nick;
        } else {
          var nick = msg.nick;
        }
        var isSelf = ( msg.nick == userNick );
        var dates = this.formatDate( msg.datetime );
        newMsg = [].concat( [
            '<div class="message">',
              '<span class="messageData">',
              '<span class="messageTime" title="',
                dates.long,
              '">',
                dates.short,
              '</span> ',
              '<span class="messageNick',
              ( isAction ? ' isAction' : '' ),
              ( isServer ? ' isServer' : '' ),
              ( isNotice ? ' isNotice' : '' ),
              ( isSelf ? ' isSelf' : '' ),
              ( referencesUser ? ' referencesUser' : '' ),
              '">',
              [
                ( showBrackets ? '&lt;' : ''  ),
                nick,
                ( showBrackets ? '&gt;' : ''  ),
              ].join( "" ),
              '</span>',
              '</span> ',
              '<span class="messageText',
              ( isAction ? ' isAction' : '' ),
              ( isServer ? ' isServer' : '' ),
              ( isNotice ? ' isNotice' : '' ),
              ( isSelf ? ' isSelf' : '' ),
              ( referencesUser ? ' referencesUser' : '' ),
              '"> ',
                this.textFormat( m ),
              '</span> ',
            '</div>'
        ] );
        var childNodes = w.childNodes;
        if ( childNodes.length > this.maxItems ) {
          w.removeChild( w.firstChild );
        }
        var n = document.createElement("div");
        n.innerHTML = newMsg.join( "" );
        w.appendChild( n );
        msg.setDisplay( newMsg );
      }
    }
    if ( isAtBottom ) {
      w.scrollTop = w.scrollHeight;
    }
  }

  _vap.changeView = function ( ) {
    //scroll to bottom
    this.win.scrollTop = this.win.scrollHeight;
  }

  _vap.getNode = function ( ) {
    return this.win;
  }

  _vap.formatDate = function ( date_ ) {
    var year = date_.getFullYear();
    var month = (date_.getMonth() + 1);
    var day = date_.getDate();
    var hour = date_.getHours();
    var minute = date_.getMinutes();
    var second = date_.getSeconds();
    return {
      "long" : [
        "[",
          year,
          "-",
          month,
          "-",
          day,
          " ",
          hour,
          ":",
          minute,
          ":",
          second,
        "]"
      ].join( "" ),
      "short" : [
        "[",
          hour,
          ":",
          minute,
        "]"
      ].join( "" )
    };
  }

  _vap.textFormat = function ( msg ) {
    msg = this.findBold( msg );
    msg = [ msg, this.closeOpenMarkup("isInBold", "</strong>" ) ].join( "" );
    msg = this.findColors( msg );
    msg = [ msg, this.closeOpenMarkup("isInStyle", "</span>" ) ].join( "" );
    msg = this.findLinks( msg );
    return msg;
  }

  _vap.findBold = function ( msg ) {
    var pos = msg.search( this.boldCode );
    if ( pos != -1 ) {
      var beg = msg.slice( 0, pos );
      if ( this.isInBold ) {
        var middle = "</strong>";
        this.isInBold = false;
      } else {
        var middle = "<strong>";
        this.isInBold = true;
      }
      var end = msg.slice( pos + 1 );
      var newMsg = [beg, middle, end].join( "" );
      newMsg = this.findBold( newMsg );
    } else {
      var newMsg = msg;
    }
    return newMsg;
  }
  
  _vap.findColors = function ( msg ) {
    var pos = msg.search( this.colorCode );
    var styles = [];
    var styleLength = 0;
    if ( pos != -1 ) {
      styleLength += 1; //control character
      var possibleCode = msg.substr( pos + 1, 7 );
      var setResult = this.setColorStyle( possibleCode, false );
      if ( setResult ) {
        styleLength += setResult.length;
        styles.push( setResult.style );
        var commaPos = possibleCode.search( "," );
        if ( commaPos != -1 ) {
          possibleCode = possibleCode.substr( commaPos + 1);
          setResult = this.setColorStyle( possibleCode, true );
          if ( setResult ) {
            styleLength += setResult.length;
            styles.push( setResult.style );
          }
        }
      }
      var beg = msg.slice( 0, pos );
      var middleParts = [];
      if ( this.isInStyle ) {
        middleParts.push( '</span>' );
        this.isInStyle = false;
      }
      if ( styles.length ) {
        middleParts.push( '<span style="' );
        middleParts.push( styles.join( "" ) );
        middleParts.push( '">' );
        this.isInStyle = true;
      }
      if ( middleParts.length ) {
        var middle = middleParts.join( "" );
      } else {
        var middle = "";
      }
      var end = msg.slice( pos + styleLength );
      var newMsg = [beg, middle, end].join( "" );
      newMsg = this.findColors( newMsg );
    } else {
      var newMsg = msg;
    }
    return newMsg;
  }

  _vap.findLinks = function ( msg ) {
    var newMsg = msg.replace( this.linkRegex, ' <a target="_blank" class="ircLink" href="$1">$1</a> ' );
    return newMsg;
  }

  _vap.setColorStyle = function ( possibleCode, isBackground ) {
    var color = parseInt( possibleCode, 10 );
    var styleString;
    var styleLength = 0;
    if ( isBackground ) {
      var styleName = "background-color:";
      styleLength += 1; //for comma
    } else {
      var styleName = "color:";
    }
    if ( !isNaN( color ) && color in this.COLOR_CODES ) {
      styleString = [ styleName , this.COLOR_CODES[color], ";" ].join( "" );
      if ( possibleCode[0] == "0" || color > 9 ) {
        styleLength += 2;
      } else {
        styleLength += 1;
      }
      return { length: styleLength, style: styleString };
    } else {
      return null;
    }
  }

  _vap.closeOpenMarkup = function ( type_, markup) {
      if ( this[type_] ) {
        this[type_] = false;
        return markup;
      } else {
        return "";
      }
  }

}

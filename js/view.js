/*
  Copyright (c) 2009 Apphacker apphacker@gmail.com
*/

var dView;

if ( !dView ) {
  dView = { };
}

if ( window.runtime && air && util ) {
  //requires AIR and util

  dView.View = function ( model ) {
    this.model = model;
    this.prevWord = null;
    this.input = new dView.FormInput( util.get( "textInput" ), util.get("inputForm") );
    this.activityWindow = util.get( "activityWindow" );
    this.channelList = util.get( "channelList" );
    this.titleBar = util.get( "titleBar" );
    this.nickList = util.get( "nickList" );
    this.font = null;
    var prefs = this.model.prefs.getPrefs( );
    this.changeFont( prefs.multiOptionPrefs.font, prefs.fontSize );
    this.activityWindows = {};
    this.activeWin = null;
    this.appVersion = "";

    util.connect( this.channelList, "onclick", this, "handleChannelListClick" );
    util.connect( this.activityWindow, "onclick", this, "handleActivityWindowClick" );
    util.connect( this.titleBar, "onclick", this, "handleTitleBarClick" );
    util.connect( util.get( "prefBtn" ), "onclick", this, "handlePrefsBtnClick" );
    util.connect( window, "onclick", this, "handleWindowClick" );
    util.subscribe( topics.USER_HIGHLIGHT, this, "highlight", [] );
    util.subscribe( topics.PREFS_CHANGE_FONT, this, "changeFont", [] );
    util.subscribe( topics.NOTIFY, this, "notify", []);
    util.subscribe( topics.CHANNEL_TOPIC, this, "handleTopic", [] );
  }

  _vvp = dView.View.prototype;

  _vvp.handlePrefsBtnClick = function ( e ) {
    util.stopEvent( e );
    util.remClass( this.titleBar, "hidden" );
  }

  _vvp.handleWindowClick = function ( e ) {
    util.addClass( this.titleBar, "hidden" );
  }

  _vvp.setTopicView = function ( channelName, topic ) {
    var msg = channelName;
    if ( topic ) {
      msg += ": " + topic;
    }
    document.title = msg;
  }

  _vvp.handleTopic = function ( serverName, channelName, topic ) {
    if ( this.activeWin.serverName == serverName && this.activeWin.channelName == channelName ) {
      this.setTopicView( channelName, topic );
    }
  }

  _vvp.changeFont = function ( fontPrefs, size ) {
    for ( var i = 0; i < fontPrefs.length; i++ ) {
      var font = fontPrefs[ i ];
      if ( "selected" in font ) {
        this.setFont( font.value, size );
        return;
      }
    }
  }

  _vvp.setFont = function ( font, size ) {
    this.font = font;
    size = parseInt( size, 10 );
    if ( size < 8 ) {
      size = 8;
    } else if ( size > 32 ) {
      size = 32;
    }
    size = size.toString( );
    util.get( "body" ).setAttribute( "style", [ 
      "font-family: ",  
      font,
      ";",
      "font-size: ",
      size,
      "px;"
    ].join( "" ) ); 
  }

  _vvp.notify = function ( msg ) {
    if ( msg ) {
      alert( msg );
    }
  }

  _vvp.setAppVersion = function ( info ) {
    this.appVersion = info;
  }

  _vvp.sanitize = function ( msg ) {
    if ( msg ) {
      msg = msg.split( "&" ).join( "&amp;" );
      msg = msg.split( "<" ).join( "&lt;" );
      msg = msg.split( ">" ).join( "&gt;" );
      msg = msg.split( '"' ).join( "&quot;" );
    }
    return msg;
  }

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
    this.activeWin.nickWindow.clear( );
  }

  _vvp.displayHelp = function ( ) {
    window.open("help.html", "helpWindow", "height=600, width=400, top=10, left=10");
  }

  _vvp.changeView = function ( serverName, channelName, topic ) {
    this.createActivityViewIfNeeded( channelName, serverName );
    this.activeWin = this.getActivityWindow( channelName, serverName )
    this.setTopicView( channelName, topic );
    if ( this.activityWindow.childNodes.length ) {
      this.activityWindow.replaceChild( this.activeWin.getNode( ), this.activityWindow.firstChild );
    } else {
      this.activityWindow.appendChild( this.activeWin.getNode( ) );
    }
    if ( this.nickList.childNodes.length ) {
      this.nickList.replaceChild( this.activeWin.nickWindow.getNode( ), this.nickList.firstChild );
    } else {
      this.nickList.appendChild( this.activeWin.nickWindow.getNode( ) );
    }
    this.activeWin.changeView( );
    this.input.changeChannel( this.activeWin.nickWindow.getNicks( ), serverName, channelName );
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
    this.handleWindowClick( e );
  }

  _vvp.handleChannelListClick = function ( e ) {
    util.stopEvent( e );
    var n = e.target;
    if ( !n ) return;
    n = util.findUp( n, "channelBtn" );
    if ( n ) {
      var server = n.getAttribute( "server" );
      var type = n.getAttribute( "type" );
      var name = n.getAttribute( "name" );
      window.setTimeout( function() {
        util.publish( topics.CHANNEL_SELECTED, [server, type, name] );
      }, 0);
    }
    this.handleWindowClick( e );
  }


  _vvp.updateNickView = function ( users, serverName, channelName ) {
    this.createActivityViewIfNeeded( channelName, serverName );
    this.getActivityWindow( channelName, serverName ).nickWindow.update( users, channelName );
  }

  _vvp.updateChannelView = function ( channels, channelsWithActivity, channelsWithHighlight ) {
    util.log("updateChannelView");
    if ( !channels ) return;
    var r = [];
    var channelsR = [];
    for ( var serverName in channels ) {
      r.push( this.getChannelButton( serverName, serverName, serverName, "SERVER" ) );
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
      for ( var channelKey in server ) {
        //channelKey is channelName in lowercase
        channelsR.push( channelKey );
        var activity = 0;
        if ( activeChannels && ( channelKey in activeChannels ) ) {
          activity = activeChannels[ channelKey ];
        } 
        var highlight = false;
        if ( highlightedChannels && ( channelKey in highlightedChannels ) ) {
          highlight = true;
        }
        channelName = server[ channelKey ].getName( ); //channel
        r.push( this.getChannelButton( serverName, channelKey, channelName, "CHANNEL",  activity, highlight) );
      }
    }
    this.setContents( this.channelList, r.join( "" ), false ); 
    this.input.setChannels( channelsR );
  }

  _vvp.getChannelButton = function ( server, channelKey, channelName, type, activity, highlight ) {
    util.log("getChannelButton");
    util.log("this.activeWin: " + this.activeWin );
    //channelKey is channelName in lowercase
    var channelActivity = "";
    if ( activity ) {
      channelActivity = [
        ' <span class="channelActivity">&nbsp;',
        activity,
        ' </span> '
      ].join( "" );
    } 
    if ( this.activeWin ) {
      var currentChannel = ( channelKey == this.activeWin.channelName 
        && server == this.activeWin.serverName );
    } else {
      var currentChannel = false;
    }
    return [
        ' <a href="#" class="channelBtn',
        ( activity ? " hasActivity " : "" ),
        ( highlight ? " highlight " : "" ),
        ( currentChannel  ? " currentChannel " : "" ),
        '" type="',
        this.sanitize( type ),
        '" server="',
        this.sanitize( server ),
        '" name="',
        this.sanitize( channelKey ),
        '">',
          ' <span class="channelBtnWrapper"> ',
          channelActivity,
          ' <span class="channelBtnName" >',
            this.sanitize( channelName ),
          ' </span>',
          '</span> ',
        '</a> '
      ].join( "" );
  }

  _vvp.finishChannelChange = function ( ) {
    this.input.focus( );
  }

  _vvp.createActivityViewIfNeeded = function ( channelName, serverName ) {
    channelName = channelName.toLowerCase( );
    serverName = serverName.toLowerCase( );
    if ( !( serverName in this.activityWindows ) ) {
      this.activityWindows[ serverName ] = {};
    }
    if ( !( channelName in this.activityWindows[ serverName ] ) ) {
      this.activityWindows[ serverName ][ channelName ] = new dView.ActivityWindow( serverName, 
          channelName, 
          this.model.prefs.getPrefs( ).historyLength, 
          this.model.prefs.getPrefs( ).multiOptionPrefs.time 
      );
    }
  }

  _vvp.getActivityWindow = function ( channelName, serverName ) {
    channelName = channelName.toLowerCase( );
    serverName = serverName.toLowerCase( );
    if ( serverName in this.activityWindows ) {
      if ( channelName in this.activityWindows[ serverName ] ) {
        return this.activityWindows[ serverName ][ channelName ];
      }
    }
    return null;
  }

  _vvp.updateActivityView = function ( messages, userNick, channelName, serverName ) {
    this.createActivityViewIfNeeded( channelName, serverName );
    this.getActivityWindow( channelName, serverName ).update( messages, userNick, channelName );
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

  _vvp.handleAboutBtnClick = function ( e ) {
    var s = this.appVersion; 
    s += "\n\nTwitter: @apphacker";
    s += "\nEmail: apphacker@gmail.com";
    s += "\nWebsite: http://www.apphackers.com";
    s += "\nBlog: http://apphacker.wordpress.com";
    alert( s );
  }

  _vvp.handleHelpBtnClick = function ( e ) {
    this.displayHelp( );
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
    this.handleWindowClick( e );
  }

  //FormInput Class

  dView.FormInput = function ( node, form ) {
    this.MAX_HISTORY_LENGTH = 50;
    this.input = node;
    this.form = form;
    util.connect(this.form, "onsubmit", this, "handleInput");
    util.connect(this.input, "onkeydown", this, "handleInputChange");
    this.nicks = [];
    this.listItemIndex = 0;
    this.input.focus( );
    this.needsResetting = true;
    this.tabFragment = null;
    this.history = [];
    this.historyIndex = 0;
    this.reset( );
    this.channelName = null;
    this.serverName = null;
    this.channels = [];
    util.subscribe( topics.NICK_CHANGE, this, "handleNickChange", [] );
  }

  _vip = dView.FormInput.prototype;

  _vip.getValue = function ( ) {
    //TODO: add history here and uparrow behavior
    var value = this.input.value;
    this.setValue( "" );
    this.input.focus( );
    return value;
  }

  _vip.setValue = function ( value ) {
    var input = this.input;
    input.value = value;
    window.setTimeout( function ( ) {
      var length = input.value.length;
      input.setSelectionRange(length, length);
    }, 0 );
  }

  _vip.focus = function ( ) {
    this.input.focus( );
  }

  _vip.handleInput = function ( e ) {
    util.stopEvent( e );
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

  _vip.changeChannel = function ( nicks, serverName, channelName ) {
    this.serverName = serverName;
    this.channelName = channelName;
    this.nicks = nicks;
  }

  _vip.setChannels = function ( channels ) {
    this.channels = channels;
  }

  _vip.handleNickChange = function ( nicks, serverName, channelName ) {
    if ( serverName == this.serverName && channelName == this.channelName ) {
      this.nicks = nicks;
    }
  }

  _vip.handleInputChange = function ( e ) {
    // window.runtime.flash.display
    var key = e.keyCode;
    if ( key == 9 ) {
      this.tabCompletion( e );
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
    this.historyIndex++;
    var value = this.history[ this.historyIndex - 1 ];
    if ( value ) {
      this.setValue( value );
    }
    if (this.history.length < this.historyIndex || this.historyIndex > this.MAX_HISTORY_LENGTH ) {
      this.historyIndex = 0;
      this.setValue( "" );
    }
    this.needsResetting = true;
  }

  _vip.handleHistoryDown = function ( ) {
    if ( this.historyIndex ) {
      this.historyIndex--;
      var value = this.history[ this.historyIndex - 1 ];
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
      this.listItemIndex = 0;
      this.tabFragment = null;
      this.savedValue = null;
      this.tabStart = 0;
      this.tabFragEnd = 0;
      this.needsResetting = false;
      this.historyIndex = 0;
    }
  }

  _vip.tabCompletion = function ( e ) {
    util.stopEvent( e );
    var n = e.srcElement;
    this.needsResetting = true;
    if ( this.nicks.length || this.channels.length ) {
      if ( this.tabFragment ) {
        var startIndex = this.listItemIndex;
        var word = this.tabFragment;
        var value = this.savedValue;
        var c = this.tabStart;
        var lc = this.tabFragEnd;
      } else {
        var c = 0;
        var value = n.value;
        var lc = n.selectionStart;
        for ( c = ( lc - 1 ); c > 0; c-- ) {
          if ( value[c] == " " ) break;
        }
        this.tabStart = c;
        this.tabFragEnd = lc;
        var startIndex = 0;
        var word = util.trim( value.substring( c, lc ) ).toLowerCase( );
        this.tabFragment = word;
        this.savedValue = value;
      }
      word = word.split( "|" ).join( "\\|" ).split( "^" ).join( "\\^" ).split( "-" ).join( "\\-" );
      word = word.split( "[" ).join( "\\[" ).split( "]" ).join( "\\]" );
      if ( word && word.length && word[ 0 ] == "#" ) {
        var list = this.channels;
      } else {
        var list = this.nicks;
      }
      for ( var i = startIndex; i < list.length; i++ ) {
        var listItem = list[ i ];
        var listItemLC = listItem.toLowerCase( );
        if ( listItemLC.search( word ) == 0 ) {
          //add 
          this.listItemIndex = i + 1;
          //if c is 0 replace at beginning, if not, one char after c (that is after space)
          var beg = value.slice( 0, ( c ? c + 1 : c ) );
          var end = value.slice( lc, 0 );
          //if c is 0 add : and space, else add just a space
          this.setValue( [ beg, listItem, ( c ? " " : ": " ), end ].join( "" ) );
          //place cursor?
          return;
        }
      }
      //didn't find a match
      this.listItemIndex = 0;
      return;
    }
  }

  _vip.destroy = function ( ) {
    delete this.nicks;
    delete this.history;
    delete this.input;
    delete this.form;
  }

  dView.ActivityWindow = function ( serverName, channelName, maxItems, timeFormat ) {
    this.linkRegex = /(https?:\/\/\S+)\s?/g;
    this.colorCode = String.fromCharCode( 003 );
    this.normalCode = String.fromCharCode( 017 );
    this.boldCode = String.fromCharCode( 002 );
    this.underlineCode = String.fromCharCode( 037 );
    this.italicsCode = String.fromCharCode( 026 );
    this.setTimeFormat( timeFormat );
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
    ];
    this.nickWindow = new dView.NickWindow( serverName, channelName );
    this.topic = null;
    this.win = document.createElement( "div" );
    this.win.setAttribute( "class", "activityWin" );
    this.serverName = serverName; 
    this.channelName = channelName;
    this.isInStyle = false;
    this.isInBold = false;
    this.maxItems = maxItems;
    util.subscribe( topics.PREFS_CHANGE_HISTORY_LENGTH, this, "handleChangeHistoryLength", [] );
    util.subscribe( topics.PREFS_CHANGE_TIME_FORMAT, this, "setTimeFormat", [] );
    util.subscribe( topics.CHANNEL_TOPIC, this, "handleTopic", [] );
  }

  _vap = dView.ActivityWindow.prototype;

  _vap.sanitize = dView.View.prototype.sanitize;

  _vap.setContents = _vvp.setContents;

  _vap.getTopic = function ( ) {
    return this.topic;
  }

  _vap.handleTopic = function ( serverName, channelName, topic ) {
    if ( serverName == this.serverName && channelName == this.channelName ) {
      this.topic = topic;
    }
  }

  _vap.setTimeFormat = function ( timePrefs ) {
    for ( var i = 0; i < timePrefs.length; i++ ) {
      var time = timePrefs[ i ];
      if ( "selected" in time ) { 
        this.timeFormat = parseInt( time.value, 10 );
        return;
      }
    }
  }

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

  _vap.makeFullID = function ( nick, user ) {
    if ( user ) {
      var host = user.getHost( );
      if ( host ) {
        nick = [ nick, "!", host ].join( "" );
      }
    }
    return nick;
  }

  _vap.update = function ( messages, userNick, channelName ) {
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
              var altUser = msg.getAltUser( );
              m = msg.nick + " has kicked " + this.makeFullID( altUser.nick, altUser ) + " from " + msg.target + ": " + m;
              break;
            case "part":
              isServer = true;
              //XXX: make a pref here about showing quit messages
              m = this.makeFullID( msg.nick, msg.user ) + " has parted " + msg.target + ": " + m;
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
              m = this.makeFullID( msg.nick, msg.user ) + " has joined " + msg.target + ".";
              break;
            case "nick":
              m = msg.nick + " is now known as " + m + ".";
              isServer = true;
              break;
            case "quit":
              m = this.makeFullID( msg.nick, msg.user ) + " has quit: " + m;
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
        } else if ( msg.user && msg.user.isCreator( channelName ) ) {
          var nick = "!" + msg.nick;
        } else if ( msg.user && msg.user.isOp( channelName ) ) {
          var nick = "@" + msg.nick;
        } else if ( msg.user && msg.user.isHalfOp( channelName ) ) {
          var nick = "%" + msg.nick;
        } else if ( msg.user && msg.user.isVoice( channelName ) ) {
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
                this.sanitize( nick ),
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
                this.textFormat( this.sanitize( m ) ),
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

  _vap.formatDateItem = function ( dateItem ) {
    dateItem = dateItem.toString( );
    if ( dateItem.length == 1 ) {
      dateItem = [ "0",  dateItem ].join( "" );
    }
    return dateItem;
  }

  _vap.formatDate = function ( date_ ) {
    var year = this.formatDateItem( date_.getFullYear( ) );
    var month = this.formatDateItem( date_.getMonth( ) + 1 );
    var day = this.formatDateItem( date_.getDate( ) );
    var hour =  date_.getHours( );
    if ( this.timeFormat < 24 ) {
      if ( hour > 12 ) {
        hour = hour - 12;
        var clock = "pm";
      } else {
        var clock = "am";
      }
    } else {
      var clock = "";
    }
    hour = this.formatDateItem( hour );
    var minute = this.formatDateItem( date_.getMinutes( ) );
    var second = this.formatDateItem( date_.getSeconds( ) );
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
          clock, 
        "]"
      ].join( "" ),
      "short" : [
        "[",
          hour,
          ":",
          minute,
          clock,
        "]"
      ].join( "" )
    };
  }

  _vap.textFormat = function ( msg ) {
    msg = msg.split("  ").join(" &nbsp;");
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

  dView.NickWindow = function ( serverName, channelName ) {
    this.serverName = serverName;
    this.channelName = channelName;
    this.win = document.createElement( "div" );
    this.win.setAttribute( "class", "nickWin" );
    this.win.setAttribute( "server", this.serverName );
    this.win.setAttribute( "channel", this.channelName );
  }

  _vnw = dView.NickWindow.prototype;

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
    for ( var i = 0; i < nicks.length; i++ ) {
      var nick = nicks[ i ];
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
    r = r.concat( creatorsR );
    r = r.concat( opsR );
    r = r.concat( halfOpsR );
    r = r.concat( voicedR );
    r = r.concat( usersR );
    this.setContents( this.win, r.join( "" ), false );
    this.nicks = nicks;
    util.publish( topics.NICK_CHANGE, [ nicks, this.serverName, this.channelName ] );
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

}

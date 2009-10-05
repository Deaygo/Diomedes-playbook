/*
  Copyright (c) 2009 Apphacker apphacker@gmail.com
*/

dojo.provide( "diom.view.view" );

var dView;

if ( !dView ) {
  dView = { };
}


  dView.View = function ( model ) {
    this.model = model;
    this.prevWord = null;
    this.input = new dView.FormInput( util.get( "textInput" ), util.get("inputForm") );
    this.popup = util.get( "popup" );
    this.popupContents = util.get( "popupContents" );
    this.linkView = new dView.LinkView( this.popupContents );
    this.activityWindow = util.get( "activityWindow" );
    this.channelList = util.get( "channelList" );
    this.titleBar = util.get( "titleBar" );
    this.nickList = util.get( "nickList" );
    this.font = null;
    var prefs = this.model.prefs.getPrefs( );
    this.changeFont( prefs.multiOptionPrefs.font, prefs.fontSize );
    this.changeTheme( prefs.multiOptionPrefs.theme );
    this.activityWindows = {};
    this.activeWin = null;
    this.activeNickCount = 0;
    this.appVersion = "";

    util.connect( this.channelList, "onclick", this, "handleChannelListClick" );
    util.connect( window, "onclick", this, "handleActivityWindowClick" );
    util.connect( this.titleBar, "onclick", this, "handleTitleBarClick" );
    util.connect( util.get( "prefBtn" ), "onclick", this, "handlePrefsBtnClick" );
    util.connect( util.get( "linksBtn" ), "onclick", this, "handleLinksBtnClick" );
    util.connect( util.get( "closePopup" ), "onclick", this, "closePopup" );
    util.connect( window, "onclick", this, "handleWindowClick" );
    util.subscribe( diom.topics.USER_HIGHLIGHT, this, "highlight", [] );
    util.subscribe( diom.topics.PREFS_CHANGE_FONT, this, "changeFont", [] );
    util.subscribe( diom.topics.PREFS_CHANGE_THEME, this, "changeTheme", [] );
    util.subscribe( diom.topics.NOTIFY, this, "notify", []);
    util.subscribe( diom.topics.CHANNEL_TOPIC, this, "handleTopic", [] );
    util.subscribe( diom.topics.NICK_CHANGE, this, "handleNickChange", [] );
    util.subscribe( diom.topics.INPUT_PAGE_UP, this, "scrollUp", [] );
    util.subscribe( diom.topics.INPUT_PAGE_DOWN, this, "scrollDown", [] );
    util.subscribe( diom.topics.INPUT_CHANNEL_NEXT, this, "selectNextChannel", [] );
    util.subscribe( diom.topics.INPUT_CHANNEL_PREV, this, "selectPrevChannel", [] );
    util.subscribe( diom.topics.INPUT_CHANNEL_PART, this, "closeCurrentChannel", [] );
    util.subscribe( diom.topics.INPUT_CHANNEL_INDEX, this, "selectChannelFromIndex", [] );
    util.subscribe( diom.topics.UPDATE_NO_NEW_UPDATES, this, "showNoUpdatesDialog", [] );
  }

  var _vvp = dView.View.prototype;

  _vvp.showNoUpdatesDialog = function( ) {
    this.notify( "No new updates." );
  }

  _vvp.scrollUp = function ( ) {
    if ( this.activeWin ) {
      this.activeWin.scrollUp( );
    }
  }

  _vvp.scrollDown = function ( ) {
    if ( this.activeWin ) {
      this.activeWin.scrollDown( );
    }
  }

  _vvp.closePopup = function ( e ) {
    util.addClass( this.popup, "hidden" );
    this.popupContents.innerHTML = "";
  }

  _vvp.handleLinksBtnClick = function ( e ) {
    util.stopEvent( e );
    this.linkView.display( );
    util.remClass( this.popup, "hidden" );
  }

  _vvp.handlePrefsBtnClick = function ( e ) {
    util.stopEvent( e );
    util.remClass( this.titleBar, "hidden" );
  }

  _vvp.handleWindowClick = function ( e ) {
    util.addClass( this.titleBar, "hidden" );
  }

  _vvp.setTopicView = function ( channelName, topic ) {
    var msg = channelName, nickCount = "";
    if ( this.activeNickCount ) {
      nickCount = " (" + this.activeNickCount + ") ";
    } 
    if ( topic ) {
      msg += nickCount + ": " + topic;
    }
    document.title = msg;
  }

  _vvp.handleNickChange = function ( nicks, serverName, channelName ) {
    var topic, tmp;
    if ( this.activeWin.serverName == serverName && this.activeWin.channelName == channelName ) {
      this.activeNickCount = nicks.length;
      tmp = document.title.split( ": " );
      tmp.shift( );
      topic = tmp.join( ": " );
      this.setTopicView( channelName, topic );
    }
  }

  _vvp.handleTopic = function ( serverName, channelName, topic ) {
    if ( this.activeWin.serverName == serverName && this.activeWin.channelName == channelName ) {
      this.setTopicView( channelName, topic );
    }
  }

  _vvp.changeTheme = function ( themePrefs ) {
    for ( var i = 0; i < themePrefs.length; i++ ) {
      var theme = themePrefs[ i ];
      if ( "selected" in theme ) {
        this.setTheme( theme.value );
        return;
      }
    }
  }

  _vvp.setTheme = function ( themeName ) {
    var cssPath = "/css/themes/";
    var n = util.get( "themeLink" );
    n.setAttribute( "href", [ cssPath, themeName, ".css" ].join( "" ) );
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
    window.open("help.html", "helpWindow", "height=600, scrollbars=yes, width=400, top=10, left=10");
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
        var urlReq = new air.URLRequest( util.trim( url ) ); 
        air.navigateToURL(urlReq);
      }
    }
    this.input.focus( );
    this.handleWindowClick( e );
  }

  _vvp.closeTabFromNode = function ( n ) {
    if ( n ) {
      var server = n.getAttribute( "server" );
      var name = n.getAttribute( "name" );
      if ( name == server ) {
        window.setTimeout( function() {
          util.publish( diom.topics.NETWORK_CLOSE, [ server ] );
        }, 0);
      } else {
        window.setTimeout( function() {
          util.publish( diom.topics.CHANNEL_CLOSE, [ server, name ] );
        }, 0);
      }
    }
  }

  _vvp.selectChannelFromNode = function ( n ) {
    if ( n ) {
      var server = n.getAttribute( "server" );
      var type = n.getAttribute( "type" );
      var name = n.getAttribute( "name" );
      window.setTimeout( function() {
        util.publish( diom.topics.CHANNEL_SELECTED, [ server, type, name ] );
      }, 0);
    }
  }


  _vvp.handleChannelListClick = function ( e ) {
    util.stopEvent( e );
    var n = e.target;
    if ( !n ) return;
    if ( util.hasClass( n, "closeChannelBtn" ) ) {
      n = util.findUp( n, "channelBtn" );
      this.closeTabFromNode( n );
      return;
    }
    n = util.findUp( n, "channelBtn" );
    this.selectChannelFromNode( n );
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

  _vvp.closeCurrentChannel = function ( ) {
    var cl = this.channelList;
    var nodes = cl.getElementsByTagName( "a" );
    if ( !nodes || !nodes.length ) return;
    var prev = null;
    for ( var i = 0; i < nodes.length; i++ ) {
      var n = nodes[ i ];
      if ( util.hasClass( n, "currentChannel" ) ) {
        this.closeTabFromNode( n );
      }
    }
  }

  _vvp.selectPrevChannel = function ( ) {
    var cl = this.channelList;
    var nodes = cl.getElementsByTagName( "a" );
    if ( !nodes || !nodes.length ) return;
    var prev = null;
    for ( var i = 0; i < nodes.length; i++ ) {
      var n = nodes[ i ];
      if ( util.hasClass( n, "currentChannel" ) ) {
        if ( i === 0 ) { 
          prev = nodes[ nodes.length - 1 ];
        } else {
          prev = nodes[ i - 1 ];
        }
        break;
      }
    }
    this.selectChannelFromNode( prev );
  }

  _vvp.selectChannelFromIndex = function ( index ) {
    util.log( "selecting channel from index: " + index );
    var cl = this.channelList;
    var nodes = cl.getElementsByTagName( "a" );
    if ( !nodes || !nodes.length || nodes.length < ( index + 1 ) ) return;
    util.log( nodes );
    util.log( nodes.length );
    util.log( index in nodes );
    util.log( nodes[ index ] );
    this.selectChannelFromNode( nodes[ index ] );
  }

  _vvp.selectNextChannel = function ( ) {
    var cl = this.channelList;
    var nodes = cl.getElementsByTagName( "a" );
    if ( !nodes || !nodes.length ) return;
    var next = null;
    for ( var i = 0; i < nodes.length; i++ ) {
      var n = nodes[ i ];
      if ( util.hasClass( n, "currentChannel" ) ) {
        next = n.nextSibling;  
        if ( i < nodes.length - 1 ) {
          next = nodes[ ++i ];
        } else {
          next = nodes[ 0 ];
        }
        break;
      }
    }
    this.selectChannelFromNode( next );
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
          ' <span class="closeChannelBtn">x</span>',
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
      topics : diom.topics,
      networks : networks,
      getPerforms : util.hitch( this.model.networks, "getPerforms" ),
    }
    var x = window.nativeWindow.x + 150;
    var y = window.nativeWindow.y + 100;
    var win = window.open("performs.html", "performsWindow", "height=400, scrollbars=yes, width=600, top=" + y + ", left=" + x);
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

  _vvp.handleUpdateBtnClick = function ( e ) {
    util.publish( diom.topics.UPDATE_CHECK, [] );
  }
  
  _vvp.handleHelpBtnClick = function ( e ) {
    this.displayHelp( );
  }
  
  _vvp.openChannelsWindow = function ( networks ) {
    if ( !networks ) networks = [];
    window.channelsBridge = {
      util : util,
      topics : diom.topics,
      networks : networks,
      getChannels : util.hitch( this.model.networks, "getChannels" ),
    }
    var x = window.nativeWindow.x + 150;
    var y = window.nativeWindow.y + 100;
    var win = window.open("channels.html", "channelsWindow", "height=500, scrollbars=yes, width=500, top=" + y + ", left=" + x);
    win = win.nativeWindow;
  }

  _vvp.handleChannelsBtnClick = function ( e ) {
    this.model.networks.getNetworks( util.hitch( this, "openChannelsWindow" ) );
  }

  _vvp.openServersWindow = function ( networks ) {
    if ( !networks ) networks = [];
    window.serversBridge = {
      util : util,
      topics : diom.topics,
      networks : networks,
      getServers : util.hitch( this.model.networks, "getServers" ),
    }
    var x = window.nativeWindow.x + 150;
    var y = window.nativeWindow.y + 100;
    var win = window.open("servers.html", "serversWindow", "height=500, scrollbars=yes, width=500, top=" + y + ", left=" + x);
    win = win.nativeWindow;
  }

  _vvp.handleServersBtnClick = function ( e ) {
    this.model.networks.getNetworks( util.hitch( this, "openServersWindow" ) );
  }

  _vvp.handleIgnoresBtnClick = function ( e ) {
    this.model.ignores.getIgnores( util.hitch( this, "openIgnoresWindow" ) );
  }

  _vvp.openIgnoresWindow = function ( ignores ) {
    if ( !ignores ) ignores = [];
    window.ignoresBridge = {
      util : util,
      topics : diom.topics,
      ignores : ignores,
    }
    var x = window.nativeWindow.x + 150;
    var y = window.nativeWindow.y + 100;
    var win = window.open("ignores.html", "ignoresWindow", "height=400, scrollbars=yes, width=600, top=" + y + ", left=" + x);
    win = win.nativeWindow;
  }

  _vvp.handleNetworksBtnClick = function ( e ) {
    this.model.networks.getNetworks( util.hitch( this, "openNetworksWindow" ) );
  }

  _vvp.handleAliasesBtnClick = function ( e ) {
    this.model.aliases.getAliases( util.hitch( this, "openAliasesWindow" ) );
  }

  _vvp.openAliasesWindow = function ( aliases ) {
    if ( !aliases ) aliases = [];
    window.aliasesBridge = {
      util : util,
      topics : diom.topics,
      aliases : aliases,
    }
    var x = window.nativeWindow.x + 150;
    var y = window.nativeWindow.y + 100;
    var win = window.open("aliases.html", "aliasesWindow", "height=400, scrollbars=yes, width=600, top=" + y + ", left=" + x);
    win = win.nativeWindow;
  }

  _vvp.handleNetworksBtnClick = function ( e ) {
    this.model.networks.getNetworks( util.hitch( this, "openNetworksWindow" ) );
  }

  _vvp.openNetworksWindow = function ( networks ) {
    if ( !networks ) networks = [];
    window.networksBridge = {
      util : util,
      topics : diom.topics,
      preferences : this.model.prefs.getPrefs( ),
      networks : networks,
    }
    var x = window.nativeWindow.x + 150;
    var y = window.nativeWindow.y + 100;
    var win = window.open("networks.html", "networksWindow", "height=400, scrollbars=yes, width=500, top=" + y + ", left=" + x);
    win = win.nativeWindow;
  }


  _vvp.handlePrefBtnClick = function ( e ) {
    window.prefBridge = {
      util : util,
      topics : diom.topics,
      preferences : this.model.prefs.getPrefs( ),
    }
    var x = window.nativeWindow.x + 150;
    var y = window.nativeWindow.y + 75;
    var win = window.open("prefs.html", "prefsWindow", "height=550, scrollbars=yes, width=500, top=" + y + ", left=" + x);
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


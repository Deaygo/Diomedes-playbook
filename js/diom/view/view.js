/*
  Copyright (c) 2009 Apphacker apphacker@gmail.com
*/
/*jslint white: false */
/*jslint nomen: false */
/*jslint regexp: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, air, document */

dojo.provide( "diom.view.view" );

dojo.declare( "diom.view.View", null, {

  constructor: function ( model ) {
		var prefs;
    this.model = model;
    this.prevWord = null;
    this.input = new diom.view.FormInput( util.get( "textInput" ), util.get("inputForm") );
    this.popup = util.get( "popup" );
    this.popupContents = util.get( "popupContents" );
    this.linkView = new diom.view.LinkView( this.popupContents );
    this.activityWindow = util.get( "activityWindow" );
    this.channelList = util.get( "channelList" );
    this.titleBar = util.get( "titleBar" );
    this.nickList = util.get( "nickList" );
    this.font = null;
    prefs = this.model.prefs.getPrefs( );
    this.changeFont( prefs.multiOptionPrefs.font, prefs.fontSize );
    this.changeTheme( prefs.multiOptionPrefs.theme );
    this.activityWindows = {};
    this.activeWin = null;
    this.activeNickCount = 0;
    this.appVersion = "";

    dojo.connect( this.channelList, "onclick", this, "handleChannelListClick" );
    dojo.connect( window, "onclick", this, "handleActivityWindowClick" );
    dojo.connect( this.titleBar, "onclick", this, "handleTitleBarClick" );
    dojo.connect( util.get( "prefBtn" ), "onclick", this, "handlePrefsBtnClick" );
    dojo.connect( util.get( "linksBtn" ), "onclick", this, "handleLinksBtnClick" );
    dojo.connect( util.get( "closePopup" ), "onclick", this, "closePopup" );
    dojo.connect( window, "onclick", this, "handleWindowClick" );
    dojo.subscribe(  diom.topics.USER_HIGHLIGHT, this, "highlight" );
    dojo.subscribe(  diom.topics.PREFS_CHANGE_FONT, this, "changeFont" );
    dojo.subscribe(  diom.topics.PREFS_CHANGE_THEME, this, "changeTheme" );
    dojo.subscribe(  diom.topics.NOTIFY, this, "notify" );
    dojo.subscribe(  diom.topics.CHANNEL_TOPIC, this, "handleTopic" );
    dojo.subscribe(  diom.topics.NICK_CHANGE, this, "handleNickChange" );
    dojo.subscribe(  diom.topics.INPUT_PAGE_UP, this, "scrollUp" );
    dojo.subscribe(  diom.topics.INPUT_PAGE_DOWN, this, "scrollDown" );
    dojo.subscribe(  diom.topics.INPUT_CHANNEL_NEXT, this, "selectNextChannel" );
    dojo.subscribe(  diom.topics.INPUT_CHANNEL_PREV, this, "selectPrevChannel" );
    dojo.subscribe(  diom.topics.INPUT_CHANNEL_PART, this, "closeCurrentChannel" );
    dojo.subscribe(  diom.topics.INPUT_CHANNEL_INDEX, this, "selectChannelFromIndex" );
    dojo.subscribe(  diom.topics.UPDATE_NO_NEW_UPDATES, this, "showNoUpdatesDialog" );
  },

  showNoUpdatesDialog: function( ) {
    this.notify( "No new updates." );
  },

  scrollUp: function ( ) {
    if ( this.activeWin ) {
      this.activeWin.scrollUp( );
    }
  },

  scrollDown: function ( ) {
    if ( this.activeWin ) {
      this.activeWin.scrollDown( );
    }
  },

  closePopup: function ( e ) {
    dojo.addClass( this.popup, "hidden" );
    this.popupContents.innerHTML = "";
  },

  handleLinksBtnClick: function ( e ) {
    dojo.stopEvent( e );
    this.linkView.display( );
    dojo.removeClass( this.popup, "hidden" );
  },

  handlePrefsBtnClick: function ( e ) {
    dojo.stopEvent( e );
    dojo.removeClass( this.titleBar, "hidden" );
  },

  handleWindowClick: function ( e ) {
    dojo.addClass( this.titleBar, "hidden" );
  },

  setTopicView: function ( channelName, topic ) {
    var msg = channelName, nickCount = "";
    if ( this.activeNickCount ) {
      nickCount = " (" + this.activeNickCount + ") ";
    }
    if ( topic ) {
      msg += nickCount + ": " + topic;
    }
    document.title = msg;
  },

  handleNickChange: function ( nicks, serverName, channelName ) {
    var topic, tmp;
    if ( this.activeWin.serverName === serverName && this.activeWin.channelName === channelName ) {
      this.activeNickCount = nicks.length;
      tmp = document.title.split( ": " );
      tmp.shift( );
      topic = tmp.join( ": " );
      this.setTopicView( channelName, topic );
    }
  },

  handleTopic: function ( serverName, channelName, topic ) {
    if ( this.activeWin.serverName === serverName && this.activeWin.channelName === channelName ) {
      this.setTopicView( channelName, topic );
    }
  },

  changeTheme: function ( themePrefs ) {
		var i, theme;
    for ( i = 0; i < themePrefs.length; i++ ) {
      theme = themePrefs[ i ];
      if ( "selected" in theme ) {
        this.setTheme( theme.value );
        return;
      }
    }
  },

  setTheme: function ( themeName ) {
    var cssPath = "/css/themes/", n;
    n = util.get( "themeLink" );
    n.setAttribute( "href", [ cssPath, themeName, ".css" ].join( "" ) );
  },

  changeFont: function ( fontPrefs, size ) {
		var i, font;
    for ( i = 0; i < fontPrefs.length; i++ ) {
      font = fontPrefs[ i ];
      if ( "selected" in font ) {
        this.setFont( font.value, size );
        return;
      }
    }
  },

  setFont: function ( font, size ) {
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
  },

  notify: function ( msg ) {
    if ( msg ) {
        params = {
          center: true,
          title: "Notice",
          content: msg
        };
        callback = function ( dialog ) {
          dialog.open( );
        };
        closeCallback = function ( ) {
          dialog.destroy( );
        };
        dialog = new diom.view.dialog.Dialog( params, callback );
      }
  },

  setAppVersion: function ( info ) {
    this.appVersion = info;
  },

  sanitize: function ( msg ) {
    if ( msg ) {
      msg = msg.split( "&" ).join( "&amp;" );
      msg = msg.split( "<" ).join( "&lt;" );
      msg = msg.split( ">" ).join( "&gt;" );
      msg = msg.split( '"' ).join( "&quot;" );
    }
    return msg;
  },

  getConfirmation: function ( msg ) {
    return window.confirm( "You're about to " + msg + ". Are you sure? " );
  },

  setContents: function ( node, contents, synchronous ) {
    if ( synchronous ) {
      node.innerHTML = contents;
    } else {
      //performance gain
      window.setTimeout( function() { node.innerHTML = contents; }, 0 );
    }
  },

  clearActivityView: function ( ) {
    if ( this.activeWin ) {
      this.activeWin.clear( );
    }
  },

  clearNickView: function ( ) {
    this.activeWin.nickWindow.clear( );
  },

  displayHelp: function ( ) {
    window.open("help.html", "helpWindow", "height=600, scrollbars=yes, width=400, top=10, left=10");
  },

  changeView: function ( serverName, channelName, topic ) {
    this.createActivityViewIfNeeded( channelName, serverName );
    this.activeWin = this.getActivityWindow( channelName, serverName );
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
  },

  handleActivityWindowClick: function ( e ) {
		var url, urlReq;
    dojo.stopEvent( e );
    if ( e.target.nodeName === "A" ) {
      url = e.target.getAttribute("href");
      if ( url ) {
        urlReq = new air.URLRequest( dojo.trim( url ) );
        air.navigateToURL(urlReq);
      }
    }
    this.input.focus( );
    this.handleWindowClick( e );
  },

  closeTabFromNode: function ( n ) {
		var server, name;
    if ( n ) {
      server = n.getAttribute( "server" );
      name = n.getAttribute( "name" );
      if ( name === server ) {
        window.setTimeout( function() {
          dojo.publish( diom.topics.NETWORK_CLOSE, [ server ] );
        }, 0);
      } else {
        window.setTimeout( function() {
          dojo.publish( diom.topics.CHANNEL_CLOSE, [ server, name ] );
        }, 0);
      }
    }
  },

  selectChannelFromNode: function ( n ) {
		var server, type, name;
    if ( n ) {
      server = n.getAttribute( "server" );
      type = n.getAttribute( "type" );
      name = n.getAttribute( "name" );
      window.setTimeout( function() {
        dojo.publish( diom.topics.CHANNEL_SELECTED, [ server, type, name ] );
      }, 0);
    }
  },


  handleChannelListClick: function ( e ) {
		var n;
    dojo.stopEvent( e );
    n = e.target;
    if ( !n ) { return; }
    if ( dojo.hasClass( n, "closeChannelBtn" ) ) {
      n = util.findUp( n, "channelBtn" );
      this.closeTabFromNode( n );
      return;
    }
    n = util.findUp( n, "channelBtn" );
    this.selectChannelFromNode( n );
    this.handleWindowClick( e );
  },


  updateNickView: function ( users, serverName, channelName ) {
    this.createActivityViewIfNeeded( channelName, serverName );
    this.getActivityWindow( channelName, serverName ).nickWindow.update( users, channelName );
  },

  updateChannelView: function ( channels, channelsWithActivity, channelsWithHighlight ) {
		var r, channelsR, serverName, server, activeChannels, highlightedChannels,
			channelKey, activity, highlight, channelName;
    util.log("updateChannelView");
    if ( !channels ) { return; }
    r = [];
    channelsR = [];
    for ( serverName in channels ) {
			if ( channels.hasOwnProperty( serverName ) ) {
				r.push( this.getChannelButton( serverName, serverName, serverName, "SERVER" ) );
				server = channels[ serverName ];
				if ( serverName in channelsWithActivity ) {
					activeChannels = channelsWithActivity[ serverName ];
				} else {
					activeChannels = null;
				}
				if ( serverName in channelsWithHighlight ) {
					highlightedChannels = channelsWithHighlight[ serverName ];
				} else {
					highlightedChannels = null;
				}
				for ( channelKey in server ) {
					//channelKey is channelName in lowercase
					if ( server.hasOwnProperty( channelKey ) ) {
						channelsR.push( channelKey );
						activity = 0;
						if ( activeChannels && ( channelKey in activeChannels ) ) {
							activity = activeChannels[ channelKey ];
						}
						highlight = false;
						if ( highlightedChannels && ( channelKey in highlightedChannels ) ) {
							highlight = true;
						}
						channelName = server[ channelKey ].getName( ); //channel
						r.push( this.getChannelButton( serverName, channelKey, channelName, "CHANNEL",  activity, highlight) );
					}
				}
			}
		}
    this.setContents( this.channelList, r.join( "" ), false );
    this.input.setChannels( channelsR );
  },

  closeCurrentChannel: function ( ) {
		var cl, nodes, i, prev, n;
    cl = this.channelList;
    nodes = cl.getElementsByTagName( "a" );
    if ( !nodes || !nodes.length ) { return; }
    prev = null;
    for ( i = 0; i < nodes.length; i++ ) {
      n = nodes[ i ];
      if ( dojo.hasClass( n, "currentChannel" ) ) {
        this.closeTabFromNode( n );
      }
    }
  },

  selectPrevChannel: function ( ) {
		var cl, nodes, prev, i, n;
    cl = this.channelList;
    nodes = cl.getElementsByTagName( "a" );
    if ( !nodes || !nodes.length ) { return; }
    prev = null;
    for ( i = 0; i < nodes.length; i++ ) {
      n = nodes[ i ];
      if ( dojo.hasClass( n, "currentChannel" ) ) {
        if ( i === 0 ) {
          prev = nodes[ nodes.length - 1 ];
        } else {
          prev = nodes[ i - 1 ];
        }
        break;
      }
    }
    this.selectChannelFromNode( prev );
  },

  selectChannelFromIndex: function ( index ) {
		var cl, nodes;
    util.log( "selecting channel from index: " + index );
    cl = this.channelList;
    nodes = cl.getElementsByTagName( "a" );
    if ( !nodes || !nodes.length || nodes.length < ( index + 1 ) ) { return; }
    util.log( nodes );
    util.log( nodes.length );
    util.log( index in nodes );
    util.log( nodes[ index ] );
    this.selectChannelFromNode( nodes[ index ] );
  },

  selectNextChannel: function ( ) {
		var cl, nodes, next, i, n;
    cl = this.channelList;
    nodes = cl.getElementsByTagName( "a" );
    if ( !nodes || !nodes.length ) { return; }
    next = null;
    for ( i = 0; i < nodes.length; i++ ) {
      n = nodes[ i ];
      if ( dojo.hasClass( n, "currentChannel" ) ) {
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
  },

  getChannelButton: function ( server, channelKey, channelName, type, activity, highlight ) {
		var channelActivity, currentChannel;
    //channelKey is channelName in lowercase
    channelActivity = "";
    if ( activity ) {
      channelActivity = [
        ' <span class="channelActivity">&nbsp;',
        activity,
        ' </span> '
      ].join( "" );
    }
    if ( this.activeWin ) {
      currentChannel = ( channelKey === this.activeWin.channelName &&
				server === this.activeWin.serverName );
    } else {
      currentChannel = false;
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
  },

  finishChannelChange: function ( ) {
    this.input.focus( );
  },

  createActivityViewIfNeeded: function ( channelName, serverName ) {
    channelName = channelName.toLowerCase( );
    serverName = serverName.toLowerCase( );
    if ( !( serverName in this.activityWindows ) ) {
      this.activityWindows[ serverName ] = {};
    }
    if ( !( channelName in this.activityWindows[ serverName ] ) ) {
      this.activityWindows[ serverName ][ channelName ] = new diom.view.ActivityWindow( serverName,
          channelName,
          this.model.prefs.getPrefs( ).historyLength,
          this.model.prefs.getPrefs( ).multiOptionPrefs.time
      );
    }
  },

  getActivityWindow: function ( channelName, serverName ) {
    channelName = channelName.toLowerCase( );
    serverName = serverName.toLowerCase( );
    if ( serverName in this.activityWindows ) {
      if ( channelName in this.activityWindows[ serverName ] ) {
        return this.activityWindows[ serverName ][ channelName ];
      }
    }
    return null;
  },

  updateActivityView: function ( messages, userNick, channelName, serverName ) {
    this.createActivityViewIfNeeded( channelName, serverName );
    this.getActivityWindow( channelName, serverName ).update( messages, userNick, channelName );
  },

  highlight: function ( ) {
		var na, nt, nw, icon;
		if ( air ) {
			na = air.NativeApplication;
			nt = air.NotificationType;
			nw = air.NativeWindow;
			if ( na.supportsDockIcon ) {
				//bounce dock icon
				icon = na.nativeApplication.icon;
				icon.bounce( nt.CRITICAL );
			} else if ( nw.supportsNotification ) {
				//flash taskbar
				window.nativeWindow.notifyUser( nt.CRITICAL );
			}
		}
  },

  getInput: function ( ) {
    return this.input.getValue( );
  },

  destroy: function ( ) {
    util.log( "destroying view" );
    this.input.destroy();
  },

  openPerformsWindow: function ( networks ) {
		var x, y, win;
    if ( !networks ) { networks = []; }
    window.performsBridge = {
      util : util,
			dojo : dojo,
      topics : diom.topics,
      networks : networks,
      getPerforms : dojo.hitch( this.model.networks, "getPerforms" )
    };
    x = window.nativeWindow.x + 150;
    y = window.nativeWindow.y + 100;
    win = window.open("performs.html", "performsWindow", "height=400, scrollbars=yes, width=600, top=" + y + ", left=" + x);
    win = win.nativeWindow;
  },

  handlePerformBtnClick: function ( e ) {
    this.model.networks.getNetworks( dojo.hitch( this, "openPerformsWindow" ) );
  },

  handleAboutBtnClick: function ( e ) {

    var params, dialog, callback, s;

    s = [
      '<div class="aboutDialog">',
        '<h1>', this.appVersion, '</h1><br/>',
        '<p>Twitter: <a href="http://twitter.com/apphacker">@apphacker</a></p>',
        '<p>Email: <a href="mailto:apphacker@gmail.com">apphacker@gmail.com</a></p>',
        '<p>Website: <a href="http://apphackers.com">apphackers.com</a></p>',
        '<p>Blog: <a href="http://blog.apphackers.com">blog.apphackers.com</a></p>',
        '<p>IRC: #diomedes on irc.freenode.org</p><br/>',
        '<p>Thank you for using Diomedes!</p>',
      '</div>'
    ].join( "" );

    params = {
      center: true,
      title: "About Diomedes IRC",
      content: s
    };
    callback = function ( dialog ) {
      dialog.open( );
    };
    closeCallback = function ( ) {
      dialog.destroy( );
    };
    dialog = new diom.view.dialog.Dialog( params, callback );
  },

  handleUpdateBtnClick: function ( e ) {
    dojo.publish( diom.topics.UPDATE_CHECK, [] );
  },

  handleHelpBtnClick: function ( e ) {
    this.displayHelp( );
  },

  openChannelsWindow: function ( networks ) {
		var x, y, win;
    if ( !networks ) { networks = []; }
    window.channelsBridge = {
      util : util,
			dojo : dojo,
      topics : diom.topics,
      networks : networks,
      getChannels : dojo.hitch( this.model.networks, "getChannels" )
    };
    x = window.nativeWindow.x + 150;
    y = window.nativeWindow.y + 100;
    win = window.open("channels.html", "channelsWindow", "height=500, scrollbars=yes, width=500, top=" + y + ", left=" + x);
    win = win.nativeWindow;
  },

  handleChannelsBtnClick: function ( e ) {
    this.model.networks.getNetworks( dojo.hitch( this, "openChannelsWindow" ) );
  },

  openServersWindow: function ( networks ) {
		var x, y, win;
    if ( !networks ) { networks = []; }
    window.serversBridge = {
      util : util,
			dojo : dojo,
      topics : diom.topics,
      networks : networks,
      getServers : dojo.hitch( this.model.networks, "getServers" )
    };
    x = window.nativeWindow.x + 150;
    y = window.nativeWindow.y + 100;
    win = window.open("servers.html", "serversWindow", "height=500, scrollbars=yes, width=500, top=" + y + ", left=" + x);
    win = win.nativeWindow;
  },

  handleServersBtnClick: function ( e ) {
    this.model.networks.getNetworks( dojo.hitch( this, "openServersWindow" ) );
  },

  handleIgnoresBtnClick: function ( e ) {
    this.model.ignores.getIgnores( dojo.hitch( this, "openIgnoresWindow" ) );
  },

  openIgnoresWindow: function ( ignores ) {
		var x, y, win;
    if ( !ignores ) { ignores = []; }
    window.ignoresBridge = {
      util : util,
			dojo : dojo,
      topics : diom.topics,
      ignores : ignores
    };
    x = window.nativeWindow.x + 150;
    y = window.nativeWindow.y + 100;
    win = window.open("ignores.html", "ignoresWindow", "height=400, scrollbars=yes, width=600, top=" + y + ", left=" + x);
    win = win.nativeWindow;
  },

  handleAliasesBtnClick: function ( e ) {
    this.model.aliases.getAliases( dojo.hitch( this, "openAliasesWindow" ) );
  },

  openAliasesWindow: function ( aliases ) {
		var x, y, win;
    if ( !aliases ) { aliases = []; }
    window.aliasesBridge = {
      util : util,
			dojo : dojo,
      topics : diom.topics,
      aliases : aliases
    };
    x = window.nativeWindow.x + 150;
    y = window.nativeWindow.y + 100;
    win = window.open("aliases.html", "aliasesWindow", "height=400, scrollbars=yes, width=600, top=" + y + ", left=" + x);
    win = win.nativeWindow;
  },

  handleNetworksBtnClick: function ( e ) {
    this.model.networks.getNetworks( dojo.hitch( this, "openNetworksWindow" ) );
  },

  openNetworksWindow: function ( networks ) {
		var x, y, win;
    if ( !networks ) { networks = []; }
    window.networksBridge = {
      util : util,
			dojo : dojo,
      topics : diom.topics,
      preferences : this.model.prefs.getPrefs( ),
      networks : networks
    };
    x = window.nativeWindow.x + 150;
    y = window.nativeWindow.y + 100;
    win = window.open("networks.html", "networksWindow", "height=400, scrollbars=yes, width=500, top=" + y + ", left=" + x);
    win = win.nativeWindow;
  },


  handlePrefBtnClick: function ( e ) {
		var x, y ,win;
    window.prefBridge = {
      util : util,
			dojo : dojo,
      topics : diom.topics,
      preferences : this.model.prefs.getPrefs( )
    };
    x = window.nativeWindow.x + 150;
    y = window.nativeWindow.y + 75;
    win = window.open("prefs.html", "prefsWindow", "height=550, scrollbars=yes, width=500, top=" + y + ", left=" + x);
    win = win.nativeWindow;
    this.model.prefs.savePrefs( );
    win.addEventListener( air.Event.CLOSE, dojo.hitch( this.model.prefs, "savePrefs" )  );
  },

  handleTitleBarClick: function ( e ) {
		var id, funcName;
    dojo.stopEvent( e );
    id = e.target.id;
    if ( id ) {
      funcName = "handle" + id + "Click";
      if ( this[ funcName ] ) {
        this[ funcName ]( e );
      }
    }
    this.handleWindowClick( e );
  }

} );

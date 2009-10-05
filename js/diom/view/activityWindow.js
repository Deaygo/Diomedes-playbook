
dojo.provide( "diom.view.activityWindow" );

  dView.ActivityWindow = function ( serverName, channelName, maxItems, timeFormat ) {
    this.linkRegex = /(https?:\/\/([\w\-]+\.)*[\w\-]+\.[\w\-]+(\/\S*)?)\s?/g;
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
    util.subscribe( diom.topics.PREFS_CHANGE_HISTORY_LENGTH, this, "handleChangeHistoryLength", [] );
    util.subscribe( diom.topics.PREFS_CHANGE_TIME_FORMAT, this, "setTimeFormat", [] );
    util.subscribe( diom.topics.CHANNEL_TOPIC, this, "handleTopic", [] );
  }

  var _vap = dView.ActivityWindow.prototype;

  _vap.sanitize = dView.View.prototype.sanitize;

  _vap.setContents = _vvp.setContents;

  _vap.scrollUp = function ( ) {
      this.win.scrollTop -= this.win.clientHeight;
  }

  _vap.scrollDown = function ( ) {
      this.win.scrollTop += this.win.clientHeight;
  }

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

  _vap.update = function ( messages, userNick, channelName ) {
    //XXX: need to switch from using msg properties to using msg getters and setters
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
      var newMsg;
      var showBrackets = msg.showBrackets( );
      var isServer = msg.isServer( );
      var isAction = msg.isAction( );
      var isNotice = msg.isNotice( );
      var referencesUser = msg.referencesUser( );
      var m = msg.getMsg( );
      if ( msg.isAction( ) ) showBrackets = false;
      nick = msg.getNickWithStatus( channelName );
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
              this.textFormat( this.sanitize( m ), this.sanitize( nick ) ),
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

  _vap.textFormat = function ( msg, nick ) {
    msg = msg.split("  ").join(" &nbsp;");
    msg = this.findBold( msg );
    msg = [ msg, this.closeOpenMarkup("isInBold", "</strong>" ) ].join( "" );
    msg = this.findColors( msg );
    msg = [ msg, this.closeOpenMarkup("isInStyle", "</span>" ) ].join( "" );
    msg = this.findLinks( msg, nick );
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

  _vap.logLinks = function ( msg, nick ) {
    var d = document.createElement( "div" );
    d.innerHTML = msg;
    var anchors = d.getElementsByTagName( "a" );
    if ( anchors && anchors.length ) {
      for ( var i = 0; i < anchors.length; i++ )  {
        var a = anchors[ i ];
        util.publish( diom.topics.LINK_FOUND, [ a.getAttribute( "href" ), this.serverName, this.channelName, nick ] );
        delete a;
      }
    }
    delete anchors;
    delete d;
  }

  _vap.findLinks = function ( msg, nick ) {
    var newMsg = msg.replace( this.linkRegex, ' <a target="_blank" class="ircLink" href="$1">$1</a> ' );
    if ( newMsg.split( "ircLink" ).length > 1 ) {
      this.logLinks( newMsg, nick );
    }
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
      styleString = [ styleName , this.COLOR_CODES[ color ], ";" ].join( "" );
      if ( possibleCode[ 0 ] == "0" || color > 9 ) {
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
      if ( this[ type_ ] ) {
        this[ type_ ] = false;
        return markup;
      } else {
        return "";
      }
  }


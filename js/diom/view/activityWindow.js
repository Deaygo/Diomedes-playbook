/*jslint white: false */
/*jslint nomen: false */
/*jslint regexp: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, air, document */

dojo.provide( "diom.view.activityWindow" );

dojo.declare( "diom.view.ActivityWindow", null, {

  /**
  * @param {String} serverName
  * @param {String} channelName
  * @param {Number} maxItems
  * @param {String} timeFormat
  * @param {String} connectionId
  * @constructor
  */
  constructor: function ( serverName, channelName, maxItems, timeFormat, connectionId ) {
    this.linkRegex = /(https?:\/\/([\w\-]+\.)*[\w\-]+\.[\w\-]+(\/\S*)?(:\d+)?)\s?/g;
    this.colorCode = String.fromCharCode( 3 );
    this.normalCode = String.fromCharCode( 17 );
    this.boldCode = String.fromCharCode( 2 );
    this.underlineCode = String.fromCharCode( 37 );
    this.italicsCode = String.fromCharCode( 26 );
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
      "#A8A8A8" //lightgrey
    ];
    this.nickWindow = new diom.view.NickWindow( serverName, channelName, connectionId );
    this.topic = null;
    this.win = document.createElement( "div" );
    this.win.setAttribute( "class", "activityWin" );
    this.serverName = serverName;
    this.channelName = channelName;
    this.connectionId = connectionId;
    this.isInStyle = false;
    this.isInBold = false;
    this.maxItems = maxItems;
    dojo.subscribe(  diom.topics.PREFS_CHANGE_HISTORY_LENGTH, this, "handleChangeHistoryLength" );
    dojo.subscribe(  diom.topics.PREFS_CHANGE_TIME_FORMAT, this, "setTimeFormat" );
    dojo.subscribe(  diom.topics.CHANNEL_TOPIC, this, "handleTopic" );
  },

  /**
  * @public
  * @return {String}
  */
  getConnectionId: function () {
    return this.connectionId;
  },

  /**
  * @param {String} msg
  * @return {String}
  */
  sanitize: function ( msg ) {
    if ( msg ) {
      msg = msg.split( "&" ).join( "&amp;" );
      msg = msg.split( "<" ).join( "&lt;" );
      msg = msg.split( ">" ).join( "&gt;" );
      msg = msg.split( '"' ).join( "&quot;" );
    }
    return msg;
  },

  setContents: function ( node, contents, synchronous ) {
    if ( synchronous ) {
      node.innerHTML = contents;
    } else {
      //per
      window.setTimeout( function() { node.innerHTML = contents; }, 0 );
    }
  },

  scrollUp: function ( ) {
      this.win.scrollTop -= this.win.clientHeight;
  },

  scrollDown: function ( ) {
      this.win.scrollTop += this.win.clientHeight;
  },

  getTopic: function ( ) {
    return this.topic;
  },

  /**
  * @param {String} serverName
  * @param {String} channel
  * @param {String} topic
  * @param {String} connectionId
  * @private
  */
  handleTopic: function ( serverName, channelName, topic, connectionId ) {
    if ( connectionId === this.connectionId && channelName === this.channelName ) {
      this.topic = topic;
    }
  },

  setTimeFormat: function ( timePrefs ) {
    var i, time;
    for ( i = 0; i < timePrefs.length; i++ ) {
      time = timePrefs[ i ];
      if ( "selected" in time ) {
        this.timeFormat = parseInt( time.value, 10 );
        return;
      }
    }
  },

  handleChangeHistoryLength: function ( newLen ) {
    this.maxItems = newLen;
    window.setTimeout( dojo.hitch( this, "shrinkActivity", [ newLen ] ), 0 );
  },

  shrinkActivity: function ( len ) {
    var w, i;
    w = this.win;
    for ( i = this.win.childNodes.length; i > len; i-- ) {
      w.removeChild( w.firstChild );
    }
  },

  clear: function ( ) {
    this.win.innerHTML = "";
  },

  update: function ( messages, userNick, channelName ) {
    var w, diff, variance, isAtBottom, r, newMsg, showBrackets,
      isServer, isAction, isNotice, referencesUser, m, isSelf,
      dates, childNodes, n, msg, nick;
    //XXX: need to switch from using msg properties to using msg getters and setters
    w = this.win;
    diff = Math.abs( w.scrollTop - ( w.scrollHeight - w.offsetHeight ) );
    variance = 5;
    isAtBottom = false;
    if ( diff < variance ) {
      isAtBottom = true;
    }
    if ( !messages || !messages.length) { return; }
    r = [];
    while ( messages.length ) {
      msg = messages.shift( );
      showBrackets = msg.showBrackets( );
      isServer = msg.isServer( );
      isAction = msg.isAction( );
      isNotice = msg.isNotice( );
      referencesUser = msg.referencesUser( );
      m = msg.getMsg( );
      if ( msg.isAction( ) ) { showBrackets = false; }
      nick = msg.getNickWithStatus( channelName );
      isSelf = ( msg.nick === userNick );
      dates = this.formatDate( msg.datetime );
      newMsg = [].concat( [
          '<div class="message">',
            '<span class="messageData">',
            '<span class="messageTime" title="',
              dates.longDate,
            '">',
              dates.shortDate,
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
              ( showBrackets ? '&gt;' : ''  )
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
      childNodes = w.childNodes;
      if ( childNodes.length > this.maxItems ) {
        w.removeChild( w.firstChild );
      }
      n = document.createElement("div");
      n.innerHTML = newMsg.join( "" );
      w.appendChild( n );
    }
    if ( isAtBottom ) {
      w.scrollTop = w.scrollHeight;
    }
  },

  changeView: function ( ) {
    //scroll to bottom
    this.win.scrollTop = this.win.scrollHeight;
  },

  getNode: function ( ) {
    return this.win;
  },

  formatDateItem: function ( dateItem ) {
    dateItem = dateItem.toString( );
    if ( dateItem.length === 1 ) {
      dateItem = [ "0",  dateItem ].join( "" );
    }
    return dateItem;
  },

  formatDate: function ( date_ ) {
    var year, month, day, hour, clock, minute, second;
    year = this.formatDateItem( date_.getFullYear( ) );
    month = this.formatDateItem( date_.getMonth( ) + 1 );
    day = this.formatDateItem( date_.getDate( ) );
    hour =  date_.getHours( );
    if ( this.timeFormat < 24 ) {
      if ( hour > 12 ) {
        hour = hour - 12;
        clock = "pm";
      } else {
        clock = "am";
      }
    } else {
      clock = "";
    }
    hour = this.formatDateItem( hour );
    minute = this.formatDateItem( date_.getMinutes( ) );
    second = this.formatDateItem( date_.getSeconds( ) );
    return {
      "longDate" : [
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
      "shortDate" : [
        "[",
          hour,
          ":",
          minute,
          clock,
        "]"
      ].join( "" )
    };
  },

  textFormat: function ( msg, nick ) {
    msg = msg.split("  ").join(" &nbsp;");
    msg = this.findBold( msg );
    msg = [ msg, this.closeOpenMarkup("isInBold", "</strong>" ) ].join( "" );
    msg = this.findColors( msg );
    msg = [ msg, this.closeOpenMarkup("isInStyle", "</span>" ) ].join( "" );
    msg = this.findLinks( msg, nick );
    return msg;
  },

  findBold: function ( msg ) {
    var pos, beg, middle, end, newMsg;
    pos = msg.search( this.boldCode );
    if ( pos !== -1 ) {
      beg = msg.slice( 0, pos );
      if ( this.isInBold ) {
        middle = "</strong>";
        this.isInBold = false;
      } else {
        middle = "<strong>";
        this.isInBold = true;
      }
      end = msg.slice( pos + 1 );
      newMsg = [beg, middle, end].join( "" );
      newMsg = this.findBold( newMsg );
    } else {
      newMsg = msg;
    }
    return newMsg;
  },

  findColors: function ( msg ) {
    var pos, styles, styleLength, possibleCode, setResult,
      commaPos, beg, middleParts, middle, end, newMsg;
    pos = msg.search( this.colorCode );
    styles = [];
    styleLength = 0;
    if ( pos !== -1 ) {
      styleLength += 1; //control character
      possibleCode = msg.substr( pos + 1, 7 );
      setResult = this.setColorStyle( possibleCode, false );
      if ( setResult ) {
        styleLength += setResult.length;
        styles.push( setResult.style );
        commaPos = possibleCode.search( "," );
        if ( commaPos !== -1 ) {
          possibleCode = possibleCode.substr( commaPos + 1);
          setResult = this.setColorStyle( possibleCode, true );
          if ( setResult ) {
            styleLength += setResult.length;
            styles.push( setResult.style );
          }
        }
      }
      beg = msg.slice( 0, pos );
      middleParts = [];
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
        middle = middleParts.join( "" );
      } else {
        middle = "";
      }
      end = msg.slice( pos + styleLength );
      newMsg = [beg, middle, end].join( "" );
      newMsg = this.findColors( newMsg );
    } else {
      newMsg = msg;
    }
    return newMsg;
  },

  logLinks: function ( msg, nick ) {
    var d, anchors, i, a;
    d = document.createElement( "div" );
    d.innerHTML = msg;
    anchors = d.getElementsByTagName( "a" );
    if ( anchors && anchors.length ) {
      for ( i = 0; i < anchors.length; i++ )  {
        a = anchors[ i ];
        dojo.publish( diom.topics.LINK_FOUND, [ a.getAttribute( "href" ), this.serverName, this.channelName, nick, this.connectionId ] );
        a = null;
      }
    }
    anchors = null;
    d = null;
  },

  findLinks: function ( msg, nick ) {
    var newMsg = msg.replace( this.linkRegex, ' <a target="_blank" class="ircLink" href="$1">$1</a> ' );
    if ( newMsg.split( "ircLink" ).length > 1 ) {
      this.logLinks( newMsg, nick );
    }
    return newMsg;
  },

  setColorStyle: function ( possibleCode, isBackground ) {
    var color, styleString, styleLength, styleName;
    color = parseInt( possibleCode, 10 );
    styleLength = 0;
    if ( isBackground ) {
      styleName = "background-color:";
      styleLength += 1; //for comma
    } else {
      styleName = "color:";
    }
    if ( !isNaN( color ) && color in this.COLOR_CODES ) {
      styleString = [ styleName , this.COLOR_CODES[ color ], ";" ].join( "" );
      if ( possibleCode[ 0 ] === "0" || color > 9 ) {
        styleLength += 2;
      } else {
        styleLength += 1;
      }
      return { length: styleLength, style: styleString };
    } else {
      return null;
    }
  },

  closeOpenMarkup: function ( type_, markup) {
      if ( this[ type_ ] ) {
        this[ type_ ] = false;
        return markup;
      } else {
        return "";
      }
  }

} );

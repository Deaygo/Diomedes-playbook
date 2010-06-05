/*jslint white: false */
/*jslint nomen: false */
/*jslint regexp: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, air, document */

dojo.provide( "diom.view.nickWindow" );

dojo.declare( "diom.view.NickWindow", null, {

  /**
  * @param {String} serverName
  * @param {String} channelName
  * @param {String} connectionId
  * @constructor
  */
  constructor: function ( serverName, channelName, connectionId ) {
    this.serverName = serverName;
    this.channelName = channelName;
    this.connectionId = connectionId;
    this.win = document.createElement( "div" );
    this.win.setAttribute( "class", "nickWin" );
    this.win.setAttribute( "server", this.serverName );
    this.win.setAttribute( "channel", this.channelName );
    this.win.setAttribute( "connectionId", this.connectionId );
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

  setContents: function ( node, contents, synchronous ) {
    if ( synchronous ) {
      node.innerHTML = contents;
    } else {
      //per
      window.setTimeout( function() { node.innerHTML = contents; }, 0 );
    }
  },

  clear: function ( ) {
    this.win.innerHTML = "";
  },

  getNode: function ( ) {
    return this.win;
  },

  getNicks: function ( ) {
    return this.nicks;
  },

  /**
  * @param {Object} users
  * @param {String} channelName
  */
  update: function ( users, channelName ) {

    var mode, r, usersR, creatorsR, opsR, halfOpsR, voicedR,
      nicks, tmpNicks, i, nick, user;

    r = [];
    usersR = [];
    creatorsR = [];
    opsR = [];
    halfOpsR = [];
    voicedR = [];
    nicks = this.sort( users );
    tmpNicks = [];
    if ( !users ) { return; }
    for ( i = 0; i < nicks.length; i++ ) {
      nick = nicks[ i ];
      if ( nick ) {
        tmpNicks.push( nick );
      } else {
        continue;
      }
      user = users[ nick ];
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
    dojo.publish( diom.topics.NICK_CHANGE, [ nicks, this.serverName, this.channelName, this.connectionId ] );
  },

  /**
  * @param {Object} users
  * @private
  * @return {Array}
  */
  sort: function ( users ) {

    var r, nick;

    r = [];
    for ( nick in users ) {
      if ( users.hasOwnProperty( nick ) ) {
        r.push( nick );
      }
    }
    r.sort( this.nickCompare );
    return r;
  },

  getNickButton: function ( user, mode ) {
    return [
        ' <span class="nickButton',
        ( mode === "@" ? " op" : "" ),
        ( mode === "%" ? " halfOp" : "" ),
        ( mode === "+" ? " voiced" : "" ),
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
  },

  nickCompare: function ( nick1, nick2 ) {
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

} );


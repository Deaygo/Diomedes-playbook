/*jslint white: false */
/*jslint nomen: false */
/*jslint regexp: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, air, document */

dojo.provide( "diom.view.linkView" );

dojo.declare( "diom.view.LinkView", null, {

  /**
  * @constructor
  */
  constructor: function ( node ) {
    this.node = node;
    this.links = [];
    this.linkInfo = {};
    dojo.subscribe(  diom.topics.LINK_DATA, this, "addLinkInfo" );
    dojo.subscribe(  diom.topics.LINK_FOUND, this, "addLink" );
  },

  /**
  * @param {String} url
  * @param {String} serverName
  * @param {String} channelName
  * @param {String} nick
  * @private
  */
  addLink: function ( link, serverName, channelName, nick ) {
    //dojo.publish(diom.topics.NOTIFY, [ "moo" ] );
    this.links.push([
      '<tr>',
        '<td class="link">',
          '<a href="',
          link,
          '">',
          link,
          '</a>',
        '</td> ',
        '<td>',
        nick,
        '</td>',
        '<td>',
        channelName,
        '</td>',
        '<td>',
        serverName,
        '</td>',
      '</tr>'
    ].join( "" ));
  },

  /**
  * @param {String} link
  * @param {Object} properties
  * @private
  */
  addLinkInfo: function ( link, properties ) {
    this.linkInfo[ this.createLinkInfoHTML( properties ) ];
  },

  /**
  * The 'p' argument takes the following form:
  * {
  *   "url": this.url,
  *   "serverName": this.serverName,
  *   "channelName": this.channelName,
  *   "date": d,
  *   "nick": this.nick,
  *   "host": this.host,
  *   "path": this.path,
  *   "headers": this.headers,
  *   "httpStatus": this.httpStatus,
  *   "title": this.title
  * }
  * @param {Object} p
  * @private
  */
  createLinkInfoHTML: function ( p ) {

    var r, i, h;

    r = [];
    r.push( '<div class="linkLogItem">' );
      r.push( '<h2>Link</h2>' );
      r.push( [ '<div> <strong>IRC Info:</strong>', p.serverName, "-", p.channelName, "-", p.nick, "</div>" ].join( " " ) );
      r.push( [ '<div> <strong>Date:</strong>', p.date, '</div>' ].join( " " ) );
      r.push( [ '<div><strong>Given URL:</strong><a href="', p.url, '">', p.url, "</a></div>" ].join( " " ) );
      if ( p.url !== p.responseURL ) {
        r.push( [ '<div><strong>Response URL:</strong><a href="', p.responseURL, '">', p.responseURL, "</a></div>" ].join( " " ) );
      }
      if ( p.title ) {
        r.push( [ '<div><strong>Title:</strong>', p.title, "</div>" ].join( " " ) );
      }
      r.push( '<div class="extraLinkInfoCon"><div class="extraLinkInfoConTitle">Show Additional Info</div><div class="extraLinkInfo">' );
        r.push( [ '<div><strong>HTTP Status:</strong>', p.httpStatus, '</div>' ].join( " " ) );
        r.push( '<div class="headers"><h3>Header Information for URL:</h3>' );
        for ( i = 0; i < p.headers.length; i++ ) {
          h = p.headers[ i ];
          r.push( [ '<div><strong>Name:</strong>', h.name, '<strong>Value:</strong>', ( h.value ? h.value : '' ), '</div>' ].join( " " ) );
        }
        r.push( '</div>' );
      r.push( "</div></div>" );
    r.push( "</div>" );
    return r.join( "" );
  },

  /**
  * @public
  */
  display: function ( ) {
    var links;
    if ( this.links.length ) {
      links = this.links.slice( );
      this.node.innerHTML = [ 
        '<div id="linkLog"><h1>Link Log</h1><table>', 
          '<tr>',
            '<th class="link">link</th>',
            '<th>nick</th>',
            '<th>channel</th>',
            '<th>server</th>',
          '</tr>',
        '<thead>',
        '</thead><tbody>',
        links.reverse( ).join( " " ), 
        "</tbody></table></div>" 
      ].join( " " );
      links = null;
    } else {
      this.node.innerHTML = "No links found yet in IRC conversations. :/";
    }
  }

} );

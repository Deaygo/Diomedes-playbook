/*jslint white: false */
/*jslint nomen: false */
/*jslint regexp: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, air, document, alert */

dojo.provide( "diom.view.linkView" );

dojo.declare( "diom.view.LinkView", null, {

  constructor: function ( node ) {
    this.node = node;
    this.links = [];
    dojo.subscribe(  diom.topics.LINK_DATA, this, "addLink" );
  },

  addLink: function ( link, properties ) {
    this.links.push( this.createHTML( properties ) );
  },

  createHTML: function ( p ) {
		var r, i, h;
    r = [];
    /*
        {
          "url": this.url,
          "serverName": this.serverName,
          "channelName": this.channelName,
          "date": d,
          "nick": this.nick,
          "host": this.host,
          "path": this.path,
          "headers": this.headers,
          "httpStatus": this.httpStatus,
          "title": this.title
        }
    */
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

  display: function ( ) {
		var links;
    if ( this.links.length ) {
      links = this.links.slice( );
      this.node.innerHTML = [ '<div id="linkLog"><h1>Link Log</h1>', links.reverse( ).join( " " ), "</div>" ].join( " " );
			links = null;
    } else {
      this.node.innerHTML = "No links found yet in IRC conversations. :/";
    }
  }

} );


dojo.provide( "diom.view.linkView" );

  dView.LinkView = function ( node ) {
    this.node = node;
    this.links = [];
    util.subscribe( diom.topics.LINK_DATA, this, "addLink", [] );
  }

  var _vlw = dView.LinkView.prototype;

  _vlw.addLink = function ( link, properties ) {
    util.log( "addLink" );
    this.links.push( this.createHTML( properties ) );
  }

  _vlw.createHTML = function ( p ) {
    util.log( "createHTML" );
    var r = [];
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
      r.push( [ '<div> <strong>Date:</strong>', p["date"], '</div>' ].join( " " ) );
      r.push( [ '<div><strong>Given URL:</strong><a href="', p.url, '">', p.url, "</a></div>" ].join( " " ) );
      if ( p.url != p.responseURL ) {
        r.push( [ '<div><strong>Response URL:</strong><a href="', p.responseURL, '">', p.responseURL, "</a></div>" ].join( " " ) );
      }
      if ( p.title ) {
        r.push( [ '<div><strong>Title:</strong>', p.title, "</div>" ].join( " " ) );
      }
      r.push( '<div class="extraLinkInfoCon"><div class="extraLinkInfoConTitle">Show Additional Info</div><div class="extraLinkInfo">' );
        r.push( [ '<div><strong>HTTP Status:</strong>', p.httpStatus, '</div>' ].join( " " ) );
        r.push( '<div class="headers"><h3>Header Information for URL:</h3>' );
        for ( var i = 0; i < p.headers.length; i++ ) {
          var h = p.headers[ i ];
          r.push( [ '<div><strong>Name:</strong>', h.name, '<strong>Value:</strong>', ( h.value ? h.value : '' ), '</div>' ].join( " " ) );
        }
        r.push( '</div>' );
      r.push( "</div></div>" );
    r.push( "</div>" );
    return r.join( "" );
  }

  _vlw.display = function ( ) {
    if ( this.links.length ) {
      var links = this.links.slice( );
      this.node.innerHTML = [ '<div id="linkLog"><h1>Link Log</h1>', links.reverse( ).join( " " ), "</div>" ].join( " " );
      delete links;
    } else {
      this.node.innerHTML = "No links found yet in IRC conversations. :/";
    }
  }


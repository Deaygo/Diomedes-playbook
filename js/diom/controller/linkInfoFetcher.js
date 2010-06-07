/*jslint white: false */
/*jslint nomen: false */
/*jslint regexp: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, air, runtime */

dojo.provide( "diom.controller.linkInfoFetcher" );

dojo.declare( "diom.controller.LinkInfoFetcher", null, {

  constructor: function ( link, serverName, channelName, nick ) {
    var linkParts;
    if ( !link ) { return; }
    //don't publish secure sites to link log to avoid annoying
    //bad security certificate popups
    if ( "https" === link.substr( 0, 5 ) ) { return; }
    this.url = link;
    link = link.substr( 7 );
    this.serverName = serverName;
    this.channelName = channelName;
    this.nick = nick;
    linkParts = link.split( "/" );
    this.host = linkParts.shift( );
    this.path = "/";
    if ( linkParts.length ) {
      this.path +=  linkParts.join( "/" );
    }
    this.titleRegex = /<\s*title\s?.*>(.*)<\/\s*title\s*>/g;
    this.bytesRead = 0;
    this.headers = null;
    this.httpStatus = null;
    this.htmlInfo = {};
    this.request = new air.URLRequest( this.url );
    //do not attempt to authenticate
    //this creates an annoying popup box
    this.request.authenticate = false;
    this.data = "";
    this.title = "";
    this.responseURL = "";
    this.stream = new air.URLStream( );
    this.stream.addEventListener( air.HTTPStatusEvent.HTTP_RESPONSE_STATUS, dojo.hitch( this, "onStatus" ) );
    this.stream.addEventListener( air.ProgressEvent.PROGRESS, dojo.hitch( this, "onProgress" ) );
    this.stream.addEventListener( air.Event.COMPLETE, dojo.hitch( this, "onComplete" ) );
    this.stream.addEventListener( air.IOErrorEvent.IO_ERROR, dojo.hitch( this, "onError" ) );
    this.stream.load( this.request );

  },

  onComplete: function ( e ) {
    this.stream.close( );
  },

  onProgress: function ( e ) {
    this.data = [ this.data, this.stream.readUTFBytes( this.stream.bytesAvailable ) ].join( "" );
    this.checkForTitle( );
  },

  checkForTitle: function ( ) {
    var res = this.titleRegex.exec( this.data );
    if ( res && res.length > 1 ) {
      this.stream.close( );
      this.title = res[ 1 ];
      this.publishData( );
    }
  },

  onStatus: function ( e ) {
    var isHTML, i, header;
    this.headers = e.responseHeaders;
    this.httpStatus = e.status;
    this.responseURL = e.responseURL;
    isHTML = false;
    if ( this.httpStatus === 200 ) {
      for ( i = 0; i < this.headers.length; i++ ) {
        header = this.headers[ i ];
        if ( header.name === "Content-Type" && header.value.search( "html" ) !== -1 ) {
          isHTML = true;
          break;
        }
      }
    }
    if ( !isHTML ) {
      this.stream.close( );
      this.publishData( );
    }
  },


  completeHandler: function ( e ) {
    //util.log("complete");
  },


  publishData: function( ) {
    var d;
    d = new Date( ).toString( );
    dojo.publish( diom.topics.LINK_DATA, [
        this.url,
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
          "htmlInfo": this.htmlInfo,
          "responseURL": this.responseURL,
          "title": dojo.trim( this.title )
        }
    ] );
  },

  onError: function ( e ) {
    //util.log( " link info fetcher error" );
  },

  destroy: function ( ) {
    delete this.stream;
    delete this.request;
  }

} );

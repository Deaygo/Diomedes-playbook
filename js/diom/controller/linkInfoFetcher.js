
dojo.provide( "diom.controller.linkInfoFetcher" );

  dController.LinkInfoFetcher = function ( link, serverName, channelName, nick ) {
    if ( !link ) return;
    //don't publish secure sites to link log to avoid annoying 
    //bad security certificate popups
    //XXX: in the future maybe just add url without doing deep url inspection
    if ( "https" == link.substr( 0, 5 ) ) return;
    this.url = link;
    link = link.substr( 7 );
    this.serverName = serverName;
    this.channelName = channelName;
    this.nick = nick;
    var linkParts = link.split( "/" );
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
    this.stream.addEventListener( air.HTTPStatusEvent.HTTP_RESPONSE_STATUS, util.hitch( this, "onStatus" ) ); 
    this.stream.addEventListener( air.ProgressEvent.PROGRESS, util.hitch( this, "onProgress" ) ); 
    this.stream.addEventListener( air.Event.COMPLETE, util.hitch( this, "onComplete" ) ); 
    this.stream.addEventListener( air.IOErrorEvent.IO_ERROR, util.hitch( this, "onError" ) ); 
    this.stream.load( this.request );

  }

  var _clfp = dController.LinkInfoFetcher.prototype;

  _clfp.onComplete = function ( e ) {
    this.stream.close( );
  }

  _clfp.onProgress = function ( e ) {
    this.data = [ this.data, this.stream.readUTFBytes( this.stream.bytesAvailable ) ].join( "" );
    this.checkForTitle( );
  }

  _clfp.checkForTitle = function ( ) {
    var res = this.titleRegex.exec( this.data );
    if ( res && res.length > 1 ) {
      this.stream.close( );
      this.title = res[ 1 ];
      this.publishData( );
    }
  }

  _clfp.onStatus = function ( e ) {
    util.log( "onstatus" );
    this.headers = e.responseHeaders;
    this.httpStatus = e.status;
    this.responseURL = e.responseURL;
    var isHTML = false;
    if ( this.httpStatus == 200 ) {
      for ( var i = 0; i < this.headers.length; i++ ) {
        var header = this.headers[ i ];
        if ( header.name == "Content-Type" && header.value.search( "html" ) != -1 ) {
          isHTML = true;
          break;
        }
      }
    }
    if ( !isHTML ) {
      this.stream.close( );
      this.publishData( );
    }
  }


  _clfp.completeHandler = function ( e ) {
    util.log("complete");
  }


  _clfp.publishData = function( ) {
    util.log("publish");
    var d = new Date( ).toString( );
    util.publish( diom.topics.LINK_DATA, [
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
          "title": util.trim( this.title )
        }
    ] );
  }

  _clfp.onError = function ( e ) {
    util.log( " link info fetcher error" );
  }

  _clfp.destroy = function ( ) {
    util.log("destroy");
    delete this.stream;
    delete this.request;
  }


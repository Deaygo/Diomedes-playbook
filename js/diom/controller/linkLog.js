
dojo.provide( "diom.controller.linkLog" );

  dController.LinkLog = function ( ) {
    util.subscribe( diom.topics.LINK_FOUND, this, "handleLink", [] );
    this.fetchers = {};
    util.subscribe( diom.topics.LINK_DATA, this, "handleLinkData", [] );
  }

  var _cllp = dController.LinkLog.prototype;

  _cllp.handleLink = function ( link, serverName, channelName, nick ) {
    if ( !( link in this.fetchers ) ) {
      this.fetchers[ link ] = new dController.LinkInfoFetcher( link, serverName, channelName,nick );
    }
  }

  _cllp.handleLinkData = function ( link ) {
    //explicitly deleting fetchers to reduce memory leaks
    if ( link in this.fetchers ) {
      this.fetchers[ link ].destroy( );
      delete this.fetchers[ link ];
    }
  }


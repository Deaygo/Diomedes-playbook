/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, air, runtime */

dojo.provide( "diom.controller.linkLog" );

dojo.declare( "diom.controller.LinkLog", null, {

  constructor: function ( ) {
    dojo.subscribe(  diom.topics.LINK_FOUND, this, "handleLink" );
    this.fetchers = {};
    dojo.subscribe(  diom.topics.LINK_DATA, this, "handleLinkData" );
  },

  handleLink: function ( link, serverName, channelName, nick ) {
    if ( !( link in this.fetchers ) ) {
      this.fetchers[ link ] = new diom.controller.LinkInfoFetcher( link, serverName, channelName,nick );
    }
  },

  handleLinkData: function ( link ) {
    //explicitly deleting fetchers to reduce memory leaks
    if ( link in this.fetchers ) {
      this.fetchers[ link ].destroy( );
      delete this.fetchers[ link ];
    }
  }

} );


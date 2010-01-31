/*
  Copyright (c) 2010 Apphacker apphacker@gmail.com
*/
/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, setTimeout */

dojo.provide( "diom.view.help" );

dojo.declare( "diom.view.Help", diom.view.dialog.Dialog, {
  "-chains-": {
   constructor: "manual"
  },
  constructor: function ( ) {
    console.log( "help" );

    var params;

    params = {
      center: true,
      auto: true,
      height: Math.round( ( dojo.getComputedStyles( ).height/3 ) * 2 ),
      width: Math.round( ( dojo.getComputedStyles( ).width/3 ) * 2 ),
      title: "Help",
      content: this.getContent( )
    };
    this.inherited( params );
  },
  getContent: function ( ) {
    return [
      "help!"
    ].join( "" );
  }
} );

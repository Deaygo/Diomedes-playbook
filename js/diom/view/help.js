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

    var params, height, width;

    height = Math.round( ( window.nativeWindow.height/3 ) * 2 );
    width = Math.round( ( window.nativeWindow.width/3 ) * 2 );
    params = {
      center: false,
      auto: true,
      height: height,
      width: width,
      "top": Math.round( ( window.nativeWindow.height/2 ) - ( height/2 ) ),
      left: Math.round( ( window.nativeWindow.width/2 ) - ( width/2 ) ),
      title: "Help",
      content: this.getContent( )
    };
    this.inherited( arguments, [ params ] );
  },
  getContent: function ( ) {
    return [
      "help!"
    ].join( "" );
  }
} );

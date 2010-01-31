/*
  Copyright (c) 2010 Apphacker apphacker@gmail.com
*/
/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, setTimeout */

dojo.provide( "diom.view.dialog" );

dojo.declare( "diom.view.dialog.Dialog", null, {
  DEFAULT_PARAMS: {
    "class": "hidden dialog",
    style: {
      height: 200,
      width: 400,
      top: 50,
      left: 50
    },
    center: false,
    auto: false
  },
  STYLE_TYPES: [ "height", "width", "top", "left" ],
  LAYOUT_HTML: [
    '<div class="dialogHeader">',
      '<div class="dialogCloseBtn">',
      '</div>',
      '<div class="dialogTitle">',
      '</div>',
    '</div>',
    '<div class="dialogContentContainer">',
      '<div class="dialogContent">',
      '</div>',
    '</div>',
    '<div class="dialogFooter">',
    '</div>'
  ].join( "" ),
  "-chains-": {
   constructor: "manual"
  },
  constructor: function ( params, callback, closeCallback ) {
    console.log( "dialog" );

    //callback takes the form of callback( argument ) where the argument is the dialog instance
    //callback fired when dialog is ready
    //closeCallback takes the form of closeCallback( ) and is called when the dialog is closed


    var node, dialog_params;

    console.dump( arguments );

    if ( !params ) {
      params = {};
    }
    if ( params.auto ) {
      this.callback = dojo.hitch( this, "autoOpen" );
      this.closeCallback = dojo.hitch( this, "autoDestroy" );
    } else {
      this.callback = callback;
      this.closeCallback = closeCallback;
    }
    if ( !this.callback ) {
      throw "No callback for dialog";
    }
    this.title = null;
    this.content = null;
    this.buttonConnection = null;
    this.nodeId = this.generateNodeId( );
    this.params = params;
    dialog_params = {};
    dojo.mixin( dialog_params, this.DEFAULT_PARAMS );
    dialog_params.style = this.setStylesFromParams( dialog_params.style, params );
    dialog_params.id = this.nodeId;
    this.node = dojo.create( "div", dialog_params, dojo.body( ), "last" );
    this.node.innerHTML = this.LAYOUT_HTML;
    setTimeout( dojo.hitch( this, "handleNodeLoad" ), 0 );
  },
  autoOpen: function ( ) {
    this.open( );
  },
  autoDestroy: function ( ) {
    this.destroy( );
  },
  generateNodeId: function ( ) {
    return "DialogNode" + Math.round( Math.random( ) * 100000 ).toString( );
  },
  handleNodeLoad: function ( ) {
    this.title = dojo.query( ".dialogTitle", this.node ).pop( );
    this.closeBtn = dojo.query( ".dialogCloseBtn", this.node ).pop( );
    this.content = dojo.query( ".dialogContent", this.node ).pop( );
    if ( this.params.title ) {
      this.setTitle( this.params.title );
    }
    if ( this.params.content ) {
      this.setContent( this.params.content );
    }
    dojo.connect( this.closeBtn, "click", dojo.hitch( this, "handleCloseBtnClick" ) );
    this.callback( this );
  },
  handleCloseBtnClick: function ( ) {
    this.close( );
  },
  setStylesFromParams: function ( styles, params ) {

    var key, appendPx, styleArray,
      height, width, _top, left;

    appendPx = [ "height", "width", "top", "left" ];
    if ( params ) {
      for ( key in params ) {
        if ( params.hasOwnProperty( key ) && this.STYLE_TYPES.indexOf( key ) !== -1 ) {
          styles[ key ] = params[ key ];
        }
      }
    }
    if ( this.params.center ) {
      height = 200;
      width = 400;
      _top = Math.round( ( window.nativeWindow.height/2 ) - ( height/2 ) );
      left = Math.round( ( window.nativeWindow.width/2 ) - ( width/2 ) );
      styles.height = height;
      styles.width = width;
      styles.top = _top;
      styles.left = left;
    }
    styleArray = [ ];
    for ( key in styles ) {
      if ( styles.hasOwnProperty( key ) ) {
        styleArray.push( key + ":" + styles[ key ].toString( ) );
        if ( appendPx.indexOf( key ) !== -1 ) {
          styleArray.push( "px" );
        }
        styleArray.push( ";" );
      }
    }
    return styleArray.join( "" );
  },
  setTitle: function( title ) {
    this.title.innerHTML = title;
    this.params.title = title;
  },
  setContent: function ( content ) {
    this.content.innerHTML = content;
    this.params.content = content;
  },
  open: function ( ) {
    dojo.removeClass( this.node, "hidden" );
  },
  close: function ( ) {
    dojo.addClass( this.node, "hidden" );
    if ( dojo.isFunction( this.closeCallback ) ) {
      this.closeCallback( );
    }
  },
  destroy: function ( ) {
    dojo.disconnect( this.buttonConnection );
    delete this.buttonConnection;
    delete this.params;
    dojo.destroy( this.node );
    delete this.node;
  }
} );

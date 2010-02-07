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
      '<div id="mainHelp">',
        '<h1>Help</h1>',
        '<h2>Key Short Cuts</h2>',
        '<p> ',
        'Key shortcuts are case insensitive. Diomedes IRC also features up and down arrow history',
        'for the input bar and tab completion for nicks and channel names. The input bar needs to be focused',
        'for the key short cuts and page up and page down to work.',
        '</p>',
        '<dt>Cntrl + N or Command + N</dt>',
        '<dd>',
          'Select next channel.',
        '</dd>',
        '<dt>Cntrl + P or Command + P</dt>',
        '<dd>',
          'Select previous channel.',
        '</dd>',
        '<dt>Cntrl + L or Command + L</dt>',
        '<dd>',
          'Close current channel.',
        '</dd>',
        '<dt>Cntrl + U or Command + U</dt>',
        '<dd>',
          'Toggle the nick list.',
        '</dd>',
        '<dt>Cntrl + S or Command + S</dt>',
        '<dd>',
          'Check spelling. Right click on mispelled word to get suggestions if there are any.',
        '</dd>',
        '<h2>IRC Commands</h2>',
        '<p>',
          'Diomedes supports most IRC commands such as /join /mode /topic etc. ',
          'Most CTCP commands are supported. DCC, IRCOPS commands such as ',
          '/kill and IRCX are not yet supported.',
        '</p>',
        '<h2>App Commands:</h2>',
        '<dl>',
          '<dt>/server</dt>',
          '<dd>',
            'Connect to server. Ex: /server irc.netgamers.org:6667 (port optional)',
          '</dd>',
          '<dt>/network</dt>',
          '<dd>',
            'Connect to a network. First add a network and servers for the network. Ex: /network Freenode',
          '</dd>',
          '<dt>/quit</dt>',
          '<dd>',
            'Quit server. Leaves current windows open. Ex: /quit Leaving (quit message optional)',
          '</dd>',
          '<dt>/close</dt>',
          '<dd>',
            'Quit server and close all channels and server window. Ex: /close',
          '</dd>',
          '<dt>/clear</dt>',
          '<dd>',
            'Clears current channel. Ex: /clear',
          '</dd>',
          '<dt>/part </dt>',
          '<dd>',
            'Close current channel or PM. Ex: /part #someChannel quit message. (channel name and quit message optional)',
          '</dd>',
          '<dt>/nick</dt>',
          '<dd>',
           'Change nick. Ex: /nick John (changes nick to John)',
          '</dd>',
          '<dt>/exit </dt>',
          '<dd>',
            'Exits application immediately. There is no warning.',
          '</dd>',
          '<dt>/help</dt>',
          '<dd>',
            'Displays this help window.',
          '</dd>',
        '</dl>',
      '</div>'
    ].join( "" );
  }
} );

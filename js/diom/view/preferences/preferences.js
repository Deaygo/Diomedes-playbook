/*
  Copyright (c) 2010 Apphacker apphacker@gmail.com
*/
/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, setTimeout */

dojo.provide( "diom.view.preferences.preferences" );

dojo.declare( "diom.view.preferences.PreferencesBase", diom.view.dialog.Dialog, {
  "-chains-": {
    constructor: "manual"
  },
  constructor: function ( ) {

    var params, height, width;

    height = Math.round( ( window.nativeWindow.height/3 ) * 2 );
    width = Math.round( ( window.nativeWindow.width/5 ) * 4 );
    params = {
      center: false,
      auto: false,
      height: height,
      width: width,
      "top": Math.round( ( window.nativeWindow.height/2 ) - ( height/2 ) ),
      left: Math.round( ( window.nativeWindow.width/2 ) - ( width/2 ) ),
      title: this.title, //set by child class
      content: this.getContent( )
    };
    this.inherited( arguments, [ params, dojo.hitch( this, "handleLoad" ), dojo.hitch( this, "handleExit" ) ] );
    dojo.connect( this.node, "onclick", dojo.hitch( this, "handleClick" ) );
  },
  handleClick: function ( e ) {

    var node;

    node = e.target;
    if ( node.getAttribute( "type" ) === "checkbox" ) {
      node.setAttribute( "checked", false );
      node.setAttribute( "value", 0 );
      //node.checked = node.checked;
    } else if ( node.hasAttribute( "for" ) ) {
      node = dojo.byId( node.getAttribute( "for" ) );
      node.checked = !node.checked;
    }
    e[ util.EVENT_HANDLED ] = true;
  },
  handleLoad: function ( ) {
    throw "handleLoad is an bstract method that needs to be overwritten";
  },
  handleClose: function ( e ) {
    dojo.stopEvent( e );
    this.close( );
  },
  handleExit: function ( ) {
    this.destroy( );
  },
  getContent: function ( ) {
    throw "getContent is an bstract method that needs to be overwritten";
  },
  loadOptions: function ( prefs ) {

    var options, i;

    options = [];
    for ( i = 0; i < prefs.length; i++ ) {
      options.push( [
        "<option value='", i, "' ",
        ( "selected" in prefs[ i ] ? 'selected="selected" ' : '' ),
        ">",
        prefs[ i ].valueName,
        "</option>"
      ].join( "" ) );
    }
    return options.join( "" );
  },
  prefLoad: function ( prefs ) {

    var node, option, multiOptions, pref;

    for ( pref in prefs ) {
      if ( prefs.hasOwnProperty( pref ) ) {
        if ( pref === "multiOptionPrefs" ) {
          multiOptions = prefs[ pref ];
          for ( option in multiOptions ) {
            if ( multiOptions.hasOwnProperty( option ) ) {
              dojo.byId( option ).innerHTML = this.loadOptions( multiOptions[ option ]  );
            }
          }
          continue;
        }
        node = dojo.byId( pref );
        if ( node && node.getAttribute( "type" ) === "checkbox" ) {
          node.checked = ( prefs[ pref ] === "true" );
        } else if ( node ) {
          node.value = prefs[ pref ];
        }
      }
    }
  },
  setSelectedOption: function ( pref, select ) {

    var i;

    for( i = 0; i < pref.length; i++ ) {
      if ( "selected" in pref[ i ] ) {
        delete pref[ i ].selected;
      }
    }
    pref[ select.selectedIndex ].selected = "true";
  },
  savePrefs: function ( event ) {

    var node, option, multiOptions, pref, value;


    dojo.stopEvent( event );
    util.log( "Saving preferences." );
    for ( pref in this.prefs ) {
      if ( this.prefs.hasOwnProperty( pref ) ) {
        if ( pref === "multiOptionPrefs" ) {
          multiOptions = this.prefs[ pref ];
          for ( option in multiOptions ) {
            if ( multiOptions.hasOwnProperty( option ) ) {
              this.setSelectedOption( multiOptions[ option ], dojo.byId( option ) );
            }
          }
          continue;
        }
        node = dojo.byId( pref );
        if ( node && node.getAttribute( "type" ) === "checkbox" ) {
          this.prefs[ pref ] = node.checked.toString( );
        } else if ( node ) {
          value = node.value;
          if ( value || value === 0 || value === "" ) {
            this.prefs[ pref ] = value;
          }
        }
      }
    }
    dojo.publish( diom.topics.PREFS_SAVE, [ this.prefs ] );
  }
} );

dojo.declare( "diom.view.preferences.Preferences", diom.view.preferences.PreferencesBase, {
  "-chains-": {
    destroy: "before",
    constructor: "manual"
  },
  constructor: function ( prefs ) {
    this.title = "Preferences";
    this.closePrefsBtnConnection = null;
    this.saveFormConnection = null;
    this.prefs = prefs;
    this.inherited( arguments );
  },
  handleLoad: function ( ) {
    this.saveFormConnection = dojo.connect( dojo.byId( "preferenceForm" ), "onsubmit", dojo.hitch( this, "savePrefs" ) );
    this.closePrefsBtnConnection = dojo.connect( dojo.byId( "closePrefsBtn" ), "onclick", dojo.hitch( this, "handleClose" ) );
    this.prefLoad( this.prefs );
    this.open( );
  },
  destroy: function ( ) {
    dojo.disconnect( this.closePrefsBtnConnection );
  },
  getContent: function ( ) {
    return [
      '<div class="preferences">',
        '<h1>Preferences</h1>',
        '<form id="preferenceForm">',
          '<div class="formItem">',
            '<label for="nick">Nick: </label> <input type="text" id="nick" />',
          '</div>',
          '<div class="formItem">',
            '<label for="altNick">Alternate nick: </label> <input type="text" id="altNick" />',
          '</div>',
          '<div class="formItem">',
            '<label for="userName">Username: </label> <input type="text" id="userName" />',
          '</div>',
          '<div class="formItem">',
            '<label for="realName">Real name: </label> <input type="text" id="realName" />',
          '</div>',
          '<div class="formItem">',
            '<label for="finger">Finger (shows up for a CTCP finger): </label> <input type="text" id="finger" />',
          '</div>',
          '<div class="formItem">',
            '<label for="historyLength">History Length: </label> <input type="text" id="historyLength" />',
          '</div>',
          '<div class="formItem">',
            '<label for="theme">Theme: </label> <select id="theme" ><option value="none">none</option></select>',
          '</div>',
          '<div class="formItem">',
            '<label for="pollTime">Reconnect wait (seconds): </label> <input type="text" id="pollTime" />',
          '</div>',
          '<div class="formItem">',
            '<label for="font">Font: </label> <select id="font" ><option value="none">none</option></select>',
          '</div>',
          '<div class="formItem">',
            '<label for="fontSize">Base Font size (pixels - 8 min, 32 max ): </label> <input type="text" id="fontSize" />',
          '</div>',
          '<div class="formItem">',
            '<label for="updateDelay">Check for updates (in days, 0 turns off): </label> <input type="text" id="updateDelay" />',
          '</div>',
          '<div class="formItem">',
            '<label for="updateURL">Update URL: </label> <input type="text" id="updateURL" />',
          '</div>',
          '<div class="formItem">',
          '<div class="formItem">',
            '<label for="autoJoin">Auto join on invite: </label> <input type="checkbox" id="autoJoin" />',
          '</div>',
          '<div class="formItem">',
            '<label for="logging">Enable logging: </label> <input type="checkbox" id="logging" />',
            '<p class="formItemNote">Logs are in your documents directory</p>',
          '</div>',
          '<div class="formItem">',
            '<label for="time">Time: </label> <select id="time" ><option value="none">none</option></select>',
          '</div>',
          '<input id="savePrefsBtn" type="submit" value="Save" />',
          '<button id="closePrefsBtn">Close</button>',
        '</form>',
      '</div>'
    ].join( "" );
  }
} );


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
  MAX_WIDTH: 600,
  "-chains-": {
    constructor: "manual"
  },
  constructor: function ( ) {

    var params, height, width;

    height = Math.round( ( window.nativeWindow.height/3 ) * 2 );
    width = Math.round( ( window.nativeWindow.width/5 ) * 4 );
    if ( width > this.MAX_WIDTH ) {
      width = this.MAX_WIDTH;
    }
    params = {
      center: false,
      auto: false,
      height: height,
      width: width,
      "top": Math.round( ( window.nativeWindow.height/2 ) - ( height/2 ) ),
      left: Math.round( ( window.nativeWindow.width/2 ) - ( width/2 ) ),
      title: this.id, //set by child class
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
  },
  getNetworkName: function ( id ) {

    var i, network;

    for ( i = 0; i < this.networks.length; i++ ) {
      network = this.networks[ i ];
      if ( id === network.id ) {
        return network.name;
      }
    }
    return null;
  },
  displayNetworks: function ( ) {

    var node, r, i;

    node = dojo.byId( "networksList" );
    node.innerHTML = "";
    if ( this.networks && this.networks.length ) {
      r = ['<select id="selectNetwork" onchange="selectNetwork( event );">'];
      r.push( '<option selected="selected" disabled="disabled">Select a network</option>' );
      for ( i = 0; i < this.networks.length; i++ ) {
        r.push( this.getNetworkHTML( this.networks[ i ] ) );
      }
      r.push('</select>');
      node.innerHTML = r.join( "" );
    } else {
      node.innerHTML = "You have not created any networks.";
    }
    setTimeout( dojo.hitch( this, function ( ) {
      this.networksListConnection = dojo.connect( dojo.byId( "selectNetwork" ), "onchange", dojo.hitch( this, "selectNetwork" ) );
    } ), 0 );
  },
  getItem: function ( id, name, dataStore, isCheckbox, required ) {

    var value;

    if ( isCheckbox ) {
      value = dojo.byId( id ).checked;
      if ( value === true || value === false ) {
        dataStore[ id ] = value;
        return true;
      }
    }
    value = dojo.trim( dojo.byId( id ).value );
    if ( required && !value ) {
      this.view.notify( name + " required." );
      return false;
    }
    dataStore[ id ] = value;
    return true;
  },
  getNetworkHTML: function ( network ) {
    return [
      '<option value="', network.id, '",>', network.name, '</option> '
    ].join( "" );
  },
  selectNetwork: function ( ) {

    var node;

    this.closeForm( );
    node = dojo.byId( "selectNetwork" );
    this.selectedNetworkId = parseInt( node.options[ node.selectedIndex ].value, 10 );
    this.model[ "get" + this.id ]( this.selectedNetworkId, dojo.hitch( this, this.listMethod ) );
  },
  handleModelLoad: function ( data ) {
    this.networks = data;
    this.displayNetworks( );
  },
  showAddForm: function ( event ) {
    dojo.stopEvent( event );
    this.clearForm( );
    this.showForm( );
  },
  showForm: function ( ) {
    if ( this.selectedNetworkId ) {
      dojo.byId( "networkId" ).value = this.selectedNetworkId;
    }
    dojo.removeClass( dojo.byId( this.formId ), "hidden" );
  },
  closeForm: function ( event ) {
    if ( event ) {
      dojo.stopEvent( event );
    }
    dojo.addClass( dojo.byId( this.formId ), "hidden" );
  },
  clearForm: function ( ) {
    if ( dojo.byId( "name" ) ) {
      dojo.byId( "name" ).value = "";
    }
    dojo.byId( "id" ).value = "0";
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


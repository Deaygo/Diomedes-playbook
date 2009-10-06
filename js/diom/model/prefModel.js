
dojo.provide( "diom.model.prefModel" );

  dModel.PrefModel = function ( model ) {
    this.model = model;
    this.fileName = "preferences.xml";
    this.preferences = {};
    this.preferencesChanges = new Date( ).getTime( );
    this.prefVersion = 0;
    this.updated = true;
    this.getPrefs( );
    this.checkPrefs( );
  }

  var _mpp = dModel.PrefModel.prototype;

  _mpp.checkPrefs = function ( ) {
    util.log( "Checking prefs." );
    var defaultPrefsFile = air.File.applicationDirectory.resolvePath( this.fileName );
    var fileStream = new air.FileStream( ); 
    fileStream.open( defaultPrefsFile, air.FileMode.READ ); 
    var xml = fileStream.readUTFBytes( fileStream.bytesAvailable );
    fileStream.close( );
    delete fileStream;
    var domParser = new DOMParser( );
    var d = domParser.parseFromString( xml , "text/xml" );
    delete domParser;
    var version = d.firstChild.getAttribute("version");
    //XXX: maybe make sure new version is a higher value here.
    if ( version != this.version ) {
      util.log( "Preferences have been updated, replacing." );
      this.version = version;
      this.updatePreferences( d );
      //view not created yet, need to notify user anyhow:
      alert( "Preferenes have been updated in this version. Some preferences may have been reset." );
      return;
    }
    delete d;
  }

  _mpp.updatePreferences = function( doc ) {
    var prefs = this.getSingleValuePrefs( doc );
    for ( var name in this.preferences ) {
      if ( name in prefs ) {
        if ( this.preferences.hasOwnProperty( name ) && name != "prototype" ) {
          prefs[ name ] = this.preferences[ name ];
        }
      }
    }
    var newMVPrefs = this.getMultiValuePrefs( doc );
    var oldMVPrefs = this.preferences[ "multiOptionPrefs" ];
    for ( var key in oldMVPrefs ) {
      var pref = oldMVPrefs[ key ];
      if ( pref.length && key in newMVPrefs ) {
        var selectedName = null;
        var selectedValue = null;
        for ( var i = 0; i < pref.length; i++ ) {
          var option = pref[ i ];
          if ( "selected" in option ) {
            selectedName = option.valueName;
            selectedValue = option.value;
            break;
          }
        }
        if ( selectedName ) {
          //check to see if new preferences even have this value
          var hasValue = false;
          pref = newMVPrefs[ key ];
          for ( var i = 0; i < pref.length; i++ ) {
            var option = pref[ i ];
            if ( option.valueName == selectedName ) {
              //don't bother relooping if users pref is already set as default:
              //also don't bother saving users value if value for option name is now different
              if ( !( "selected" in option && option.selected === true ) && option.value == selectedValue ) {
                //reloop
                hasValue = true;
              }
              break;
            }
          }
          if ( hasValue ) {
            for ( var i = 0; i < pref.length; i++ ) {
              var option = pref[ i ];
              if ( option.valueName == selectedName ) {
                option.selected = true;
              } else {
                delete option.selected;
              }
            }
          }
        }
      }
    }
    prefs[ "multiOptionPrefs" ] = newMVPrefs;
    this.preferences = prefs;
    this.savePrefs( );
    delete doc;
  }

  _mpp.getFile = function ( ) {
    return air.File.applicationStorageDirectory.resolvePath( this.fileName );
  }

  _mpp.createFile = function ( fileStream ) {
    if ( !fileStream ) {
      var defaultPrefsFile = air.File.applicationDirectory.resolvePath( this.fileName );
      var fileStream = new air.FileStream( ); 
      fileStream.open( defaultPrefsFile, air.FileMode.READ ); 
    }
    var xml = fileStream.readUTFBytes( fileStream.bytesAvailable );
    fileStream.close( );
    delete fileStream;
    this.preferences = this.getPrefsFromXML( xml );
    this.savePrefs( );
    return this.preferences;
  }

  _mpp.getPref = function ( key ) {
    if ( key in this.preferences ) {
      return this.preferences[ key ];
    } else {
      return null;
    }
  }

  _mpp.setPref = function ( key, value ) {
    this.preferences[ key ] = value;
  }

  _mpp.getMultiValuePrefs = function ( doc ) {
    var prefs = {};
    var mNodes = doc.getElementsByTagName( "multiOptionPreference" );
    for ( var i = 0; i < mNodes.length; i++ ) {
      var pref = mNodes[ i ]; 
      var name = pref.getAttribute( "name" );
      prefs[ name ] = [];
      var options = pref.getElementsByTagName( "option" );
      for ( var j = 0; j < options.length; j++ ) {
        var option = options[ j ];
        var o = {};
        o[ "valueName" ] = option.getAttribute( "valueName" );
        o[ "value" ] = option.getAttribute( "value" );
        if ( option.hasAttribute( "selected" ) ) {
          o[ "selected" ] = true;
        }
        prefs[ name ].push( o );
      }
    }
    return prefs;
  }

  _mpp.getSingleValuePrefs = function ( doc ) {
    var prefs = {};
    var pNodes = doc.getElementsByTagName( "preference" );
    for ( var i = 0; i < pNodes.length; i++ ) {
      var pNode = pNodes[ i ];
      var name = pNode.getAttribute( "name" );
      var value = pNode.getAttribute( "value" );
      //0's and empty strings are valid values
      if ( name && ( value || value === 0 || value === "" ) ) {
        prefs[ name ] = value;
      }
    }
    return prefs;
  }

  _mpp.getPrefsFromXML = function ( xml ) {
    var domParser = new DOMParser( );
    var d = domParser.parseFromString( xml , "text/xml" );
    //get prefs
    this.version = d.firstChild.getAttribute("version");
    var prefs = this.getSingleValuePrefs( d );
    prefs[ "multiOptionPrefs" ] = this.getMultiValuePrefs( d );
    delete domParser
    return prefs;
  }

  _mpp.getPrefs = function ( ) {
    if ( !this.updated ) return util.cloneObject( this.preferences );
    this.updated = false;
    var fileStream = new air.FileStream( ); 
    var file = this.getFile( );
    if ( file.exists ) {
      fileStream.open( file, air.FileMode.READ ); 
      var xml = fileStream.readUTFBytes( fileStream.bytesAvailable );
      fileStream.close( );
      delete fileStream;
      this.preferences = this.getPrefsFromXML( xml );
      return util.cloneObject( this.preferences );
    } else {
      return util.cloneObject( this.createFile( ) );
    }
  }

  _mpp.setPrefs = function ( prefs ) {
    if ( !prefs ) return;
    if ( prefs.historyLength != this.preferences.historyLength ) {
      util.publish( diom.topics.PREFS_CHANGE_HISTORY_LENGTH, [ prefs.historyLength ] );
    }
    if ( prefs.autoJoin != this.preferences.autoJoin ) {
      util.publish( diom.topics.PREFS_CHANGE_AUTOJOIN, [ prefs.autoJoin ] );
    }
    if ( prefs.logging != this.preferences.logging ) {
      util.publish( diom.topics.PREFS_CHANGE_LOGGING, [ prefs.logging === "true" ] );
    }
    if ( prefs.updateDelay != this.preferences.updateDelay ) {
      util.publish( diom.topics.UPDATE_DELAY_CHANGE, [ prefs.updateDelay ] );
    }
    if ( prefs.updateURL != this.preferences.updateURL ) {
      util.publish( diom.topics.UPDATE_URL_CHANGE, [ prefs.updateURL ] );
    }
    util.publish( diom.topics.PREFS_CHANGE_FONT, [ prefs.multiOptionPrefs.font, prefs.fontSize ] );
    util.publish( diom.topics.PREFS_CHANGE_TIME_FORMAT, [ prefs.multiOptionPrefs.time ] );
    util.publish( diom.topics.PREFS_CHANGE_THEME, [ prefs.multiOptionPrefs.theme ] );
    this.preferences = prefs;
  }

  _mpp.savePrefs = function ( ) {
    this.updated = true;
    var fileStream = new air.FileStream( ); 
    fileStream.open( this.getFile( ), air.FileMode.WRITE ); //WRITE truncates
    var d = document.implementation.createDocument( "", "preferences", null );
    //add prefs
    for ( var name in this.preferences ) {
      if ( this.preferences.hasOwnProperty( name ) ) {
        if ( name == "multiOptionPrefs" ) {
          var multiOptionPrefs = this.preferences[ name ];
          for ( var prefName in multiOptionPrefs ) {
            var multiOptionPref = multiOptionPrefs[ prefName ];
            var m = d.createElement( "multiOptionPreference" );
            m.setAttribute( "name", prefName );
            for ( var i = 0; i < multiOptionPref.length; i++ ) {
              var option = multiOptionPref[ i ];
              var o = d.createElement( "option" );
              if ( "selected" in option ) {
                o.setAttribute( "selected", "true" );
              }
              o.setAttribute( "valueName", option.valueName );
              o.setAttribute( "value", option.value );
              m.appendChild( o );
            }
            d.firstChild.appendChild( m );
          }
        } else { 
          var value = this.preferences[ name ];
          var p = d.createElement( "preference" ); 
          //0's and empty strings are valid values
          if ( name && ( value || value === 0 || value === "" ) ) {
            p.setAttribute( "name", name );
            p.setAttribute( "value", value );
          } 
          d.firstChild.appendChild( p );
        }
      }
    }
    d.firstChild.setAttribute( "version", this.version );
    //write prefs to file
    var x = new XMLSerializer( );
    var s = x.serializeToString( d );
    fileStream.writeUTFBytes( s );
    //clean up
    fileStream.close( );
    delete fileStream;
    delete d;
    delete x;
  }


/*jslint white: false */
/*jslint nomen: false */
/*jslint regexp: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, air, document, alert, DOMParser, XMLSerializer */

dojo.provide( "diom.model.prefModel" );

dojo.declare( "diom.model.PrefModel", null, {

  constructor: function ( model ) {
    this.model = model;
    this.fileName = "preferences.xml";
    this.preferences = {};
    this.preferencesChanges = new Date( ).getTime( );
    this.prefVersion = 0;
    this.updated = true;
    this.getPrefs( );
    this.checkPrefs( );
  },

  checkPrefs: function ( ) {
		var defaultPrefsFile, fileStream, xml, domParser, d, version;
    util.log( "Checking prefs." );
    defaultPrefsFile = air.File.applicationDirectory.resolvePath( this.fileName );
    fileStream = new air.FileStream( ); 
    fileStream.open( defaultPrefsFile, air.FileMode.READ ); 
    xml = fileStream.readUTFBytes( fileStream.bytesAvailable );
    fileStream.close( );
    fileStream = null;
    domParser = new DOMParser( );
    d = domParser.parseFromString( xml , "text/xml" );
    domParser = null;
    version = d.firstChild.getAttribute("version");
    //XXX: maybe make sure new version is a higher value here.
    if ( version !== this.version ) {
      util.log( "Preferences have been updated, replacing." );
      this.version = version;
      this.updatePreferences( d );
      //view not created yet, need to notify user anyhow:
      alert( "Preferenes have been updated in this version. Some preferences may have been reset." );
      return;
    }
    d = null;
  },

  updatePreferences: function( doc ) {
		var prefs, name, newMVPrefs, oldMVPrefs, key,
			selectedName, selectedValue, i, option,
			hasValue, pref;
    prefs = this.getSingleValuePrefs( doc );
    for ( name in this.preferences ) {
      if ( name in prefs ) {
        if ( this.preferences.hasOwnProperty( name ) && name !== "prototype" ) {
          prefs[ name ] = this.preferences[ name ];
        }
      }
    }
    newMVPrefs = this.getMultiValuePrefs( doc );
    oldMVPrefs = this.preferences.multiOptionPrefs;
    for ( key in oldMVPrefs ) {
			if ( oldMVPrefs.hasOwnProperty( key ) ) {
				pref = oldMVPrefs[ key ];
				if ( pref.length && key in newMVPrefs ) {
					selectedName = null;
					selectedValue = null;
					for ( i = 0; i < pref.length; i++ ) {
						option = pref[ i ];
						if ( "selected" in option ) {
							selectedName = option.valueName;
							selectedValue = option.value;
							break;
						}
					}
					if ( selectedName ) {
						//check to see if new preferences even have this value
						hasValue = false;
						pref = newMVPrefs[ key ];
						for ( i = 0; i < pref.length; i++ ) {
							option = pref[ i ];
							if ( option.valueName === selectedName ) {
								//don't bother relooping if users pref is already set as default:
								//also don't bother saving users value if value for option name is now different
								if ( !( "selected" in option && option.selected === true ) && option.value === selectedValue ) {
									//reloop
									hasValue = true;
								}
								break;
							}
						}
						if ( hasValue ) {
							for ( i = 0; i < pref.length; i++ ) {
								option = pref[ i ];
								if ( option.valueName === selectedName ) {
									option.selected = true;
								} else {
									delete option.selected;
								}
							}
						}
					}
				}
			}
    }
    prefs.multiOptionPrefs = newMVPrefs;
    this.preferences = prefs;
    this.savePrefs( );
    doc = null;
  },

  getFile: function ( ) {
    return air.File.applicationStorageDirectory.resolvePath( this.fileName );
  },

  createFile: function ( fileStream ) {
		var defaultPrefsFile, xml;
    if ( !fileStream ) {
      defaultPrefsFile = air.File.applicationDirectory.resolvePath( this.fileName );
      fileStream = new air.FileStream( ); 
      fileStream.open( defaultPrefsFile, air.FileMode.READ ); 
    }
    xml = fileStream.readUTFBytes( fileStream.bytesAvailable );
    fileStream.close( );
    fileStream = null;
    this.preferences = this.getPrefsFromXML( xml );
    this.savePrefs( );
    return this.preferences;
  },

  getPref: function ( key ) {
    if ( key in this.preferences ) {
      return this.preferences[ key ];
    } else {
      return null;
    }
  },

  setPref: function ( key, value ) {
    this.preferences[ key ] = value;
  },

  getMultiValuePrefs: function ( doc ) {
		var prefs, mNodes, i, pref, name, 
			options, j, option, o;
    prefs = {};
    mNodes = doc.getElementsByTagName( "multiOptionPreference" );
    for ( i = 0; i < mNodes.length; i++ ) {
      pref = mNodes[ i ]; 
      name = pref.getAttribute( "name" );
      prefs[ name ] = [];
      options = pref.getElementsByTagName( "option" );
      for ( j = 0; j < options.length; j++ ) {
        option = options[ j ];
        o = {};
        o.valueName = option.getAttribute( "valueName" );
        o.value = option.getAttribute( "value" );
        if ( option.hasAttribute( "selected" ) ) {
          o.selected = true;
        }
        prefs[ name ].push( o );
      }
    }
    return prefs;
  },

  getSingleValuePrefs: function ( doc ) {
		var prefs, pNodes, i, pNode, name, value;
    prefs = {};
    pNodes = doc.getElementsByTagName( "preference" );
    for ( i = 0; i < pNodes.length; i++ ) {
      pNode = pNodes[ i ];
      name = pNode.getAttribute( "name" );
      value = pNode.getAttribute( "value" );
      //0's and empty strings are valid values
      if ( name && ( value || value === 0 || value === "" ) ) {
        prefs[ name ] = value;
      }
    }
    return prefs;
  },

  getPrefsFromXML: function ( xml ) {
		var domParser, d, prefs;
    domParser = new DOMParser( );
    d = domParser.parseFromString( xml , "text/xml" );
    //get prefs
    this.version = d.firstChild.getAttribute("version");
    prefs = this.getSingleValuePrefs( d );
    prefs.multiOptionPrefs = this.getMultiValuePrefs( d );
    domParser = null;
    return prefs;
  },

  getPrefs: function ( ) {
		var fileStream, file, xml;
    if ( !this.updated ) {
			return util.cloneObject( this.preferences );
		}
    this.updated = false;
    fileStream = new air.FileStream( ); 
    file = this.getFile( );
    if ( file.exists ) {
      fileStream.open( file, air.FileMode.READ ); 
      xml = fileStream.readUTFBytes( fileStream.bytesAvailable );
      fileStream.close( );
      fileStream = null;
      this.preferences = this.getPrefsFromXML( xml );
      return util.cloneObject( this.preferences );
    } else {
      return util.cloneObject( this.createFile( ) );
    }
  },

  setPrefs: function ( prefs ) {
    if ( !prefs ) { return; }
    if ( prefs.historyLength !== this.preferences.historyLength ) {
      dojo.publish( diom.topics.PREFS_CHANGE_HISTORY_LENGTH, [ prefs.historyLength ] );
    }
    if ( prefs.autoJoin !== this.preferences.autoJoin ) {
      dojo.publish( diom.topics.PREFS_CHANGE_AUTOJOIN, [ prefs.autoJoin ] );
    }
    if ( prefs.logging !== this.preferences.logging ) {
      dojo.publish( diom.topics.PREFS_CHANGE_LOGGING, [ prefs.logging === "true" ] );
    }
    if ( prefs.updateDelay !== this.preferences.updateDelay ) {
      dojo.publish( diom.topics.UPDATE_DELAY_CHANGE, [ prefs.updateDelay ] );
    }
    if ( prefs.updateURL !== this.preferences.updateURL ) {
      dojo.publish( diom.topics.UPDATE_URL_CHANGE, [ prefs.updateURL ] );
    }
    dojo.publish( diom.topics.PREFS_CHANGE_FONT, [ prefs.multiOptionPrefs.font, prefs.fontSize ] );
    dojo.publish( diom.topics.PREFS_CHANGE_TIME_FORMAT, [ prefs.multiOptionPrefs.time ] );
    dojo.publish( diom.topics.PREFS_CHANGE_THEME, [ prefs.multiOptionPrefs.theme ] );
    this.preferences = prefs;
  },

  savePrefs: function ( ) {
		var fileStream, d, name, multiOptionPrefs,
			prefName, multiOptionPref, m, i, o, value,
			p, x, s, option;
    this.updated = true;
    fileStream = new air.FileStream( ); 
    fileStream.open( this.getFile( ), air.FileMode.WRITE ); //WRITE truncates
    d = document.implementation.createDocument( "", "preferences", null );
    //add prefs
    for ( name in this.preferences ) {
      if ( this.preferences.hasOwnProperty( name ) ) {
        if ( name === "multiOptionPrefs" ) {
          multiOptionPrefs = this.preferences[ name ];
          for ( prefName in multiOptionPrefs ) {
						if( multiOptionPrefs.hasOwnProperty( prefName ) ) {
							multiOptionPref = multiOptionPrefs[ prefName ];
							m = d.createElement( "multiOptionPreference" );
							m.setAttribute( "name", prefName );
							for ( i = 0; i < multiOptionPref.length; i++ ) {
								option = multiOptionPref[ i ];
								o = d.createElement( "option" );
								if ( "selected" in option ) {
									o.setAttribute( "selected", "true" );
								}
								o.setAttribute( "valueName", option.valueName );
								o.setAttribute( "value", option.value );
								m.appendChild( o );
							}
							d.firstChild.appendChild( m );
						}
          }
        } else { 
          value = this.preferences[ name ];
          p = d.createElement( "preference" ); 
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
    x = new XMLSerializer( );
    s = x.serializeToString( d );
    fileStream.writeUTFBytes( s );
    //clean up
    fileStream.close( );
    fileStream = null;
    d = null;
    x = null;
  }

} );

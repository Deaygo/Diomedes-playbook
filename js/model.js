/*
  Copyright (c) 2009 Apphacker apphacker@gmail.com
*/

var dModel;

if(!dModel) {
  dModel = {};
}

if ( window.runtime && air && util ) {
  //requires AIR and util

  dModel.Model = function ( ) {
    this.SQL_TYPES = {
      "INTEGER" : "INTEGER",
      "TEXT" : "TEXT",
      "BOOL" : "BOOLEAN",
      "PRIMARY_KEY" : "PRIMARY KEY",
      "AUTOINCREMENT" : "AUTOINCREMENT",
    };
    this.statement = null;
    this.DATABASE_NAME = "diomedesModel.db";
    this.prefs = new dModel.PrefModel( this );
    this.aliases = new dModel.AliasModel( this );
    this.networks = new dModel.NetworksModel( this );
    this.ignores = new dModel.IgnoresModel( this );
    this.conn = null;
  }

  var _mmp = dModel.Model.prototype;

  _mmp._openSQLConn = function ( type, errorHandler ) {
    this.log( "Opening SQL connection..." );
    if ( !type ) {
      this.log( "Required params missing for _openSQLConn" );
      return;
    }
    if ( !errorHandler ) errorHandler = util.hitch( this, "_handleError", [ "openSQLConnection" ] );
    if ( this.conn ) this.closeConnection( );
    this.conn = new air.SQLConnection( ); 
    var dbFile = air.File.applicationStorageDirectory.resolvePath( this.DATABASE_NAME ); 
    try {
      this.conn.open( dbFile, type ); 
    } catch ( error ) {
      errorHandler( error );
    }
  }

  _mmp._executeSQL = function ( sql, type, resultsHandler, parameters, errorHandler, isRexecution ) {
    this.log( "Executing SQL statement... sql: " + sql );
    if ( !sql || !type || !resultsHandler ) {
      this.log( "Required params missing for _executeSQL" );
      return;
    }
    if ( !errorHandler ) errorHandler = util.hitch( this, "_handleError", [ "SQL: " + sql ] );
    if ( !this.conn || !this.conn.connected ) { 
      this.log( "Connection not open when calling _executeSQL, opening it");
      this._openSQLConn( type, errorHandler );
    }
    var s = new air.SQLStatement( ); 
    s.sqlConnection = this.conn; 
    this.statement = s;
    this.log( "executing sql: " + sql );
    s.text = sql; 
    if ( parameters ) {
      for ( var i in parameters ) {
        if ( parameters.hasOwnProperty( i ) && i != "prototype" ) {
          s.parameters[ ":" + i ] = parameters[ i ];
        }
      }
    }
    try {
      s.execute( ); 
    } catch ( error ) {
      this._statementResultHandler( error, errorHandler );
    }
    this._statementResultHandler( null, resultsHandler );
  }

  _mmp._statementResultHandler = function ( e, resultsHandler ) {
    this.log( "Handling statement completion" );
    var result = this.statement.getResult( );
    this.log("deleting statement with sql of: " + this.statement.text );
    delete this.statement;
    this.statement = null;
    this.closeConnection( );
    resultsHandler( e, result );
  }

  _mmp._getResult = function ( e, result, resultsHandler ) {
    resultsHandler( result.data );
  }

  _mmp._getFilterResult = function ( e, results, resultsHandler ) {
    //filters the event, and returns just the data;
    resultsHandler( results.data );
  }

  _mmp._getResultHandler = function ( resultsHandler ) {
    return util.hitch( this, "_getFilterResult", [ resultsHandler ] );
  }

  _mmp._createTable = function ( name, types, resultsHandler, parameters, errorHandler ) {
    this.log("Creating Table.");
    var sql = [];
    sql = sql.concat( [ "CREATE TABLE IF NOT EXISTS ", name, " (" ] );  
    for ( var name in types ) {
      sql.push( [ name, types[ name ] ].join( " " ) );
      sql.push( ", ");
    }
    sql.pop( ); //get rid of last comma
    sql.push( ")" );
    this._executeSQL( sql.join( "" ), air.SQLMode.CREATE, resultsHandler, parameters, errorHandler );
  }

  _mmp._handleError = function ( e, msg ) {
    this.log("error: " + e);
    this.log("message: " + msg );
    this.log("Error message:", e.error.message); 
    this.log("Details:", e.error.details); 
  }

  _mmp.log = function ( msg ) {
    util.log("\nSQL LOG: " + msg );
  }

  _mmp.closeConnection = function ( ) {
    this.log("close connection");
    if ( this.conn && this.conn.connected ) {
      this.conn.close( );
    }
    this.conn = null;
  }

  dModel.NetworksModel = function ( model ) {
    util.log("NetworksModel");
    this.model = model;
    this.createTablesList = [];
    //check to see if tables exists by attempting to create them
    this.createTables( );
  }

  var _mnp = dModel.NetworksModel.prototype;

  _mnp.createTables = function ( ) {
    util.log("createTables");
    var st = this.model.SQL_TYPES;
    var types; 
    types = {
      id : [ st.INTEGER, st.PRIMARY_KEY, st.AUTOINCREMENT ].join( " " ),
      name : st.TEXT,
      nick : st.TEXT,
      altNick : st.TEXT,
      userName : st.TEXT,
      realName : st.TEXT,
      finger : st.TEXT,
      active : st.BOOL,
      autoJoin : st.BOOL,
      lastConnected : st.INTEGER,
    }
    util.log("creating networks");
    var tableName = "networks";
    this.createTablesList.push( { tableName : tableName, types : types } );
    types = {
      id : [ st.INTEGER, st.PRIMARY_KEY, st.AUTOINCREMENT ].join( " " ),
      networkId : st.INTEGER,
      name : st.TEXT,
      lastConnected : st.INTEGER,
      active : st.BOOL,
    }
    util.log("creating servers");
    tableName = "servers";
    this.createTablesList.push( { tableName : tableName, types : types } );
    types = {
      id : [ st.INTEGER, st.PRIMARY_KEY, st.AUTOINCREMENT ].join( " " ),
      networkId : st.INTEGER,
      name : st.TEXT,
      lastConnected : st.INTEGER,
      autoJoin : st.BOOL,
    }
    util.log("creating channels");
    tableName = "channels";
    this.createTablesList.push( { tableName : tableName, types : types } );
    types = {
      id : [ st.INTEGER, st.PRIMARY_KEY, st.AUTOINCREMENT ].join( " " ),
      networkId : st.INTEGER,
      name : st.TEXT,
      command : st.TEXT,
      active : st.BOOL,
    }
    util.log("creating preforms");
    tableName = "performs";
    this.createTablesList.push( { tableName : tableName, types : types } );
    this._handleCreateTable( );
  }

  _mnp.getNetworks = function ( resultsHandler ) {
    util.log("getNetworks");
    var sql = "SELECT * FROM networks";
    var p = {};
    this.model._executeSQL( sql, air.SQLMode.READ, this.model._getResultHandler( resultsHandler ), p ); 
  }

  _mnp.addNetwork = function ( name, nick, altNick, userName, realName, finger, autoJoin, active ) {
    util.log("adding network.");
    var sql = "INSERT INTO networks ( name, nick, altNick, userName, realName, finger, autoJoin, active ) " +
      "Values ( :name, :nick, :altNick, :userName, :realName, :finger, :autoJoin, :active )";
    var p = {
      name : name, 
      nick : nick,
      altNick : altNick, 
      userName : userName, 
      realName : realName, 
      finger: finger, 
      autoJoin : autoJoin, 
      active : active 
    }
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    util.publish( topics.NETWORK_CHANGE, [ null ] );
  }

  _mnp.editNetwork = function ( id, name, nick, altNick, userName, realName, finger, autoJoin, active ) {
    util.log("Edit network.");
    var sql = "UPDATE networks SET name = :name, nick = :nick, altNick = :altNick, userName = :userName, " + 
      "realName = :realName, finger = :finger, autoJoin = :autoJoin, active = :active  " +
      "WHERE id = :id ";
    var p = {
      id : id,
      name : name, 
      nick : nick,
      altNick : altNick, 
      userName : userName, 
      realName : realName, 
      finger: finger, 
      autoJoin : autoJoin, 
      active : active 
    }
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    util.publish( topics.NETWORK_CHANGE, [ id ] );
  }

  _mnp.remNetwork = function ( id ) {
    util.log("Removing network.");
    var sql;
    var p = { id : id };
    sql = "DELETE FROM networks WHERE id = :id";
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    sql = "DELETE FROM servers WHERE networkId = :id";
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    sql = "DELETE FROM channels WHERE networkId = :id";
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    sql = "DELETE FROM performs WHERE networkId = :id";
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    util.publish( topics.NETWORK_CHANGE, [ null ] );
    //rem servers, channels and performs too
  }

  _mnp.getServers = function ( networkId, resultsHandler ) {
    var sql = "SELECT * FROM servers WHERE networkId = :networkId";
    var p = { networkId : networkId };
    this.model._executeSQL( sql, air.SQLMode.READ, this.model._getResultHandler( resultsHandler ), p ); 
  }

  _mnp.addServer = function ( networkId, name, active ) {
    var sql = "INSERT INTO servers ( networkId, name, active ) " +
      "Values ( :networkId, :name, :active )";
    var p = {
      networkId : networkId,
      name : name,
      active : active,
    }
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    util.publish( topics.NETWORK_CHANGE, [ networkId ] );
  }

  _mnp.editServer = function ( id, networkId, name, autoJoin, active ) {
    var sql = "UPDATE servers SET networkId = :networkId, name = :name, autoJoin = :autoJoin, active = :active " +
      "WHERE id = :id ";
    var p = {
      id : id,
      networkId : networkid,
      name : name, 
      autoJoin : autoJoin, 
      active : active 
    }
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    util.publish( topics.NETWORK_CHANGE, [ networkId ] );
  }

  _mnp.remServer = function ( id, networkId ) {
    var sql = "DELETE FROM servers WHERE id = :id";
    var p = { id : id };
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    util.publish( topics.NETWORK_CHANGE, [ networkId ] );
  }

  _mnp.getChannels = function ( networkId, resultsHandler ) {
    var sql = "SELECT * FROM channels WHERE networkId = :networkId";
    var p = { networkId : networkId };
    this.model._executeSQL( sql, air.SQLMode.READ, this.model._getResultHandler( resultsHandler ), p ); 
  }

  _mnp.addChannel = function ( networkId, name, autoJoin ) {
    var sql = "INSERT INTO channels ( networkId, name, autoJoin ) " +
      "VALUES ( :networkId, :name, :autoJoin )";
    p = { networkId : networkId, name : name, autoJoin : autoJoin };
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    util.publish( topics.NETWORK_CHANGE, [ networkId ] );
  }

  _mnp.remChannel = function ( id, networkId ) {
    var sql = "DELETE FROM channels WHERE id = :id";
    p = { id : id };
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    util.publish( topics.NETWORK_CHANGE, [ networkId ] );
  }

  _mnp.getPerforms = function ( networkId, resultsHandler ) {
    var sql = "SELECT * FROM performs WHERE networkId = :networkId";
    var p = { networkId : networkId };
    this.model._executeSQL( sql, air.SQLMode.READ, this.model._getResultHandler( resultsHandler ), p ); 
  }

  _mnp.addPerform = function ( networkId, name, command, active ) {
    //XXX: maybe use default names such as performX where X is a number
    //so as to not force people to think up a name for each perform
    var sql = "INSERT INTO performs ( networkId, name, command, active ) " + 
      "VALUES ( :networkId, :name, :command, :active )";
    var p = {
      networkId : networkId,
      name : name,
      command : command,
      active : active
    }
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    util.publish( topics.NETWORK_CHANGE, [ networkId ] );
  }

  _mnp.editPerform = function ( id, networkId, name, command, active ) {
    var sql = "UPDATE performs SET networkId = :networkId, name = :name " + 
      "command = :command, active = :active WHERE id = :id";
    var p = {
      id : id,
      networkId : networkId,
      name : name,
      command : command,
      active : active
    }
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    util.publish( topics.NETWORK_CHANGE, [ networkId ] );
  }

  _mnp.remPerform = function ( id, networkId ) {
    var sql = "DELETE FROM performs WHERE id = :id";
    var p = { id : id };
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    util.publish( topics.NETWORK_CHANGE, [ networkId ] );
  }

  _mnp._handleCreateTable = function ( e, tableName ) {
    if ( tableName ) {
      this.model.log( "Created NetworksModel table: "  + tableName );
    }
    if ( this.createTablesList.length ) {
      var args = this.createTablesList.shift( );
      this.model._createTable( args.tableName, args.types, util.hitch( this, "_handleCreateTable", [ args.tableName ], null ) );
    }
  }

  _mnp._handleChange = function ( e ) {
    util.log( "Database changed." );
  }

  dModel.IgnoresModel = function ( model ) {
    this.model = model;
    this.createTables( );
  }

  var _mip = dModel.IgnoresModel.prototype;

  _mip.createTables = function ( ) {
    var st = this.model.SQL_TYPES;
    var types; 
    types = {
      id : [ st.INTEGER, st.PRIMARY_KEY, st.AUTOINCREMENT ].join( " " ),
      regex : st.TEXT,
      active : st.BOOL,
    }
    var tableName = "ignores";
    this.model._createTable( tableName, types, util.hitch( this, "_handleCreateTable", [ tableName ], null ) );
  }

  _mip.addAlias = function ( regex, active ) {
    var sql = "INSERT INTO ignores ( regex, active ) VALUES ( :regex, :active )";
    var p = {
      regex : regex,
      active : active
    }
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
  }

  _mip.editAlias = function ( id, regex, active ) {
    var sql = "UPDATE ignores SET regex = :regex, active = :active WHERE id = :id";
    var p = {
      id : id,
      regex : regex,
      active : active
    }
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
  }

  _mip.remAlias = function ( id ) {
    var sql = "DELETE FROM ignores WHERE id = :id ";
    var p = { id : id };
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
  }

  _mip._handleCreateTable = function ( e, tableName ) {
    this.model.log( "Created NetworksModel table: "  + tableName );
  }

  _mip._handleChange = function ( e ) {
    util.log( "Database changed." );
    util.publish( topics.IGNORES_CHANGE, [ null ] );
  }

  dModel.AliasModel = function ( model ) {
    this.model = model;
    this.createTables( );
  }

  var _map = dModel.AliasModel.prototype;

  _map.createTables = function ( ) {
    var st = this.model.SQL_TYPES;
    var types; 
    types = {
      id : [ st.INTEGER, st.PRIMARY_KEY, st.AUTOINCREMENT ].join( " " ),
      name : st.TEXT,
      command : st.TEXT,
      active : st.BOOL,
      lastUsed : st.INTEGER,
    }
    var tableName = "aliases";
    this.model._createTable( tableName, types, util.hitch( this, "_handleCreateTable", [ tableName ], null ) );
  }

  _map.getAliases = function ( resultsHandler ) {
    var sql = "SELECT * FROM aliases";
    var p = {};
    this.model._executeSQL( sql, air.SQLMode.READ, this.model._getResultHandler( resultsHandler ), p ); 
  }

  _map.addAlias = function ( name, command, active, lastUsed ) {
    var sql = "INSERT INTO aliases ( name, command, active, lastUsed ) " + 
      "VALUES ( :name, :command, :active, :lastUsed )";
    var p = {
      name : name,
      command : command,
      active : active,
      lastUsed : lastUsed
    }
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
  }

  _map.editAlias = function ( id, name, command, active, lastUsed ) {
    var sql = "UPDATE aliases SET name = :name, command = :command, " + 
      "active = :active, lastUsed = :lastUsed WHERE id = :id";
    var p = {
      id : id,
      name : name,
      command : command,
      active : active,
      lastUsed : lastUsed
    }
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
  }

  _map.remAlias = function ( id ) {
    var sql = "DELETE FROM aliases WHERE id = :id ";
    var p = { id : id };
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
  }

  _map._handleCreateTable = function ( e, tableName ) {
    this.model.log( "Created NetworksModel table: "  + tableName );
  }

  _map._handleChange = function ( e ) {
    util.log( "Database changed." );
    util.publish( topics.ALIAS_CHANGE, [ null ] );
  }

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
      util.publish( topics.PREFS_CHANGE_HISTORY_LENGTH, [ prefs.historyLength ] );
    }
    if ( prefs.autoJoin != this.preferences.autoJoin ) {
      util.publish( topics.PREFS_CHANGE_AUTOJOIN, [ prefs.autoJoin ] );
    }
    if ( prefs.updateDelay != this.preferences.updateDelay ) {
      util.publish( topics.UPDATE_DELAY_CHANGE, [ prefs.updateDelay ] );
    }
    if ( prefs.updateURL != this.preferences.updateURL ) {
      util.publish( topics.UPDATE_URL_CHANGE, [ prefs.updateURL ] );
    }
    util.publish( topics.PREFS_CHANGE_FONT, [ prefs.multiOptionPrefs.font, prefs.fontSize ] );
    util.publish( topics.PREFS_CHANGE_TIME_FORMAT, [ prefs.multiOptionPrefs.time ] );
    util.publish( topics.PREFS_CHANGE_THEME, [ prefs.multiOptionPrefs.theme ] );
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

}



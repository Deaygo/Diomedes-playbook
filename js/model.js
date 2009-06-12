/*
  Copyright (c) 2009 Apphacker apphacker@gmail.com
*/

var model;

if(!model) {
  model = {};
}

if ( window.runtime && air && util ) {
  //requires AIR and util

  model.Model = function ( ) {
    this.SQL_TYPES = {
      "INTEGER" : "INTEGER",
      "TEXT" : "TEXT",
      "BOOL" : "BOOLEAN",
      "PRIMARY_KEY" : "PRIMARY KEY",
      "AUTOINCREMENT" : "AUTOINCREMENT",
    };
    this.statement = null;
    this.DATABASE_NAME = "diomedesModel.db";
    this.prefs = new model.PrefModel( this );
    this.aliases = new model.AliasModel( this );
    this.networks = new model.NetworksModel( this );
    this.conn = null;
    this.connLocked = false;
  }

  var _mmp = model.Model.prototype;

  _mmp._openSQLConn = function ( type, openHandler, errorHandler ) {
    this.log( "Opening SQL connection..." );
    if ( !openHandler || !type ) {
      this.log( "Required params missing for _openSQLConn" );
      return;
    }
    if ( !errorHandler ) errorHandler = util.hitch( this, "_handleError", [ "openSQLConnection" ] );
    if ( this.conn ) this.closeConnection( );
    this.conn = new air.SQLConnection( ); 
    this.conn.addEventListener( air.SQLEvent.OPEN, openHandler ); 
    this.conn.addEventListener( air.SQLErrorEvent.ERROR, errorHandler ); 
    var dbFile = air.File.applicationStorageDirectory.resolvePath( this.DATABASE_NAME ); 
    this.conn.openAsync( dbFile ); 
  }

  _mmp._executeSQL = function ( sql, type, resultsHandler, parameters, errorHandler ) {
    this.log( "Executing SQL statement..." );
    if ( !sql || !type || !resultsHandler ) {
      this.log( "Required params missing for _executeSQL" );
      return;
    }
    if ( !errorHandler ) errorHandler = util.hitch( this, "_handleError", [ "SQL: " + sql ] );
    if ( !this.conn || !this.conn.connected ) { 
      this.log( "Connection not open when calling _executeSQL, opening it");
      this._openSQLConn( type, util.hitch( this, "_reExecuteSQL", [ sql, type, resultsHandler, errorHandler ] ), errorHandler );
      return;
    }
    if ( this.connLocked ) {
      util.log( "Connection locked.");
      window.setTimeout( util.hitch( this, "_executeSQL", [ sql, type, resultsHandler, parameters, errorHandler ] ), 1 );
      return;
    } 
    util.log("executing begins");
    this.connLocked = true;
    var s = new air.SQLStatement( ); 
    s.sqlConnection = this.conn; 
    s.text = sql; 
    if ( parameters ) {
      for ( var i in parameters ) {
        if ( parameters.hasOwnProperty( i ) ) {
          s.parameters[ i ] = parameters[ i ];
        }
      }
    }
    s.addEventListener( air.SQLEvent.RESULT, util.hitch( this, "_statementResultHandler", [ resultsHandler ] ) ); 
    s.addEventListener( air.SQLErrorEvent.ERROR, util.hitch( this, "_statementResultHandler", [ errorHandler ] ) ); 
    s.execute( ); 
    this.statement = s ;
  }

  _mmp._reExecuteSQL = function ( e, sql, type, resultsHandler, parameters, errorHandler ) {
    this.log( "Re-excuting sql." );
    this._executeSQL( sql, type, resultsHandler, parameters, errorHandler );
  }

  _mmp._statementResultHandler = function ( e, resultsHandler ) {
    this.log( "Handling statement completion." );
    var result = this.statement.getResult( );
    delete this.statement;
    this.statement = null;
    this.closeConnection( );
    this.connLocked = false;
    resultsHandler( e, result );
  }

  _mmp._getResult = function ( e, result, resultsHandler ) {
    resultsHandler( result.data );
  }

  _mmp._getResultHandler = function ( resultsHandler ) {
    return util.hitch( this, "_getFilterResult", [ resultsHandler ] );
  }

  _mmp._createTable = function ( name, types, resultsHandler, parameters, errorHandler ) {
    util.log("createTable mmp");
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
    util.log("error");
    this.log("Error message:", e.error.message); 
    this.log("Details:", e.error.details); 
  }

  _mmp.log = function ( msg ) {
    util.log("\nSQL LOG: " + msg );
  }

  _mmp.closeConnection = function ( ) {
    util.log("close connection");
    if ( this.conn && this.conn.connected ) {
      this.conn.close( );
    }
    this.conn = null;
  }

  model.NetworksModel = function ( model ) {
    util.log("NetworksModel");
    this.model = model;
    //check to see if tables exists by attempting to create them
    this.createTables( );
  }

  var _mnp = model.NetworksModel.prototype;

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
    var tableName = "networks";
    this.model._createTable( tableName, types, util.hitch( this, "_handleCreateTable", [ tableName ], null ) );
    types = {
      id : [ st.INTEGER, st.PRIMARY_KEY, st.AUTOINCREMENT ].join( " " ),
      networkId : st.INTEGER,
      name : st.TEXT,
      lastConnected : st.INTEGER,
      active : st.BOOL,
    }
    tableName = "servers";
    this.model._createTable( tableName, types, util.hitch( this, "_handleCreateTable", [ tableName ], null ) );
    types = {
      id : [ st.INTEGER, st.PRIMARY_KEY, st.AUTOINCREMENT ].join( " " ),
      networkId : st.INTEGER,
      name : st.TEXT,
      lastConnected : st.INTEGER,
      autoJoin : st.BOOL,
    }
    tableName = "channels";
    this.model._createTable( tableName, types, util.hitch( this, "_handleCreateTable", [ tableName ], null ) );
    types = {
      id : [ st.INTEGER, st.PRIMARY_KEY, st.AUTOINCREMENT ].join( " " ),
      networkId : st.INTEGER,
      name : st.TEXT,
      command : st.TEXT,
      active : st.BOOL,
    }
    tableName = "performs";
    this.model._createTable( tableName, types, util.hitch( this, "_handleCreateTable", [ tableName ], null ) );
  }

  _mnp.getNetworks = function ( resultsHandler ) {
    var sql = "SELECT * FROM networks";
    var p = {};
    this.model._executeSQL( sql, air.SQLMode.READ, this.model._getResultHandler( resultsHandler ), p ); 
  }

  _mnp.addNetwork = function ( name, nick, altNick, userName, realName, finger, autoJoin, active ) {
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
  }

  _mnp.editNetwork = function ( id, name, nick, altNick, userName, realName, finger, autoJoin, active ) {
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
  }

  _mnp.remNetwork = function ( id ) {
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
    //rem servers, channels and performs too
  }

  _mnp.getServers = function ( networkId, resultsHandler ) {
    var sql = "SELECT * FROM servers WHERE networkId = :networkId";
    var p = { networkId : networkId };
    this.model._executeSQL( sql, air.SQLMode.READ, this.model._getResultHandler( resultsHandler ), p ); 
  }

  _mnp.addServer = function ( networkId, name, autoJoin, active ) {
    var sql = "INSERT INTO servers ( networkId, name, autoJoin, active ) " +
      "Values ( :networkId, :name, :autoJoin, :active )";
    var p = {
      networkId : networkId,
      name : name,
      autoJoin : autoJoin,
      active : active,
    }
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
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
  }

  _mnp.remServer = function ( id ) {
    var sql = "DELETE FROM servers WHERE id = :id";
    var p = { id : id };
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
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
  }

  _mnp.remChannel = function ( id ) {
    var sql = "DELETE FROM channels WHERE id = :id";
    p = { id : id };
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
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
  }

  _mnp.remPerform = function ( id ) {
    var sql = "DELETE FROM performs WHERE id = :id";
    var p = { id : id };
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
  }

  _mnp._handleCreateTable = function ( e, tableName ) {
    this.model.log( "Created NetworksModel table: "  + tableName );
  }

  _mnp._handleChange = function ( e ) {
    util.log( "Database changed." );
  }

  model.AliasModel = function ( model ) {
    this.model = model;
    this.createTables( );
  }

  var _map = model.AliasModel.prototype;

  _map.createTables = function ( ) {
    util.log("createtables begn");
    var st = this.model.SQL_TYPES;
    this.model.log("moo");  
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
    util.log("createtables end");
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
  }

  model.PrefModel = function ( model ) {
    this.model = model;
    this.fileName = "preferences.xml";
    this.preferences = {};
    //Current Prefs:
    //nick
    //altNick
    //username
    //realName
    //finger
    //historyLength
    //theme
    //pollTime (for auto-reconnect)
    //font
    //fontSize
  }

  var _mpp = model.PrefModel.prototype;

  _mpp.getFile = function ( ) {
    return air.File.applicationDirectory.resolvePath( this.fileName );
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

  _mpp.getPrefs = function ( ) {
    //need to hard code defaults into here in case user destroys 
    //xml file and app stops working (so if read fails recreate the prefs file)
    var fileStream = new air.FileStream( ); 
    fileStream.open( this.getFile( ), air.FileMode.READ ); 
    var p = fileStream.readUTFBytes( fileStream.bytesAvailable );
    fileStream.close( );
    var domParser = new DOMParser( );
    var d = domParser.parseFromString( p , "text/xml" );
    //get prefs
    var pNodes = d.getElementsByTagName( "preference" );
    this.preferences = {};
    for ( var i = 0; i < pNodes.length; i++ ) {
      var pNode = pNodes[ i ];
      var name = pNode.getAttribute( "name" );
      var value = pNode.getAttribute( "value" );
      //0's and empty strings are valid values
      if ( name && ( value || value === 0 || value === "" ) ) {
        this.preferences[ name ] = value;
      }
    }
    //clean up
    delete fileStream;
    delete domParser
  }

  _mpp.savePrefs = function ( ) {
    var fileStream = new air.FileStream( ); 
    fileStream.open( this.getFile( ), air.FileMode.WRITE ); //WRITE truncates
    var d = document.implementation.createDocument( "", "preferences", null );
    //add prefs
    for ( var name in this.preferences ) {
      if ( this.preferences.hasOwnProperty( name ) ) {
        var value = this.preferences[ name ];
        var p = d.createElement("preference"); 
        //0's and empty strings are valid values
        if ( name && ( value || value === 0 || value === "" ) ) {
          p.setAttribute( "name", name );
          p.setAttribute( "value", value );
        } 
        d.firstChild.appendChild( p );
      }
    }
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



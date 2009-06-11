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

  _mmp._executeSQL = function ( sql, type, resultHandler, errorHandler ) {
    this.log( "Executing SQL statement..." );
    if ( !sql || !type || !resultHandler ) {
      this.log( "Required params missing for _executeSQL" );
      return;
    }
    if ( !errorHandler ) errorHandler = util.hitch( this, "_handleError", [ "SQL: " + sql ] );
    if ( !this.conn || !this.conn.connected ) { 
      this.log( "Connection not open when calling _executeSQL, opening it");
      this._openSQLConn( type, util.hitch( this, "_reExecuteSQL", [ sql, type, resultHandler, errorHandler ] ), errorHandler );
      return;
    }
    if ( this.connLocked ) {
      util.log( "Connection locked.");
      window.setTimeout( util.hitch( this, "_executeSQL", [ sql, type, resultHandler, errorHandler ] ), 1 );
      return;
    } 
    util.log("executing begins");
    this.connLocked = true;
    var s = new air.SQLStatement( ); 
    s.sqlConnection = this.conn; 
    s.text = sql; 
    s.addEventListener( air.SQLEvent.RESULT, util.hitch( this, "_statementResultHandler", [ resultHandler ] ) ); 
    s.addEventListener( air.SQLErrorEvent.ERROR, util.hitch( this, "_statementResultHandler", [ errorHandler ] ) ); 
    s.execute( ); 
    this.statement = s ;
  }

  _mmp._reExecuteSQL = function ( e, sql, type, resultHandler, errorHandler ) {
    this.log( "Re-excuting sql." );
    this._executeSQL( sql, type, resultHandler, errorHandler );
  }

  _mmp._statementResultHandler = function ( e, resultHandler ) {
    this.log( "Handling statement completion." );
    var result = this.statement.getResult( );
    delete this.statement;
    this.statement = null;
    this.closeConnection( );
    this.connLocked = false;
    resultHandler( e, result );
  }

  _mmp._createTable = function ( name, types, resultHandler, errorHandler ) {
    util.log("createTable mmp");
    var sql = [];
    sql = sql.concat( [ "CREATE TABLE IF NOT EXISTS ", name, " (" ] );  
    for ( var name in types ) {
      sql.push( [ name, types[ name ] ].join( " " ) );
      sql.push( ", ");
    }
    sql.pop( ); //get rid of last comma
    sql.push( ")" );
    this._executeSQL( sql.join( "" ), air.SQLMode.CREATE, resultHandler, errorHandler );
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
      autojoin : st.BOOL,
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
      autojoin : st.BOOL,
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

  _mnp.getNetworks = function ( ) {
  }

  _mnp.addNetwork = function ( name, nick, altNick, userName, realName, finger, autojoin, active ) {
  }

  _mnp.editNetwork = function ( name, nick, altNick, userName, realName, finger, autojoin, active ) {
  }

 _mnp.remNetwork = function ( name ) {
   //rem servers, channels and performs too
 }

 _mnp.getServers = function ( networkName ) {
 }

 _mnp.addServer = function ( networkName, serverName, autojoin, active ) {
 }

 _mnp.editServer = function ( networkName, serverName, autojoin, active ) {
 }

 _mnp.remServer = function ( networkName, serverName ) {
 }

 _mnp.getChannels = function ( networkName ) {
 }

 _mnp.addChannel = function ( networkName, channelName, autojoin ) {
 }

 _mnp.remChannel = function ( networkName, channelName ) {
 }

 _mnp.getPerforms = function (networkName ) {
 }

 _mnp.addPerform = function ( networkName, performName, command, active ) {
   //XXX: maybe use default names such as performX where X is a number
   //so as to not force people to think up a name for each perform
 }

 _mnp.editPerform = function ( networkName, performName, command, active ) {
 }

 _mnp.remPerform = function ( networkName, performName ) {
 }

  _mnp._handleCreateTable = function ( e, tableName ) {
    this.model.log( "Created NetworksModel table: "  + tableName );
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

  _map.addAlias = function ( name, command, active ) {
  }

  _map.editAlias = function ( name, command, active ) {
  }

  _map.remAlias = function ( name ) {
  }

  _map.getAliases = function ( ) {
  }

  _map._handleCreateTable = function ( e, tableName ) {
    this.model.log( "Created NetworksModel table: "  + tableName );
  }


  model.PrefModel = function ( model ) {
    this.model = model;
    //use xml file
    //theme name
    //history length
    //poll time (for auto-reconnect)
    //font type
    //font size
  }

  var _mpp = model.PrefModel.prototype;

}


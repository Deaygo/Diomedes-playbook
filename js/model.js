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
    this.DATABASE_NAME = "diomedesModel.db";
    this.prefs = new model.PrefModel( this );
    this.aliases = new model.AliasModel( this );
    this.performs = new model.PerformModel( this );
    this.networks = new model.NetworksModel( this );
    this.conn = null;
    this.statements = [];
  }

  var _mmp = model.Model.prototype;

  _mmp._openSQLConn = function ( type, openHandler, errorHandler ) {
    this.log( "Opening SQL connection..." );
    if ( !openHandler || !type ) {
      this.log( "Required params missing for _openSQLConn" );
      return;
    }
    if ( !errorHandler ) errorHandler = util.hitch( this, "handleError" );
    if ( this.conn ) this.closeConnection( );
    this.conn = new air.SQLConnection( ); 
    conn.addEventListener( air.SQLEvent.OPEN, openHandler ); 
    conn.addEventListener( air.SQLErrorEvent.ERROR, errorHandler ); 
    var dbFile = air.File.applicationStorageDirectory.resolvePath( this.DATABASE_NAME ); 
    conn.openAsync( dbFile ); 
  }

  _mmp._executeSQL = function ( sql, type, resultHandler, errorHandler ) {
    this.log( "Executing SQL statement..." );
    if ( !sql || !type || !resultHandler ) {
      this.log( "Required params missing for _executeSQL" );
      return;
    }
    if ( !errorHandler ) errorHandler = util.hitch( this, "handleError" );
    if ( !this.conn ) { 
      this.log( "Connection not open when calling _executeSQL, opening it");
      this._openSQLConn( type, util.hitch( this, "_reExecuteSQL" [ sql, type, resultHandler, errorHandler ] ), errorHandler );
      return;
    }
    var s = new air.SQLStatement( ); 
    s.sqlConnection = this.conn; 
    s.text = sql; 
    s.addEventListener( air.SQLEvent.RESULT, util.hitch( this, "_statementResultHandler", [ resultHandler ] ) ); 
    s.addEventListener( air.SQLErrorEvent.ERROR, util.hitch( this, "_statementResultHandler", [ errorHandler ] ) ); 
    s.execute( ); 
    this.statements.push( s );
  }

  _mmp._reExecuteSQL = function ( e, sql, type, resultHandler, errorHandler ) {
    this.log( "Re-excuting sql." );
    this._executeSQL( sql, type, resultHandler, errorHandler );
  }

  _mmp._statementResultHandler = function ( e, resultHandler ) {
    this.log( "Handling statement completion." );
    var s = this.statements.shift( );
    delete s;
    if ( !this.statements.length ) {
      this.closeConnection( );
    }
    resultHandler( e );
  }

  _mmp._handleError = function ( e ) {
    this.log("Error message:", e.error.message); 
    this.log("Details:", e.error.details); 
  }

  _mmp.log = function ( msg ) {
    util.log("\nSQL LOG: " + msg );
  }

  _mmp.closeConnection = function ( ) {
    if ( this.conn && this.conn.connected ) {
      this.conn.close( );
    }
    this.conn = null;
  }

  model.NetworksModel = function ( model ) {
    this.model = model;
    //check to see if tables exists by attempting to create them
    this.createTables( );
  }

  var _mnp = model.NetworksModel.prototype;

  _mnp.createTables = function ( e ) {
    // Table: servers
    // Columns: 
    //   id autoincrement integer primary key
    //   networkId integer
    //   name
    //   lastConnected integer
    //   active integer
    //
    // Table: channels
    // Columns:
    //   id autoincrement integer primary key
    //   networkId integer
    //   name text
    //   lastConnected integer
    //   autojoin integer
    //
    // Table: perform
    // Columns:
    //   id autoincrement integer primary key
    //   networkid
    //   name
    //   command
    //   active
    var tableName = "networks";
    var sql = [].concat( [
    "CREATE TABLE IF NOT EXISTS ", employees, " (",   
    "    id INTEGER PRIMARY KEY AUTOINCREMENT, ",
    "    name TEXT, ",
    "    nick TEXT, ",
    "    altNick TEXT, ",
    "    userName TEXT, ",
    "    realName TEXT, ",
    "    password TEXT, ",
    "    finger TEXT, ",
    "    active BOOLEAN, ",
    "    autojoin BOOLEAN, ",
    "    lastConnected INTEGER, ",
    ")"
    ] ); 
    var type = air.SQLMode.CREATE;
    this.model._executeSQL = function ( sql, type, util.hitch( this, "_handleCreateTable", [ tableName ] );
  }

  _mnp.handleCreateTable = function ( e, tableName ) {
    this.model.log( "Created NetworksModel table: "  + tableName );
  }

  model.AliasModel = function ( model ) {
    this.model = model;
    //check to see if table exists
    // Table: aliases
    // Columns: 
    //   id autoincrement integer primary key
    //   name text
    //   command text
    //   active integer
  }

  var _map = model.AliasModel.prototype;

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


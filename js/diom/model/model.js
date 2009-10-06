/*
  Copyright (c) 2009 Apphacker apphacker@gmail.com
*/

dojo.provide( "diom.model.model" );

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

}



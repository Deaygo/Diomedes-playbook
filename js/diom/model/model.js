/*
  Copyright (c) 2009 Apphacker apphacker@gmail.com
*/
/*jslint white: false */
/*jslint nomen: false */
/*jslint regexp: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, air, document, alert */

dojo.provide( "diom.model.model" );

dojo.declare( "diom.model.Model", null, {

  constructor: function ( ) {
    this.SQL_TYPES = {
      "INTEGER" : "INTEGER",
      "TEXT" : "TEXT",
      "BOOL" : "BOOLEAN",
      "PRIMARY_KEY" : "PRIMARY KEY",
      "AUTOINCREMENT" : "AUTOINCREMENT"
    };
    this.statement = null;
    this.DATABASE_NAME = "diomedesModel.db";
    this.prefs = new diom.model.PrefModel( this );
    this.aliases = new diom.model.AliasModel( this );
    this.networks = new diom.model.NetworksModel( this );
    this.ignores = new diom.model.IgnoresModel( this );
    this.conn = null;
  },

  _openSQLConn: function ( type, errorHandler ) {
		var dbFile;
    this.log( "Opening SQL connection..." );
    if ( !type ) {
      this.log( "Required params missing for _openSQLConn" );
      return;
    }
    if ( !errorHandler ) {
			errorHandler = util.hitch( this, "_handleError", [ "openSQLConnection" ] );
		}
    if ( this.conn ) { this.closeConnection( ); }
    this.conn = new air.SQLConnection( ); 
    dbFile = air.File.applicationStorageDirectory.resolvePath( this.DATABASE_NAME ); 
    try {
      this.conn.open( dbFile, type ); 
    } catch ( error ) {
      errorHandler( error );
    }
  },

  _executeSQL: function ( sql, type, resultsHandler, parameters, errorHandler, isRexecution ) {
		var s, i;
    this.log( "Executing SQL statement... sql: " + sql );
    if ( !sql || !type || !resultsHandler ) {
      this.log( "Required params missing for _executeSQL" );
      return;
    }
    if ( !errorHandler ) {
			errorHandler = util.hitch( this, "_handleError", [ "SQL: " + sql ] );
		}
    if ( !this.conn || !this.conn.connected ) { 
      this.log( "Connection not open when calling _executeSQL, opening it");
      this._openSQLConn( type, errorHandler );
    }
    s = new air.SQLStatement( ); 
    s.sqlConnection = this.conn; 
    this.statement = s;
    this.log( "executing sql: " + sql );
    s.text = sql; 
    if ( parameters ) {
      for ( i in parameters ) {
        if ( parameters.hasOwnProperty( i ) && i !== "prototype" ) {
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
  },

  _statementResultHandler: function ( e, resultsHandler ) {
		var result;
    this.log( "Handling statement completion" );
    result = this.statement.getResult( );
    this.log("deleting statement with sql of: " + this.statement.text );
    delete this.statement;
    this.statement = null;
    this.closeConnection( );
    resultsHandler( e, result );
  },

  _getResult: function ( e, result, resultsHandler ) {
    resultsHandler( result.data );
  },

  _getFilterResult: function ( e, results, resultsHandler ) {
    //filters the event, and returns just the data;
    resultsHandler( results.data );
  },

  _getResultHandler: function ( resultsHandler ) {
    return util.hitch( this, "_getFilterResult", [ resultsHandler ] );
  },

  _createTable: function ( name, types, resultsHandler, parameters, errorHandler ) {
		var sql, typeNames;
    this.log("Creating Table.");
    sql = [];
    sql = sql.concat( [ "CREATE TABLE IF NOT EXISTS ", name, " (" ] );  
    for ( typeNames in types ) {
			if ( types.hasOwnProperty( typeNames ) ) {
				sql.push( [ name, types[ name ] ].join( " " ) );
				sql.push( ", ");
			}
    }
    sql.pop( ); //get rid of last comma
    sql.push( ")" );
    this._executeSQL( sql.join( "" ), air.SQLMode.CREATE, resultsHandler, parameters, errorHandler );
  },

  _handleError: function ( e, msg ) {
    this.log("error: " + e);
    this.log("message: " + msg );
    this.log("Error message:", e.error.message); 
    this.log("Details:", e.error.details); 
  },

  log: function ( msg ) {
    util.log("\nSQL LOG: " + msg );
  },

  closeConnection: function ( ) {
    this.log("close connection");
    if ( this.conn && this.conn.connected ) {
      this.conn.close( );
    }
    this.conn = null;
  }

} );



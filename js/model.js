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
  }

  var _mmp = model.Model.prototype;

  _mmp._openSQLCon = function ( type, openHandler, errorHandler ) {
    if ( !openHandler || !type ) return;
    if ( !errorHandler ) errorHandler = util.hitch( this, "handleError" );
    if ( this.conn ) this.closeConnection( );
    this.conn = new air.SQLConnection( ); 
    conn.addEventListener( air.SQLEvent.OPEN, openHandler ); 
    conn.addEventListener( air.SQLErrorEvent.ERROR, errorHandler ); 
    var dbFile = air.File.applicationStorageDirectory.resolvePath( this.DATABASE_NAME ); 
    conn.openAsync( dbFile ); 
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
    //check to see if tables exists
    // Table: networks
    // Columns: 
    //   id autoincrement integer primary key
    //   name text
    //   nick text
    //   altNick text
    //   username text
    //   real name text
    //   password text
    //   finger text
    //   active integer
    //   autojoin integer
    //   lastConnected integer
    //
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
  }

  var _mnp = model.NetworksModel.prototype;

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


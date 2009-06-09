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
    //check to see if database exists
    this.prefs = new model.PrefModel( );
    this.aliases = new model.AliasModel( );
    this.performs = new model.PerformModel( );
    this.networks = new model.NetworksModel( );
  }

  var _mmp = model.Model.prototype;

  model.NetworksModel = function ( ) {
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

  model.AliasModel = function ( ) {
    //check to see if table exists
    // Table: aliases
    // Columns: 
    //   id autoincrement integer primary key
    //   name text
    //   command text
    //   active integer
  }

  var _map = model.AliasModel.prototype;

  model.PrefModel = function ( ) {
    //use xml file
    //theme name
    //history length
    //poll time (for auto-reconnect)
    //font type
    //font size
  }

  var _mpp = model.PrefModel.prototype;

}


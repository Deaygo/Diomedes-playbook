
dojo.provide( "diom.model.aliasModel" );

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
    util.publish( diom.topics.ALIAS_CHANGE, [ null ] );
  }


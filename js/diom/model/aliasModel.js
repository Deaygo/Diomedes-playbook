/*jslint white: false */
/*jslint nomen: false */
/*jslint regexp: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, air, document, alert, DOMParser, XMLSerializer */

dojo.provide( "diom.model.aliasModel" );

dojo.declare( "diom.model.AliasModel", null, {

  constructor: function ( model ) {
    this.model = model;
    this.createTables( );
  },

  createTables: function ( ) {
		var st, types, tableName;
    st = this.model.SQL_TYPES;
    types = {
      id : [ st.INTEGER, st.PRIMARY_KEY, st.AUTOINCREMENT ].join( " " ),
      name : st.TEXT,
      command : st.TEXT,
      active : st.BOOL,
      lastUsed : st.INTEGER
    };
    tableName = "aliases";
    this.model._createTable( tableName, types, dojo.hitch( this, "_handleCreateTable", [ tableName ], null ) );
  },

  getAliases: function ( resultsHandler ) {
		var sql, p;
    sql = "SELECT * FROM aliases";
    p = {};
    this.model._executeSQL( sql, air.SQLMode.READ, this.model._getResultHandler( resultsHandler ), p ); 
  },

  addAlias: function ( name, command, active, lastUsed ) {
		var sql, p;
    sql = "INSERT INTO aliases ( name, command, active, lastUsed ) " + 
      "VALUES ( :name, :command, :active, :lastUsed )";
    p = {
      name : name,
      command : command,
      active : active,
      lastUsed : lastUsed
    };
    this.model._executeSQL( sql, air.SQLMode.UPDATE, dojo.hitch( this, "_handleChange" ), p ); 
  },

  editAlias: function ( id, name, command, active, lastUsed ) {
		var sql, p;
    sql = "UPDATE aliases SET name = :name, command = :command, " + 
      "active = :active, lastUsed = :lastUsed WHERE id = :id";
    p = {
      id : id,
      name : name,
      command : command,
      active : active,
      lastUsed : lastUsed
    };
    this.model._executeSQL( sql, air.SQLMode.UPDATE, dojo.hitch( this, "_handleChange" ), p ); 
  },

  remAlias: function ( id ) {
		var sql, p;
    sql = "DELETE FROM aliases WHERE id = :id ";
    p = { id : id };
    this.model._executeSQL( sql, air.SQLMode.UPDATE, dojo.hitch( this, "_handleChange" ), p ); 
  },

  _handleCreateTable: function ( e, tableName ) {
    this.model.log( "Created NetworksModel table: "  + tableName );
  },

  _handleChange: function ( e ) {
    util.log( "Database changed." );
    dojo.publish( diom.topics.ALIAS_CHANGE, [ null ] );
  }

} );

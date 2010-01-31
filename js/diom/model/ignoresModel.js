/*jslint white: false */
/*jslint nomen: false */
/*jslint regexp: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, air, document, DOMParser, XMLSerializer */

dojo.provide( "diom.model.ignoresModel" );

dojo.declare( "diom.model.IgnoresModel", null, {

  constructor: function ( model, isCurrent ) {
    this.model = model;
    if ( !isCurrent ) {
      this.createTables( );
    }
  },

  createTables: function ( ) {
		var st, types, tableName;
    st = this.model.SQL_TYPES;
    types = {
      id : [ st.INTEGER, st.PRIMARY_KEY, st.AUTOINCREMENT ].join( " " ),
      regex : st.TEXT,
      active : st.BOOL
    };
    tableName = "ignores";
    this.model._createTable( tableName, types, dojo.hitch( this, "_handleCreateTable", [ tableName ], null ) );
  },

  getIgnores: function ( resultsHandler ) {
		var sql, p;
    sql = "SELECT * FROM ignores";
    p = {};
    this.model._executeSQL( sql, air.SQLMode.READ, this.model._getResultHandler( resultsHandler ), p );
  },

  addIgnore: function ( regex, active ) {
		var sql, p;
    sql = "INSERT INTO ignores ( regex, active ) VALUES ( :regex, :active )";
    p = {
      regex : regex,
      active : active
    };
    this.model._executeSQL( sql, air.SQLMode.UPDATE, dojo.hitch( this, "_handleChange" ), p );
  },

  editIgnore: function ( id, regex, active ) {
		var sql, p;
    sql = "UPDATE ignores SET regex = :regex, active = :active WHERE id = :id";
    p = {
      id : id,
      regex : regex,
      active : active
    };
    this.model._executeSQL( sql, air.SQLMode.UPDATE, dojo.hitch( this, "_handleChange" ), p );
  },

  remIgnore: function ( id ) {
		var sql, p;
    sql = "DELETE FROM ignores WHERE id = :id ";
    p = { id : id };
    this.model._executeSQL( sql, air.SQLMode.UPDATE, dojo.hitch( this, "_handleChange" ), p );
  },

  _handleCreateTable: function ( e, tableName ) {
    this.model.log( "Created NetworksModel table: "  + tableName );
  },

  _handleChange: function ( e ) {
    util.log( "Database changed." );
    dojo.publish( diom.topics.IGNORES_CHANGE, [ null ] );
  }

} );

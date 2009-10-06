
dojo.provide( "diom.model.ignoresModel" );

  dModel.IgnoresModel = function ( model ) {
    this.model = model;
    this.createTables( );
  }

  var _mip = dModel.IgnoresModel.prototype;

  _mip.createTables = function ( ) {
    var st = this.model.SQL_TYPES;
    var types; 
    types = {
      id : [ st.INTEGER, st.PRIMARY_KEY, st.AUTOINCREMENT ].join( " " ),
      regex : st.TEXT,
      active : st.BOOL,
    }
    var tableName = "ignores";
    this.model._createTable( tableName, types, util.hitch( this, "_handleCreateTable", [ tableName ], null ) );
  }

  _mip.getIgnores = function ( resultsHandler ) {
    var sql = "SELECT * FROM ignores";
    var p = {};
    this.model._executeSQL( sql, air.SQLMode.READ, this.model._getResultHandler( resultsHandler ), p ); 
  }

  _mip.addIgnore = function ( regex, active ) {
    var sql = "INSERT INTO ignores ( regex, active ) VALUES ( :regex, :active )";
    var p = {
      regex : regex,
      active : active
    }
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
  }

  _mip.editIgnore = function ( id, regex, active ) {
    var sql = "UPDATE ignores SET regex = :regex, active = :active WHERE id = :id";
    var p = {
      id : id,
      regex : regex,
      active : active
    }
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
  }

  _mip.remIgnore = function ( id ) {
    var sql = "DELETE FROM ignores WHERE id = :id ";
    var p = { id : id };
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
  }

  _mip._handleCreateTable = function ( e, tableName ) {
    this.model.log( "Created NetworksModel table: "  + tableName );
  }

  _mip._handleChange = function ( e ) {
    util.log( "Database changed." );
    util.publish( diom.topics.IGNORES_CHANGE, [ null ] );
  }


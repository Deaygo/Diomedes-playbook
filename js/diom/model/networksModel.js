
dojo.provide( "diom.model.networksModel" );

  dModel.NetworksModel = function ( model ) {
    util.log("NetworksModel");
    this.model = model;
    this.createTablesList = [];
    //check to see if tables exists by attempting to create them
    this.createTables( );
  }

  var _mnp = dModel.NetworksModel.prototype;

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
      autoJoin : st.BOOL,
      lastConnected : st.INTEGER,
    }
    util.log("creating networks");
    var tableName = "networks";
    this.createTablesList.push( { tableName : tableName, types : types } );
    types = {
      id : [ st.INTEGER, st.PRIMARY_KEY, st.AUTOINCREMENT ].join( " " ),
      networkId : st.INTEGER,
      name : st.TEXT,
      lastConnected : st.INTEGER,
      active : st.BOOL,
    }
    util.log("creating servers");
    tableName = "servers";
    this.createTablesList.push( { tableName : tableName, types : types } );
    types = {
      id : [ st.INTEGER, st.PRIMARY_KEY, st.AUTOINCREMENT ].join( " " ),
      networkId : st.INTEGER,
      name : st.TEXT,
      lastConnected : st.INTEGER,
      autoJoin : st.BOOL,
    }
    util.log("creating channels");
    tableName = "channels";
    this.createTablesList.push( { tableName : tableName, types : types } );
    types = {
      id : [ st.INTEGER, st.PRIMARY_KEY, st.AUTOINCREMENT ].join( " " ),
      networkId : st.INTEGER,
      name : st.TEXT,
      command : st.TEXT,
      active : st.BOOL,
    }
    util.log("creating preforms");
    tableName = "performs";
    this.createTablesList.push( { tableName : tableName, types : types } );
    this._handleCreateTable( );
  }

  _mnp.getNetworks = function ( resultsHandler ) {
    util.log("getNetworks");
    var sql = "SELECT * FROM networks";
    var p = {};
    this.model._executeSQL( sql, air.SQLMode.READ, this.model._getResultHandler( resultsHandler ), p ); 
  }

  _mnp.addNetwork = function ( name, nick, altNick, userName, realName, finger, autoJoin, active ) {
    util.log("adding network.");
    var sql = "INSERT INTO networks ( name, nick, altNick, userName, realName, finger, autoJoin, active ) " +
      "Values ( :name, :nick, :altNick, :userName, :realName, :finger, :autoJoin, :active )";
    var p = {
      name : name, 
      nick : nick,
      altNick : altNick, 
      userName : userName, 
      realName : realName, 
      finger: finger, 
      autoJoin : autoJoin, 
      active : active 
    }
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    util.publish( diom.topics.NETWORK_CHANGE, [ null ] );
  }

  _mnp.editNetwork = function ( id, name, nick, altNick, userName, realName, finger, autoJoin, active ) {
    util.log("Edit network.");
    var sql = "UPDATE networks SET name = :name, nick = :nick, altNick = :altNick, userName = :userName, " + 
      "realName = :realName, finger = :finger, autoJoin = :autoJoin, active = :active  " +
      "WHERE id = :id ";
    var p = {
      id : id,
      name : name, 
      nick : nick,
      altNick : altNick, 
      userName : userName, 
      realName : realName, 
      finger: finger, 
      autoJoin : autoJoin, 
      active : active 
    }
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    util.publish( diom.topics.NETWORK_CHANGE, [ id ] );
  }

  _mnp.remNetwork = function ( id ) {
    util.log("Removing network.");
    var sql;
    var p = { id : id };
    sql = "DELETE FROM networks WHERE id = :id";
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    sql = "DELETE FROM servers WHERE networkId = :id";
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    sql = "DELETE FROM channels WHERE networkId = :id";
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    sql = "DELETE FROM performs WHERE networkId = :id";
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    util.publish( diom.topics.NETWORK_CHANGE, [ null ] );
    //rem servers, channels and performs too
  }

  _mnp.getServers = function ( networkId, resultsHandler ) {
    var sql = "SELECT * FROM servers WHERE networkId = :networkId";
    var p = { networkId : networkId };
    this.model._executeSQL( sql, air.SQLMode.READ, this.model._getResultHandler( resultsHandler ), p ); 
  }

  _mnp.addServer = function ( networkId, name, active ) {
    var sql = "INSERT INTO servers ( networkId, name, active ) " +
      "Values ( :networkId, :name, :active )";
    var p = {
      networkId : networkId,
      name : name,
      active : active,
    }
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    util.publish( diom.topics.NETWORK_CHANGE, [ networkId ] );
  }

  _mnp.editServer = function ( id, networkId, name, autoJoin, active ) {
    var sql = "UPDATE servers SET networkId = :networkId, name = :name, autoJoin = :autoJoin, active = :active " +
      "WHERE id = :id ";
    var p = {
      id : id,
      networkId : networkid,
      name : name, 
      autoJoin : autoJoin, 
      active : active 
    }
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    util.publish( diom.topics.NETWORK_CHANGE, [ networkId ] );
  }

  _mnp.remServer = function ( id, networkId ) {
    var sql = "DELETE FROM servers WHERE id = :id";
    var p = { id : id };
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    util.publish( diom.topics.NETWORK_CHANGE, [ networkId ] );
  }

  _mnp.getChannels = function ( networkId, resultsHandler ) {
    var sql = "SELECT * FROM channels WHERE networkId = :networkId";
    var p = { networkId : networkId };
    this.model._executeSQL( sql, air.SQLMode.READ, this.model._getResultHandler( resultsHandler ), p ); 
  }

  _mnp.addChannel = function ( networkId, name, autoJoin ) {
    var sql = "INSERT INTO channels ( networkId, name, autoJoin ) " +
      "VALUES ( :networkId, :name, :autoJoin )";
    p = { networkId : networkId, name : name, autoJoin : autoJoin };
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    util.publish( diom.topics.NETWORK_CHANGE, [ networkId ] );
  }

  _mnp.remChannel = function ( id, networkId ) {
    var sql = "DELETE FROM channels WHERE id = :id";
    p = { id : id };
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    util.publish( diom.topics.NETWORK_CHANGE, [ networkId ] );
  }

  _mnp.getPerforms = function ( networkId, resultsHandler ) {
    var sql = "SELECT * FROM performs WHERE networkId = :networkId";
    var p = { networkId : networkId };
    this.model._executeSQL( sql, air.SQLMode.READ, this.model._getResultHandler( resultsHandler ), p ); 
  }

  _mnp.addPerform = function ( networkId, name, command, active ) {
    //XXX: maybe use default names such as performX where X is a number
    //so as to not force people to think up a name for each perform
    var sql = "INSERT INTO performs ( networkId, name, command, active ) " + 
      "VALUES ( :networkId, :name, :command, :active )";
    var p = {
      networkId : networkId,
      name : name,
      command : command,
      active : active
    }
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    util.publish( diom.topics.NETWORK_CHANGE, [ networkId ] );
  }

  _mnp.editPerform = function ( id, networkId, name, command, active ) {
    var sql = "UPDATE performs SET networkId = :networkId, name = :name " + 
      "command = :command, active = :active WHERE id = :id";
    var p = {
      id : id,
      networkId : networkId,
      name : name,
      command : command,
      active : active
    }
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    util.publish( diom.topics.NETWORK_CHANGE, [ networkId ] );
  }

  _mnp.remPerform = function ( id, networkId ) {
    var sql = "DELETE FROM performs WHERE id = :id";
    var p = { id : id };
    this.model._executeSQL( sql, air.SQLMode.UPDATE, util.hitch( this, "_handleChange" ), p ); 
    util.publish( diom.topics.NETWORK_CHANGE, [ networkId ] );
  }

  _mnp._handleCreateTable = function ( e, tableName ) {
    if ( tableName ) {
      this.model.log( "Created NetworksModel table: "  + tableName );
    }
    if ( this.createTablesList.length ) {
      var args = this.createTablesList.shift( );
      this.model._createTable( args.tableName, args.types, util.hitch( this, "_handleCreateTable", [ args.tableName ], null ) );
    }
  }

  _mnp._handleChange = function ( e ) {
    util.log( "Database changed." );
  }


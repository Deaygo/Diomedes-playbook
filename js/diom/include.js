/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom */

dojo.provide( "diom.include" );

/*add any dojo.require here */

dojo.require( "diom.irc" );
dojo.require( "diom.logger" );
dojo.require( "diom.topics" );
dojo.require( "diom.network" );
dojo.require( "diom.util" );

//connection
dojo.require( "diom.connection.connection" );
dojo.require( "diom.connection.activityItem" );
dojo.require( "diom.connection.activityList" );
dojo.require( "diom.connection.channel" );
dojo.require( "diom.connection.user" );

//model
dojo.require( "diom.model.model" );
dojo.require( "diom.model.aliasModel" );
dojo.require( "diom.model.ignoresModel" );
dojo.require( "diom.model.networksModel" );
dojo.require( "diom.model.prefModel" );

//view
dojo.require( "diom.view.view" );
dojo.require( "diom.view.formInput" );
dojo.require( "diom.view.activityWindow" );
dojo.require( "diom.view.linkView" );
dojo.require( "diom.view.nickWindow" );

//controller
dojo.require( "diom.controller.controller" );
dojo.require( "diom.controller.channelList" );
dojo.require( "diom.controller.linkInfoFetcher" );
dojo.require( "diom.controller.linkLog" );
dojo.require( "diom.controller.updater" );


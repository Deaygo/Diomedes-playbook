/*
  Copyright (c) 2010 Apphacker apphacker@gmail.com
*/
/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom */

dojo.provide( "diom.include" );

/*add any dojo.require here */

//some kind of dojo build error requires
//setting the first require omitModuleCheck option to true
//otherwise get a load error on product
//order is important too, diom.topics needs to be first
//haven't stepped through it to see what's causing this issue
dojo.require( "diom.topics", true );
dojo.require( "diom.network" );
dojo.require( "diom.util" );
dojo.require( "diom.irc" );
dojo.require( "diom.logger" );

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
dojo.require( "diom.view.dialog" );
dojo.require( "diom.view.help" );
dojo.require( "diom.view.preferences.preferences" );
dojo.require( "diom.view.preferences.networks" );
dojo.require( "diom.view.preferences.servers" );
dojo.require( "diom.view.preferences.channels" );
dojo.require( "diom.view.preferences.performs" );
dojo.require( "diom.view.preferences.aliases" );
dojo.require( "diom.view.preferences.ignores" );

//controller
dojo.require( "diom.controller.controller" );
dojo.require( "diom.controller.channelList" );
dojo.require( "diom.controller.linkInfoFetcher" );
dojo.require( "diom.controller.linkLog" );
dojo.require( "diom.controller.updater" );




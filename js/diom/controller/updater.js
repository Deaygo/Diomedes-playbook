
dojo.provide( "diom.controller.updater" );

  dController.Updater = function ( updateDelay, updateURL ) {
    this.updateURL = updateURL;
    this.appUpdater = new runtime.air.update.ApplicationUpdaterUI( ); 
    this.didCheckNow = false;
    var file = new air.File( "app:/updateConfig.xml" );
    this.appUpdater.configurationFile = file;
    this.appUpdater.updateURL = this.updateURL;
    this.appUpdater.delay = updateDelay;
    this.appUpdater.addEventListener( air.StatusUpdateEvent.UPDATE_STATUS, util.hitch( this, "onStatus" ) ); 
    this.appUpdater.initialize();
    util.subscribe( diom.topics.UPDATE_CHECK, this, "checkNow", [] );
    util.subscribe( diom.topics.UPDATE_DELAY_CHANGE, this, "changeUpdateDelay", [] );
    util.subscribe( diom.topics.UPDATE_URL_CHANGE, this, "changeUpdateURL", [] );
  }

  var _cupr = dController.Updater.prototype;

  _cupr.onStatus = function ( event ) {
    if ( this.didCheckNow && !event.available ) {
      this.didCheckNow = false;
      util.publish( diom.topics.UPDATE_NO_NEW_UPDATES );
    }
  }

  _cupr.changeUpdateURL = function ( updateURL ) {
    this.appUpdater.delay = updateURL;
    this.appUpdater.initialize( );
  }

  _cupr.changeUpdateDelay = function ( updateDelay ) {
    this.appUpdater.delay = updateDelay;
    this.appUpdater.initialize( );
  }

  _cupr.checkNow = function ( ) {
    this.didCheckNow = true;
    this.appUpdater.checkNow( );
  }

  _cupr.destroy = function ( ) {
    delete this.appUpdater;
  }


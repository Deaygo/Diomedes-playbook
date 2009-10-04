
dojo.provide( "diom.connection.activityList" );

  //ActivityList Class
  dConnection.ActivityList = function ( maxItems ) {
    this.messages = [];
    this.maxItems = 500; //XXX: should be a preference
    util.subscribe( topics.PREFS_CHANGE_HISTORY_LENGTH, this, "handleChangeHistoryLength", [] );
  }

  var _cap = dConnection.ActivityList.prototype;

  _cap.handleChangeHistoryLength = function ( newLen ) {
    this.maxItems = newLen;
  }

  _cap.addMessage = function ( msg ) {
    if ( this.messages.length >= this.maxItems ) {
      var t_msg = this.messages.shift( );
      delete t_msg;
    }
    this.messages.push( msg );
    delete msg;
  }

  _cap.clearActivity = function ( ) {
    for ( var i = 0; i < this.messages.length; i++ ) {
      delete this.messages[i];
    }
    this.messages = [];
  }

  _cap.getMessages = function ( ) {
    return this.messages;
  }

  _cap.destroy = function ( ) {
    for ( var i = 0; i < this.messages.length; i++ ) {
      this.messages[ i ].destroy( );
      delete this.messages[ i ];
    }
  }


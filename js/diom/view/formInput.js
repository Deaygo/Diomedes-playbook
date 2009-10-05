
dojo.provide( "diom.view.formInput" );

  dView.FormInput = function ( node, form ) {
    this.MAX_HISTORY_LENGTH = 50;
    this.input = node;
    this.form = form;
    util.connect(this.form, "onsubmit", this, "handleInput");
    util.connect(this.input, "onkeydown", this, "handleInputChange");
    this.nicks = [];
    this.listItemIndex = 0;
    this.input.focus( );
    this.needsResetting = true;
    this.tabFragment = null;
    this.history = [];
    this.historyIndex = 0;
    this.reset( );
    this.channelName = null;
    this.serverName = null;
    this.channels = [];
    util.subscribe( diom.topics.NICK_CHANGE, this, "handleNickChange", [] );
  }

  var _vip = dView.FormInput.prototype;

  _vip.getValue = function ( ) {
    //TODO: add history here and uparrow behavior
    var value = this.input.value;
    this.setValue( "" );
    this.input.focus( );
    return value;
  }

  _vip.setValue = function ( value ) {
    var input = this.input;
    input.value = value;
    window.setTimeout( function ( ) {
      var length = input.value.length;
      input.setSelectionRange(length, length);
    }, 0 );
  }

  _vip.focus = function ( ) {
    this.input.focus( );
  }

  _vip.handleInput = function ( e ) {
    util.stopEvent( e );
    var _input = this.getValue( );
    var inputs = _input.split( "\n" );
    for ( var i = 0; i < inputs.length; i++ ) {
      var input = inputs[ i ];
      this.addToHistory( input );
      util.log("getInput: " + input );
      util.publish( diom.topics.USER_INPUT, [ input ] );
    }
  }

  _vip.addToHistory = function ( input ) {
    this.history.unshift( input );
    if ( this.history.length > this.MAX_HISTORY_LENGTH ) {
      this.history.pop( );
    }
  }

  _vip.changeChannel = function ( nicks, serverName, channelName ) {
    this.serverName = serverName;
    this.channelName = channelName;
    this.nicks = nicks;
  }

  _vip.setChannels = function ( channels ) {
    this.channels = channels;
  }

  _vip.handleNickChange = function ( nicks, serverName, channelName ) {
    if ( serverName == this.serverName && channelName == this.channelName ) {
      this.nicks = nicks;
    }
  }

  _vip.handleInputChange = function ( e ) {
    // window.runtime.flash.display
    var key = e.keyCode;
    if ( key == 9 ) {
      //tab
      this.tabCompletion( e );
      return;
    } else if ( key == 78 && ( e.metaKey || e.ctrlKey ) ) {
      //cntrl+n or command key+n
      util.stopEvent( e );
      util.publish( diom.topics.INPUT_CHANNEL_NEXT );
      return;
    } else if ( key == 39 && e.shiftKey && ( e.metaKey || e.ctrlKey ) ) {
      //cntrl+shift+r arrow or command key+shift+r arrow
      util.stopEvent( e );
      util.publish( diom.topics.INPUT_CHANNEL_NEXT );
      return;
    } else if ( key == 80 && ( e.metaKey || e.ctrlKey ) ) {
      //cntrl+p or command key+p
      util.stopEvent( e );
      util.publish( diom.topics.INPUT_CHANNEL_PREV );
      return;
    } else if ( key == 37 && e.shiftKey && ( e.metaKey || e.ctrlKey ) ) {
      //cntrl+shift+l arrow or command key+shift+l arrow
      util.stopEvent( e );
      util.publish( diom.topics.INPUT_CHANNEL_PREV );
      return;
    } else if ( key == 76 && ( e.metaKey || e.ctrlKey ) ) {
      util.stopEvent( e );
      util.publish( diom.topics.INPUT_CHANNEL_PART );
      return;
    } else if ( key == 13 ) {
      //enter
      this.handleInput ( e );
      return;
    } else if ( key == 38 ) {
      //up arrow
      this.handleHistoryUp( );
      return;
    } else if ( key == 40 ) {
      //down arrow
      this.handleHistoryDown( );
      return;
    } else if ( key == 33 ) {
      //page up
      util.publish( diom.topics.INPUT_PAGE_UP );
      return;
    } else if ( key == 34 ) {
      //page down
      util.publish( diom.topics.INPUT_PAGE_DOWN );
      return;
    } else {
      this.reset( );
    }
    if ( e.metaKey || e.ctrlKey ) {
      if ( key > 46 && key < 59 ) {
        util.stopEvent( e );
        var index = key - 49;
        if ( index < 0 ) index = 9;
        util.publish( diom.topics.INPUT_CHANNEL_INDEX, [ index ] );
      }
    }
  }


  _vip.handleHistoryUp = function ( ) {
    this.historyIndex++;
    var value = this.history[ this.historyIndex - 1 ];
    if ( value ) {
      this.setValue( value );
    }
    if (this.history.length < this.historyIndex || this.historyIndex > this.MAX_HISTORY_LENGTH ) {
      this.historyIndex = 0;
      this.setValue( "" );
    }
    this.needsResetting = true;
  }

  _vip.handleHistoryDown = function ( ) {
    if ( this.historyIndex ) {
      this.historyIndex--;
      var value = this.history[ this.historyIndex - 1 ];
      if ( value ) {
        this.setValue( value );
        this.needsResetting = true;
        return;
      } 
    } 
    this.setValue( "" );
  }

  _vip.reset = function ( ) {
    //reset whatever tracking code used by fancy
    //key stuff
    if ( this.needsResetting ) {
      this.listItemIndex = 0;
      this.tabFragment = null;
      this.savedValue = null;
      this.tabStart = 0;
      this.tabFragEnd = 0;
      this.needsResetting = false;
      this.historyIndex = 0;
    }
  }

  _vip.tabCompletion = function ( e ) {
    util.stopEvent( e );
    var n = e.srcElement;
    this.needsResetting = true;
    if ( this.nicks.length || this.channels.length ) {
      if ( this.tabFragment ) {
        var startIndex = this.listItemIndex;
        var word = this.tabFragment;
        var value = this.savedValue;
        var c = this.tabStart;
        var lc = this.tabFragEnd;
      } else {
        var c = 0;
        var value = n.value;
        var lc = n.selectionStart;
        for ( c = ( lc - 1 ); c > 0; c-- ) {
          if ( value[c] == " " ) break;
        }
        this.tabStart = c;
        this.tabFragEnd = lc;
        var startIndex = 0;
        var word = util.trim( value.substring( c, lc ) ).toLowerCase( );
        if ( !word ) return;
        this.tabFragment = word;
        this.savedValue = value;
      }
      word = word.split( "|" ).join( "\\|" ).split( "^" ).join( "\\^" ).split( "-" ).join( "\\-" );
      word = word.split( "[" ).join( "\\[" ).split( "]" ).join( "\\]" );
      if ( word && word.length && word[ 0 ] == "#" ) {
        var list = this.channels;
      } else {
        var list = this.nicks;
      }
      for ( var i = startIndex; i < list.length; i++ ) {
        var listItem = list[ i ];
        var listItemLC = listItem.toLowerCase( );
        if ( listItemLC.search( word ) == 0 ) {
          //add 
          this.listItemIndex = i + 1;
          //if c is 0 replace at beginning, if not, one char after c (that is after space)
          var beg = value.slice( 0, ( c ? c + 1 : c ) );
          var end = value.slice( lc, 0 );
          //if c is 0 add : and space, else add just a space
          this.setValue( [ beg, listItem, ( c ? " " : ": " ), end ].join( "" ) );
          //place cursor?
          return;
        }
      }
      //didn't find a match
      this.listItemIndex = 0;
      return;
    }
  }

  _vip.destroy = function ( ) {
    delete this.nicks;
    delete this.history;
    delete this.input;
    delete this.form;
  }


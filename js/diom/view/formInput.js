/*jslint white: false */
/*jslint nomen: false */
/*jslint regexp: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, air, document */

dojo.provide( "diom.view.formInput" );

dojo.declare( "diom.view.FormInput", null, {

  constructor: function ( node, form ) {
    this.MAX_HISTORY_LENGTH = 50;
    this.input = node;
    this.form = form;
    dojo.connect(this.form, "onsubmit", this, "handleInput");
    dojo.connect(this.input, "onkeydown", this, "handleInputChange");
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
    dojo.subscribe(  diom.topics.NICK_CHANGE, this, "handleNickChange" );
  },

  getValue: function ( ) {
    //TODO: add history here and uparrow behavior

    var value;

    value = this.input.textContent;
    this.setValue( "" );
    this.input.focus( );
    return value;
  },

  setValue: function ( value ) {
		var length, input;
    editor = this.input;
    document.execCommand( "selectAll", false, "" );
    document.execCommand( "insertHTML", false, value );
    //editor.document.execCommand( "insertHTML", null, "" );
    /*
    window.setTimeout( dojo.hitch( this, function ( ) {
      //length = input.innerHTML.length;
      //input.setSelectionRange(length, length);
      console.log( "bef" );
      this.focus( );
      console.log( "aft" );
    } ), 3000 );
    */
  },

  focus: function ( ) {
    this.input.focus( );
  },

  handleInput: function ( e ) {
		var _input, inputs, i, input;
    dojo.stopEvent( e );
    _input = this.getValue( );
    inputs = _input.split( "\n" );
    for ( i = 0; i < inputs.length; i++ ) {
      input = inputs[ i ];
      this.addToHistory( input );
      util.log("getInput: " + input );
      dojo.publish( diom.topics.USER_INPUT, [ input ] );
    }
  },

  addToHistory: function ( input ) {
    this.history.unshift( input );
    if ( this.history.length > this.MAX_HISTORY_LENGTH ) {
      this.history.pop( );
    }
  },

  changeChannel: function ( nicks, serverName, channelName ) {
    this.serverName = serverName;
    this.channelName = channelName;
    this.nicks = nicks;
  },

  setChannels: function ( channels ) {
    this.channels = channels;
  },

  handleNickChange: function ( nicks, serverName, channelName ) {
    if ( serverName === this.serverName && channelName === this.channelName ) {
      this.nicks = nicks;
    }
  },

  handleInputChange: function ( e ) {
    //dojo.stopEvent should prevent insert of characters
		var key, index;
    key = e.keyCode;
    if ( key === 9 ) {
      //tab
      dojo.stopEvent( e );
      this.tabCompletion( e );
      return;
    } else if ( key === 78 && ( e.metaKey || e.ctrlKey ) ) {
      //cntrl+n or command key+n
      dojo.stopEvent( e );
      dojo.publish( diom.topics.INPUT_CHANNEL_NEXT );
      return;
    } else if ( key === 39 && e.shiftKey && ( e.metaKey || e.ctrlKey ) ) {
      //cntrl+shift+r arrow or command key+shift+r arrow
      dojo.stopEvent( e );
      dojo.publish( diom.topics.INPUT_CHANNEL_NEXT );
      return;
    } else if ( key === 80 && ( e.metaKey || e.ctrlKey ) ) {
      //cntrl+p or command key+p
      dojo.stopEvent( e );
      dojo.publish( diom.topics.INPUT_CHANNEL_PREV );
      return;
    } else if ( key === 37 && e.shiftKey && ( e.metaKey || e.ctrlKey ) ) {
      //cntrl+shift+l arrow or command key+shift+l arrow
      dojo.stopEvent( e );
      dojo.publish( diom.topics.INPUT_CHANNEL_PREV );
      return;
    } else if ( key === 76 && ( e.metaKey || e.ctrlKey ) ) {
      dojo.stopEvent( e );
      dojo.publish( diom.topics.INPUT_CHANNEL_PART );
      return;
    } else if ( key === 13 ) {
      //enter
      dojo.stopEvent( e );
      this.handleInput ( e );
      return;
    } else if ( key === 38 ) {
      //up arrow
      this.handleHistoryUp( );
      return;
    } else if ( key === 40 ) {
      //down arrow
      this.handleHistoryDown( );
      return;
    } else if ( key === 33 ) {
      //page up
      dojo.publish( diom.topics.INPUT_PAGE_UP );
      return;
    } else if ( key === 34 ) {
      //page down
      dojo.publish( diom.topics.INPUT_PAGE_DOWN );
      return;
    } else {
      this.reset( );
    }
    if ( e.metaKey || e.ctrlKey ) {
      if ( key > 46 && key < 59 ) {
        dojo.stopEvent( e );
        index = key - 49;
        if ( index < 0 ) { index = 9; }
        dojo.publish( diom.topics.INPUT_CHANNEL_INDEX, [ index ] );
      }
    }
  },


  handleHistoryUp: function ( ) {
		var value;
    this.historyIndex++;
    value = this.history[ this.historyIndex - 1 ];
    if ( value ) {
      this.setValue( value );
    }
    if (this.history.length < this.historyIndex || this.historyIndex > this.MAX_HISTORY_LENGTH ) {
      this.historyIndex = 0;
      this.setValue( "" );
    }
    this.needsResetting = true;
  },

  handleHistoryDown: function ( ) {
		var value;
    if ( this.historyIndex ) {
      this.historyIndex--;
      value = this.history[ this.historyIndex - 1 ];
      if ( value ) {
        this.setValue( value );
        this.needsResetting = true;
        return;
      }
    }
    this.setValue( "" );
  },

  reset: function ( ) {
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
  },

  tabCompletion: function ( e ) {

		var n, startIndex, word, value, c, lc,
			list, i, listItem, listItemLC, beg,
			end;

    n = e.srcElement;
    this.needsResetting = true;
    if ( this.nicks.length || this.channels.length ) {
      if ( this.tabFragment ) {
        startIndex = this.listItemIndex;
        word = this.tabFragment;
        value = this.savedValue;
        c = this.tabStart;
        lc = this.tabFragEnd;
      } else {
        c = 0;
        value = n.innerHTML;
        lc = n.selectionStart;
        console.log( "selectionStart: " + lc );
        for ( c = ( lc - 1 ); c > 0; c-- ) {
          if ( value[c] === " " ) { break; }
        }
        this.tabStart = c;
        this.tabFragEnd = lc;
        startIndex = 0;
        word = dojo.trim( value.substring( c, lc ) ).toLowerCase( );
        if ( !word ) { return; }
        this.tabFragment = word;
        this.savedValue = value;
      }
      word = word.split( "|" ).join( "\\|" ).split( "^" ).join( "\\^" ).split( "-" ).join( "\\-" );
      word = word.split( "[" ).join( "\\[" ).split( "]" ).join( "\\]" );
      if ( word && word.length && word[ 0 ] === "#" ) {
        list = this.channels;
      } else {
        list = this.nicks;
      }
      for ( i = startIndex; i < list.length; i++ ) {
        listItem = list[ i ];
        listItemLC = listItem.toLowerCase( );
        if ( listItemLC.search( word ) === 0 ) {
          //add
          this.listItemIndex = i + 1;
          //if c is 0 replace at beginning, if not, one char after c (that is after space)
          beg = value.slice( 0, ( c ? c + 1 : c ) );
          end = value.slice( lc, 0 );
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
  },

  destroy: function ( ) {
    delete this.nicks;
    delete this.history;
    delete this.input;
    delete this.form;
  }

} );

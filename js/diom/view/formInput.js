/*jslint white: false */
/*jslint nomen: false */
/*jslint regexp: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, air, document */

dojo.provide( "diom.view.formInput" );

dojo.declare( "diom.view.FormInput", null, {

  constructor: function ( node, form ) {

    var url;

    this.MAX_HISTORY_LENGTH = 50;
    this.input = node;
    this.form = form;
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
    this.errorNode = null;
    dojo.subscribe(  diom.topics.NICK_CHANGE, this, "handleNickChange" );
    this.spellEngine = new window.runtime.com.adobe.linguistics.spelling.SpellChecker( );
    this.dict = new window.runtime.com.adobe.linguistics.spelling.SpellingDictionary( );
    this.specialChars = [ '.',';','_','?','!','"',"'",')',']' ];
    url  = new air.URLRequest( 'usa.zwl' );
    this.spellCheckLoaded = false;
    this.dict.addEventListener( air.Event.COMPLETE, dojo.hitch( this, function( event ) {
      util.log( "Dictionary loaded in spellcheck engine" + this.dict.loaded );
      this.spellCheckLoaded = this.spellEngine.addDictionary( this.dict );
    } ) );
    this.dict.load( url );
    dojo.connect( this.form, "onsubmit", this, "handleInput" );
    dojo.connect( this.input, "onkeydown", this, "handleInputChange" );
    dojo.connect( this.form, "oncontextmenu", this, "handleContextMenu" );
  },

  handleContextMenu: function ( event ) {

    var node, menu, command, suggestions, word, i,
      suggestion;

    node = event.target;
    if ( dojo.hasClass( node, "spellingError" ) ) {
      this.errorNode = node;
      dojo.stopEvent( event );
      word = node.innerText;
      suggestions = this.spellEngine.getSuggestions( word );
      menu = new air.NativeMenu();
      for ( i = 0; i < suggestions.length; i++ ) {
        suggestion = suggestions[ i ];
        command = menu.addItem( new air.NativeMenuItem( suggestion ) );
        command.addEventListener( air.Event.SELECT, dojo.hitch( this, "handleSpellSuggestion" ) );
      }
      menu.display( window.nativeWindow.stage, event.clientX, event.clientY );
    }
  },
  handleSpellSuggestion: function ( event ) {

    var label, value;

    label = event.target.label;
    this.errorNode.innerText = label;
    value = this.getValue( );
    this.setValue( value );

  },
  getValue: function ( ) {

    var value;

    value = this.input.textContent;
    this.setValue( "" );
    this.input.focus( );
    return value;
  },

  setValue: function ( value ) {

		var length, input;

    value.split( " " ).join( "&nbsp;" );
    editor = this.input;
    document.execCommand( "selectAll", false, "" );
    document.execCommand( "insertHTML", false, value );
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
  checkSpelling: function ( value ) {

    var words, i, word, passes, hasErrors, fakeBlank, lastChar;

    fakeBlank = String.fromCharCode( 160 );
    value = value.split( fakeBlank ).join( ' ' );
    words = value.split( ' ' );
    if( this.spellCheckLoaded ) {
      hasErrors = false;
      for ( i = 0; i < words.length; i++ ) {
        word = words[ i ];
        lastChar = word[ word.length - 1 ];
        if ( this.specialChars.indexOf( lastChar ) !== -1 ) {
          word = word.substr( 0, word.length - 1 );
        }
        for ( var j = 0; j < word.length; j++ ) {
        }
        passes = this.spellEngine.checkWord( word );
        if ( !passes ) {
          words[ i ] = this.highlightSpellingError( word );
          hasErrors = true;
        }
      }
    }
    value = words.join( "&nbsp;" );
    return value;
  },
  highlightSpellingError: function ( word ) {
    return '<span class="spellingError">' + word + '</span>';
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
    } else if ( key === 160 || key === 32 ) {
      value = this.getValue( );
      value = this.checkSpelling( value );
      this.setValue( value + "&nbsp;" );
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

  getCursorPosition: function ( ) {

    var sel;

    sel = window.getSelection( );

    return sel.baseOffset;

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
        value = n.innerText;
        lc = this.getCursorPosition( );
        for ( c = ( lc - 1 ); c > 0; c-- ) {
          if ( value[c] === " " ) { break; }
        }
        this.tabStart = c;
        this.tabFragEnd = lc;
        startIndex = 0;
        word = value.substring( c, lc ).toLowerCase( );
        word = word.split( String.fromCharCode( 160 ) ).join( " " );
        word = dojo.trim( word )
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

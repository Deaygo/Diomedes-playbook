/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, diom, air, document */

dojo.provide( "diom.util" );

var util;

if ( !util ) {
  util = {};
}

if ( window.runtime && air ) {

  util.isString = function ( str ) {
    return !!arguments.length && str !== null && ( typeof str === "string" || str instanceof String );
  };

  util.trim = function ( str ) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  };

  util.isFunction = function ( obj ){
    return obj && ( typeof obj === "function" || obj instanceof Function ); 
  };

  util.hitch = function ( o, f, args ) {
		var a;
    if ( !f ) { throw "util.hitch failure: invalid function: " + f; }
    if ( !o ) { throw "util.hitch failure: invalid scope: " + o; }
    if ( !args ) {
      args = [];
    }
    if ( this.isString( f ) ) {
      return function ( ) {
        a = Array.prototype.slice.call(arguments);
        a = a.concat(args);
        return o[f].apply( o, a );
      };
    } else {
      return function ( ) {
        a = Array.prototype.slice.call(arguments);
        a = a.concat(args);
        return f.apply( o, a );
      };
    }
  };

  util.rand = function ( min, max ) {
    return Math.floor( Math.random( ) * ( max - min + 1 ) ) + min;
  };

  util.log = function ( msg ) {
    var d = new Date( );
    msg = "[" + d.toString() + "] UTIL LOG: " + msg + "\n";
    air.trace( msg );
    //console.log(msg);
		d = null;
  };

  util.findUp = function ( node, className ) {
    if ( !node || !className ) { return null; }
    if ( util.hasClass( node, className ) ) {
      return node;
    } else if ( node.parentNode ) {
      return util.findUp( node.parentNode, className );
    }
    return null;
  };

  util.hasClass = function ( node, className ) {
		var classes, i, name;
    if ( !node || !className ) { return false; }
    if ( node === document ) { return false; }
    if ( !node.hasAttribute( "class" ) ) { return false; }
    classes = util.trim( node.getAttribute( "class" ) );
    if ( !classes || !classes.length ) { return false; }
    classes = classes.split( " " );
    for ( i = 0; i < classes.length; i++ ) {
      name = classes[ i ];
      if ( name === className ) {
        return true;
      }
    }
    return false;
  };

  util.addClass = function ( node, className ) {
		var classes;
    if ( !node || !className ) { return; }
    classes = node.getAttribute( "class" ).split( " " );
    if ( !util.hasClass( node, className ) ) {
      classes.push( className );
    }
    node.setAttribute( "class", classes.join( " " ) );
  };

  util.remClass = function ( node, className ) {
		var classes, keep, i, name;
    if ( !node || !className ) { return; }
    if ( node.hasAttribute( "class" ) ) {
      classes = node.getAttribute( "class" ).split( " " );
      keep = [];
      for ( i = 0; i < classes.length; i++ ) {
        name = classes[ i ];
        if ( name !== className ) {
          keep.push( name );
        }
      }
      node.setAttribute( "class", keep.join( " " ) );
    }
  };

  util.cloneObject = function ( o ) {
		var newO, key;
    newO = {};
    for ( key in o ) {
      if ( o.hasOwnProperty( key ) && key !== "prototype" ) {
        newO[ key ] = o[ key ];
      }
    }
    return newO;
  };

  util.get = function ( id, doc ) {
    if ( !doc ) {
      doc = document;
    } 
    return doc.getElementById( id );
  };

  util.connect = function ( o, type, scope, method ) {
    if ( !type.search( "on" ) ) { type = type.substr( 2 ); }
    o.addEventListener( type, this.hitch( scope, method ), false );
  };

  util._subs = {};

  util.subscribe = function ( type, scope, handler, args ) {
		var length, id;
    if ( !this._subs[ type ] ) { this._subs[ type ] = []; }
    length = this._subs[ type ].push( {
        scope : scope, 
        handler : handler, 
        args : ( args ? args : [] )
    } ) ;
    id = type + ";" + length; //length is the new index + 1
    return id;
  };

  util.unsubscribe = function ( id ) {
		var parts, type, index;
    parts = id.split( ";" );
    type = parts[0];
    index = parseInt( parts[1], 10 );
    index -= 1; //index 0 based, but don't want 0 as ID as evaluates to false;
    delete this._subs[type][index];
  };

  util.publish = function ( type, args ) {
		var subs, i, subMsg, _args, sub;
    if ( this._subs[type] ) {
      subs = this._subs[type];
      try {
        for( i = 0; i < subs.length; i++ ) {
          sub = subs[i]; 
          if ( sub ) {
            _args = sub.args.concat( args );
            if ( this.isString( sub.handler ) ) {
              sub.scope[sub.handler].apply( sub.scope, _args );
            } else {
              sub.hanlder.apply( sub.scope, _args );
            }
          }
        }
      } catch ( e ) {
        if ( sub && sub.handler ) {
          subMsg = " handler: " + sub.handler;
        } else {
          subMsg = "";
        } 
        throw "bad publish, type: " + type + subMsg + " e: " + e;
      }
    }
  };

  util.stopEvent = function ( e ) {
    if ( e ) {
      e.preventDefault( );
      e.stopPropagation( );
    }
  };
  
  util.fromIndex = function ( arr, index ) {
    if ( arr.length && arr.length > index ) {
      return arr[index];
    } else {
      return null;
    }
  };

  util.Timer = function ( ) {
    this.startTime = null;
    this.endTime = null;
  };

  var _utp = util.Timer.prototype;

  _utp.start = function () {
    this.endTime = null;
    this.startTime = new Date().getTime();
    util.log("Start: " + this.startTime);
  };

  _utp.finish = function () {
    this.endTime = new Date().getTime();
    util.log("Finish: " + this.endTime);
    this.getTime();
  };

  _utp.getTime = function () {
    if ( this.startTime && this.endTime ) {
      util.log("Total time: " + (this.endTime - this.startTime));
      this.startTime = null;
      this.endTime = null;
    } else if ( this.startTime ) {
      util.log("Finish not called.");
    } else {
      util.log("Start and finish timer before calling this method.");
    }
  };

  util.timer = new util.Timer();
}


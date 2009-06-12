/*
  Copyright (c) 2009 Apphacker apphacker@gmail.com twitter.com/apphacker
  
  Some code below either is either inspired by, modified or
  a direct lift from Dojo JavaScript Library.


  Copyright (c) 2005-2008, The Dojo Foundation
  All rights reserved.

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice, this
      list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice,
      this list of conditions and the following disclaimer in the documentation
      and/or other materials provided with the distribution.
    * Neither the name of the Dojo Foundation nor the names of its contributors
      may be used to endorse or promote products derived from this software
      without specific prior written permission.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
  DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE
  FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
  DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
  SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
  CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
  OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
  OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  
  
*/

var util;

if ( !util ) {
  util = {};
}

if ( window.runtime && air ) {

  util.isString = function ( str ) {
    return !!arguments.length && str != null && ( typeof str == "string" || str instanceof String );
  }

  util.trim = function ( str ) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  }

  util.isFunction = function ( obj ){
    return obj && ( typeof obj == "function" || obj instanceof Function ); 
  }

  util.hitch = function ( o, f, args ) {
    if ( !f ) throw "util.hitch failure: invalid function: " + f;
    if ( !o ) throw "util.hitch failure: invalid scope: " + o;
    if ( !args )  {
      args = [];
    }
    if ( this.isString( f ) ) {
      return function ( ) {
        var a = Array.prototype.slice.call(arguments);
        a = a.concat(args);
        return o[f].apply( o, a );
      }
    } else {
      return function ( ) {
        var a = Array.prototype.slice.call(arguments);
        a = a.concat(args);
        return f.apply( o, a );
      }
    }
  }

  util.log = function ( msg ) {
    var d = new Date( );
    air.trace( "[" + d.toString() + "] UTIL LOG: " + msg + "\n" );
    delete d;
  }

  util.get = function ( id ) {
    return document.getElementById( id );
  }

  util.connect = function ( o, type, scope, method ) {
    if ( !type.search( "on" ) ) type = type.substr( 2 );
    o.addEventListener( type, this.hitch( scope, method ), false );
  }

  util._subs = {};

  util.subscribe = function ( type, scope, handler, args ) {
    if ( !this._subs[type] ) this._subs[type] = [];
    var length = this._subs[type].push( {scope:scope, handler:handler, args:args} ) ;
    var id = type + ";" + length; //length is the new index + 1
    return id;
  }

  util.unsubscribe = function ( id ) {
    var parts = id.split( ";" );
    var type = parts[0];
    var index = parseInt( parts[1] );
    index -= 1; //index 0 based, but don't want 0 as ID as evaluates to false;
    delete this._subs[type][index];
  }

  util.publish = function ( type, args ) {
    if ( this._subs[type] ) {
      var subs = this._subs[type], sub, _args;
      try {
        for( var i = 0; i < subs.length; i++ ) {
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
          var subMsg = " handler: " + sub.handler
        } else {
          var subMsg = "";
        } 
        throw "bad publish, type: " + type + subMsg + " e: " + e;
      }
    }
  }

  util.stopEvent = function ( e ) {
    if ( e ) {
      e.preventDefault( );
      e.stopPropagation( );
    }
  }
  
  util.Timer = function ( ) {
    this.startTime = null;
    this.endTime = null;
  }

  _utp = util.Timer.prototype;

  _utp.start = function () {
    this.endTime = null;
    this.startTime = new Date().getTime();
    util.log("Start: " + this.startTime);
  }

  _utp.finish = function () {
    this.endTime = new Date().getTime();
    util.log("Finish: " + this.endTime);
    this.getTime();
  }

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
  }

  util.timer = new util.Timer();
}


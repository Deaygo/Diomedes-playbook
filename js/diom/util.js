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
    if ( dojo.hasClass( node, className ) ) {
      return node;
    } else if ( node.parentNode ) {
      return util.findUp( node.parentNode, className );
    }
    return null;
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
		if ( doc ) {
			return doc.getElementById( id );
		}
    return dojo.byId( id );
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


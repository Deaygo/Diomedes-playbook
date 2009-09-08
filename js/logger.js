
var logger;
if ( !dojo.isObject( logger ) ) {
  logger = {};
} 

dojo.declare( "logger.Logger", null, {
  constructor: function ( test ) {
    this.test = test;
  },
  getTest: function( ) {
    return this.test;
  }
} );


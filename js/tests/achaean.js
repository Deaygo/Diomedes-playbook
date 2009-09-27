/*
 
**********************************************************************************
MIT LICENSE 
 
Copyright (c) 2009 Bjorn Tipling apphackers.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

**********************************************************************************

***********************
  USAGE
***********************

**CREATE TEST:

var myTest = new Achaean( testName );

**AVAILABLE ASSERTS:

myTest.assert( boolean, message )
myTest.assertTrue( boolean, message )
myTest.assertFalse( boolean, message)
myTest.assertEquals( value1, value2, message )
myTest.assertNotEquals( value1, value2, message )
myTest.assertNull( value, message )
myTest.assertNotNull( value, message )
myTest.assertUndefined( value, message )
myTest.assertNotUndefined( value, message )
myTest.assertNaN( value, message )
myTest.assertNotNaN( value, message )
myTest.fail( message )
myTest.expectTest( assertName, timeout, message )*

*not supported outside of a browser context

All asserts take additional optional parameters: 

group - group object, default null
required - boolean, default True, if not required test will not fail
name - used for asynchronous tests ( explained below )
callback - function to call when test completes, default null, 
          callbacks for expectTest are only called if expected test is not called

For example: 

myTest.assert( boolean, message, group, required, name, callback );
myTest.expectTest( assertName,timeout, message, group, required, name, callback );

Signature for callback:

function myCallback ( boolean ) 

where boolean is the assert result, myTest.fail result is always false

**CREATE TEST GROUP

var group = myTest.createGroup( groupName )

then call subsequent asserts associated with this group:

myTest.assert( boolean, message, group ) 

passing group as next argument after default arguments for asserts

**ASYNCHRONOUS TESTS

Asynchronous tests are only supported in context that have window.setTimeout
That means this feature wont work in Rhino or V8

Achaean supports asynchronous tests

To test asynchronous bevhavior tell achaean about tests to expect:

myTest.expectTest( "async1", timeout, message )

Then later add a test in code that executes asynchronously:

myTest.assert( boolean, message, group, "async1" ); 

If "async1" doesn't fire before timeout ( miliseconds ) the test will fail.

Also, expectTest takes all the same extra arguments as asserts allowing you to chain expected tests together.

**SETUP AND TEARDOWN

Use these to call functions that are executed before and after
the tests finish.

myTest.setUp( callback ) 

  the callback is called before test starts.

myTest.tearDown( callback )

  the callback is called after test ends.

**RUN TEST:
 
myTest.run( callback );

callback will be a function that executes to let you know when tests are finished.

**GET RESULT:

var result = myTest.getResults( );

**RESULTS:

Results take this format:

{
  testName: string,
  testFailed: boolean,
  errorCount: number, 
  assertCount: number,
  percentagePass: float,
  allErrors: [ 
    {
      message: string, 
      assertType: string,
      required, boolean
    }
  ],
  allPassed: [ 
    {
      message: string, 
      assertType: string,
      required, boolean
    }
  ],
  groups: [
    {
      name: string,
      groupFailed: boolean,
      errorCount: number,
      assertCount: number,
      percentagePass: float,
      groupErrors: [
        {
          message: string, 
          assertType: string,
          required, boolean
        }
      ]
      groupPassed: [
        {
          message: string, 
          assertType: string,
          required, boolean
        }
      ]
    }
  ],
  summaryPlainText: string,
  summaryHTML: string
}


*/

/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */

var window;

var Achaean = function ( testName ) {
  this._testName = testName;
  this._asserts = [ ];
  this._expectedTests = [ ];
  this._setUpCallback = null;
  this._tearDownCallback = null;
  this._runCallback = null;
  this._testFailed = false;
  this._groupsMap = { };
  this._groups = [ ];
  this._errorCount = 0;
  this._assertCount = 0;
  this._errors = [ ];
  this._passes = [ ];
};

Achaean.prototype._ASSERT_TYPES = {
  ASSERT: "assert",
  ASSERT_TRUE: "assertTrue",
  ASSERT_FALSE: "assertFalse",
  ASSERT_EQUALS: "assertEquals",
  ASSERT_NOT_EQUALS: "assertNotEquals",
  ASSERT_NULL: "assertNull",
  ASSERT_NOT_NULL: "assertNotNull",
  ASSERT_UNDEFINED: "assertUndefined",
  ASSERT_NOT_UNDEFINED: "assertNotUndefined",
  ASSERT_NAN: "assertNaN",
  ASSERT_NOT_NAN: "assertNotNaN",
  ASSERT_FAIL: "fail",
  EXPECT_TEST: "expectTest"
};

Achaean.prototype._createAssertEntry = function ( assertType, result, message, group, required, name, callback ) {
  if ( required !== false ) { required = true; }
  var groupName = null;
  if ( group && "name" in group ) {
    groupName = group.name;
  } 
  if ( !name ) { name = null; }
  if ( !( typeof message === "string" || message instanceof String || message.length ) ) {
    throw "Achaean threw error: All asserts require messages. No message on a " + assertType + " assert.";
  } 
  this._asserts.push( {
    result: result,
    assertType: assertType,
    group: groupName,
    message: message,
    required: required,
    name: name,
    callback: callback
  } );
};

Achaean.prototype.run = function ( callback ) {
  this._runCallback = callback;
  this._callCallback( this._setUpCallback, null );
  this._clearAsserts( );
};

Achaean.prototype._clearAsserts = function( ) {
  //returns true if test is finished
  while ( this._asserts.length ) {
    var assert = this._asserts.shift( );
    if ( assert.assertType === this._ASSERT_TYPES.EXPECT_TEST ) {
      this._setExpected( assert.result.assertName, assert.result.timeout, assert );
    } else {
      this._recordAssertResult( assert.result( ), assert );
    }
  }
  return this._finishIfNoExpected( );
};

Achaean.prototype._clearExpected = function ( ) {
  var expectedTest,
    currentTime = new Date( ).getTime( ),
    cache = [ ];
  if ( !this._clearAsserts( ) ) {
    while ( this._expectedTests.length ) {
      expectedTest = this._expectedTests.shift( );
      if ( expectedTest.timeout < currentTime ) {
        this._recordAssertResult( false, expectedTest.assert );
      } else {
        cache.push( expectedTest );
      }
    }
    this._expectedTests = cache;
    this._finishIfNoExpected( );
  }
};

Achaean.prototype._recordAssertResult = function( result, assert ) {
  var tmpGroup, groupName, hasError = false,
    resultObject = this._createResult( assert.message, assert.assertType, assert.required );
  this._assertCount++;
  if ( !result ) {
    hasError = true;
    this._errorCount++;
    this._errors.push( resultObject );
    if ( assert.required ) {
      this._testFailed = true;
    }
  } else {
    this._passes.push( resultObject );
  }
  this._callCallback( assert.callback, result );
  if ( assert.group ) {
    groupName = assert.group;
    if ( !( groupName in this._groupsMap ) ) {
      tmpGroup = { 
        name: groupName,
        groupFailed: false, 
        errorCount: 0 ,
        assertCount: 0,
        groupErrors: [ ],
        groupPassed: [ ]
      };
      this._groupsMap[ groupName ] = tmpGroup;
      this._groups.push( tmpGroup );
    } else {
      tmpGroup = this._groupsMap[ groupName ];
    }
    tmpGroup.assertCount++;
    if ( hasError ) {
      tmpGroup.errorCount++;
      if ( assert.required ) {
        tmpGroup.groupFailed = true;
      }
      tmpGroup.groupErrors.push( resultObject );
    } else {
      tmpGroup.groupPassed.push( resultObject );
    }
  }
};

Achaean.prototype._setExpected = function ( assertName, timeout, assert ) {
  var errorMsg, o;
  if ( !window ) {
    errorMsg = "Achaean threw error: doesn't look like you're in a browser environment.";
    errorMsg += " Rhino and v8 do not support window.setTimeout and ";
    errorMsg += " which are required for asynchronous testing.";
    throw errorMsg;
  }
  this._expectedTests.push( {
    assertName: assertName,
    timeout: new Date( ).getTime( ) + timeout,
    assert: assert
  } );
  o = this;
  window.setTimeout( function( ) {
      o._clearExpected( ); 
  }, timeout + 100 ); //padding some time on timeout, maybe this is bad?
};

Achaean.prototype._finishIfNoExpected = function ( ) {
  if ( !this._expectedTests.length ) {
    this._finishRun( );
    return true;
  }
  return false;
};

Achaean.prototype._finishRun = function ( ) {
  var tmpGroup, i, testResults;
  for ( i = 0; i < this._groups.length; i++ ) {
    tmpGroup = this._groups[ i ];
    tmpGroup.percentagePass = Math.round( ( tmpGroup.errorCount/tmpGroup.assertCount ) * 10000 ) / 100;
  }
  this._callCallback( this._tearDownCallback, null );
  testResults = {
    testName: this._testName,
    testFailed: this._testFailed,
    errorCount: this._errorCount,
    assertCount: this._assertCount,
    percentagePass: Math.round( ( this._errorCount/ this._assertCount ) * 10000 ) / 100,
    allErrors: this._errors,
    allPassed: this._passes,
    groups: this._groups
  };
  testResults.summaryPlainText = this._createPlainTextSummary( testResults );
  testResults.summaryHTML = this._createHTMLSummary( testResults );
  this._testResults = testResults;
  this._callCallback( this._runCallback, null );
};

Achaean.prototype.getResults = function ( ) {
  return this._testResults;
};

Achaean.prototype._createPlainTextSummary = function ( testResults ) {
  var s = [ 
    "*********************\n",
    "UNIT TEST RESULTS\n", 
    "*********************\n\n",
    "Generated by Achaean\n\n\n" 
  ];
  s.push( [ " Test Name: ", testResults.testName, "\n\n" ].join( "" ) );
  s.push( [ " Test Result: ", ( testResults.testFailed ? "FAILED" : "PASSED" ), "\n\n" ].join( "" ) );
  s.push( [ " Total Errors: ", testResults.errorCount.toString( ), "\n" ].join( "" ) );
  s.push( [ " Total Asserts: ", testResults.assertCount.toString( ), "\n" ].join( "" ) );
  s.push( [ " Percent Passed: ", testResults.percentagePass.toString( ), "%\n" ].join( "" ) );
  s.push( [ " Group Count: ", testResults.percentagePass.toString( ), "%\n\n" ].join( "" ) );
  s.push( "ERRORS\n\n" );
  this._createPlainTextResultSummary( s, testResults.allErrors, "FAILED" );
  s.push( "PASSED\n\n" );
  this._createPlainTextResultSummary( s, testResults.allPassed, "PASSED" );
  s.push( "GROUPS\n\n" );
  return s.join( "" );
};

Achaean.prototype._createHTMLSummary = function ( testResults ) {
  //TODO!
  return "unimplemented";
};

Achaean.prototype._createPlainTextGroupSummary = function ( s, groups ) {
  var group, i;
  for ( i = 0; i < groups.length; i++ ) {
    group = groups[ i ];
    s.push( [ " Group Name: ", group.name, "\n" ].join( "" ) );
    s.push( [ " Group Result: ", ( group.groupFailed ? "FAILED" : "PASSED" ), "\n\n" ].join( "" ) );
    s.push( [ " Error count: ", group.errorCount.toString( ), "\n" ].join( "" ) );
    s.push( [ " Assert count: ", group.assertCount.toString( ), "\n" ].join( "" ) );
    s.push( [ " Percentage Pass: ", group.percentagePass.toString( ), "\n\n" ].join( "" ) ); 
    s.push( "Group Errors\nn" );
    this._createPlainTextResultSummary( s, group.groupErrors, "FAILED" );
    s.push( "Group Passed\n\n" );
    this._createPlainTextResultSummary( s, group.groupPassed, "PASSED" );
  }
};

Achaean.prototype._createPlainTextResultSummary = function ( s, assertArray, comment ) {
  var assertResult, i;
  for ( i = 0; i < assertArray.length; i++ ) {
    assertResult = assertArray[ i ];
    s.push( [ 
     assertResult.assertType, " ",
     "required: ", assertResult.required.toString( ), " ",
     assertResult.message, " ",
     comment, "\n"
    ].join( "" ) );
  }
  s.push( "\n" );
  return s;
};

Achaean.prototype._createResult = function ( message, assertType, required ) {
  return {
    message: message, assertType: assertType, required: required
  };
};

Achaean.prototype._callCallback = function ( callback, result ) {
  if ( callback && ( typeof callback === "function" || callback instanceof Function ) ) {
    if ( result === null ) {
      callback( );
    } else {
      callback( result );
    }
  }
};

Achaean.prototype.assert = function ( _boolean, message, group, required, name, callback ) {
  var result = function ( ) { return _boolean; };
  this._createAssertEntry( this._ASSERT_TYPES.ASSERT, result, message, group, required, name, callback );
};

Achaean.prototype.assertTrue = function ( _boolean, message, group, required, name, callback ) {
  var result = function ( ) { return _boolean === true; };
  this._createAssertEntry( this._ASSERT_TYPES.ASSERT_TRUE, result, message, group, required, name, callback );
};

Achaean.prototype.assertFalse = function ( _boolean, message, group, required, name, callback ) {
  var result = function ( ) { return _boolean === false; };
  this._createAssertEntry( this._ASSERT_TYPES.ASSERT_FALSE, result, message, group, required, name, callback );
};

Achaean.prototype.assertEquals = function ( value1, value2, message, group, required, name, callback ) {
  var result = function ( ) { return value1 === value2; };
  this._createAssertEntry( this._ASSERT_TYPES.ASSERT_EQUALS, result, message, group, required, name, callback );
};

Achaean.prototype.assertNotEquals = function ( value1, value2, message, group, required, name, callback ) {
  var result = function ( ) { return value1 !== value2; };
  this._createAssertEntry( this._ASSERT_TYPES.ASSERT_NOT_EQUALS, result, message, group, required, name, callback );
};

Achaean.prototype.assertNull = function ( value, message, group, required, name, callback ) {
  var result = function ( ) { return value === null; };
  this._createAssertEntry( this._ASSERT_TYPES.ASSERT_NULL, result, message, group, required, name, callback );
};

Achaean.prototype.assertNotNull = function ( value, message, group, required, name, callback ) {
  var result = function ( ) { return value !== null; };
  this._createAssertEntry( this._ASSERT_TYPES.ASSERT_NOT_NULL, result, message, group, required, name, callback );
};

Achaean.prototype.assertUndefined = function ( value, message, group, required, name, callback ) {
  var result = function ( ) { return value === undefined; };
  this._createAssertEntry( this._ASSERT_TYPES.ASSERT_UNDEFINED, result, message, group, required, name, callback );
};

Achaean.prototype.assertNotUndefined = function ( value, message, group, required, name, callback ) {
  var result = function ( ) { return value !== undefined; };
  this._createAssertEntry( this._ASSERT_TYPES.ASSERT_NOT_UNDEFINED, result, message, group, required, name, callback );
};

Achaean.prototype.assertNaN = function ( value, message, group, required, name, callback ) {
  var result = function ( ) { return value !== value;  };
  this._createAssertEntry( this._ASSERT_TYPES.ASSERT_NAN, result, message, group, required, name, callback );
};

Achaean.prototype.assertNotNaN = function ( value, message, group, required, name, callback ) {
  var result = function ( ) { return value === value; };
  this._createAssertEntry( this._ASSERT_TYPES.ASSERT_NOT_NAN, result, message, group, required, name, callback );
};

Achaean.prototype.fail = function ( message, group, required, name, callback ) {
  var result = function ( ) { return false; };
  this._createAssertEntry( this._ASSERT_TYPES.ASSERT_FAIL, result, message, group, required, name, callback );
};

Achaean.prototype.expectTest = function ( assertName, timeout, message, group, required, name, callback ) {
  var result = { assertName: assertName, timeout: timeout };
  this._createAssertEntry( this._ASSERT_TYPES.EXPECT_TEST, result, message, group, required, name, callback );
};

Achaean.prototype.createGroup = function ( groupName ) {
  //may change this, so trying to be flexible
  return { name: groupName };
};

Achaean.prototype.setUp = function ( callback ) {
  this._setUpCallback = callback;
};

Achaean.prototype.tearDown = function ( callback ) {
  this._tearDownCallback = callback;
};


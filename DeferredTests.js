require("Deferred.js");

logger.debug("Starting deferredTests");

var a = new Deferred();

a.addErrback(function (e) {
	logger.debug("***** Error:  1 will not handle, should pass to handler 2" + e.message);
	return false;
});

a.addCallback( function (x) {
	logger.debug("Should fail " + x);
	throw new Error();
	return x;
});

a.addCallback( function (y) {
	logger.debug("Should run when error been fixed. " + y);
	return y;
});

a.addErrback(function (e) {
	logger.debug("***** Error: handler two will handle" + e.message);
	return true;
});

a.callback(6);

logger.debug("DeferredTests done.");
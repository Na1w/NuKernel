/*
 * Copyright (c) 2013, Fredrik Andersson <fredrikandersson@mac.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met: 
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer. 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution. 
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */
/*
	Simple deferred implementation 

	Callbacks will chain process if they return something,
	Error handlers must return true to resume normal operation. 
*/
 Class.create("Framework.Deferred", {
 	initialize: function () {
 		this._triggered = null;
 		this._result = null;
 		this._error = false;
 		this._callbackChain = [];
 	},

 	_makePair: function (table, callback, errback) {
 		if(callback || errback) {
	 		table.push({
	 			callback: callback || null,
	 			errback: errback || null
	 		});
 		}
 	},

//XXX: Optimize- terrible for failures.
 	_runCallbacks: function (_length) {
 		if(this._triggered) {
 			var reinsert = [];
	 		while(this._callbackChain.length > 0) {
	 			var pair = this._callbackChain.shift();
	 			if(this._error && pair.errback) {
	 				var res = pair.errback(this._error);
	 				if(res) {
	 					this._error = false;
	 				}
	 				var removeDup = reinsert.indexOf(pair);
	 				if(removeDup >=0 ) {
	 					reinsert.splice(removeDup,1);
	 				}
	 			} else if (!this._error && pair.callback) {
	 				try {
		 				var res = pair.callback(this._result);
		 				if(res) {
		 					this._result = res;
		 				}
	 				} catch (e) {
	 					this._error = e;
	 					this._callbackChain = reinsert.concat(this._callbackChain);
	 				}
	 			} else {
	 				this._makePair(reinsert, pair.callback, pair.errback);
	 			}
	 		}
	 		this._callbackChain = reinsert;
	 		if(reinsert.length !== _length) {
	 			this._runCallbacks(reinsert.length);
	 		}
 		} 
 		return this;
 	},

 	callback: function (res) {
 		this._result = res;
 		this._triggered = true;
 		this._runCallbacks();
 	},

 	errback: function (error) {
 		this._error = error;
 		this._triggered = true;
 		this._runCallbacks();
 	},

 	addCallback: function (callback) {
 		this._makePair(this._callbackChain, callback, null);
 		return this._runCallbacks();
 	},

 	addErrback: function (errback) {
 		this._makePair(this._callbackChain, null, errback);
 		return this._runCallbacks();
 	},

 	addBoth: function (callback, errback) {
 		this._makePair(this._callbackChain, callback, errback);
 		return this._runCallbacks();
 	},
 });

 logger.debug("Deferred loaded");

//Alias to Deferred to save typing...
 window.Deferred = Framework.Deferred;
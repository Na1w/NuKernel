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
	Basic loader 
*/
Class.create("Framework.Loader", {
	initialize: function () {
		this._loaded = {};
		logger.debug("Loader initialized");
	},

	load: function (manifest) {

	},

	syncLoad: function (name) {
		if(!this._loaded[name]) { 
			var xmlRequest = new XMLHttpRequest();
			xmlRequest.open("GET", name, false);
			xmlRequest.send(null);
			var res = xmlRequest.responseText;
			if(res) {
				this._loaded[name] = true;
			}
			return res;
		}
	}
});

var Loader = new Framework.Loader();
/* Inspired by js-node require */
var require = function(arg) { 
		var res = Loader.syncLoad.call(Loader, arg);
		if(res) {
			eval(res);
		}
};

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
    A very simple logger class- logs into the element specified.
*/

Class.create("Framework.logger", {
    initialize: function (holder) {
        this._logDiv = document.getElementById(holder);
        this.debug("Logger: Initialized.");
    },

    debug: function (msg) {
        var stampedMsg = "[" +Date.now() +"] " + msg; 
        var fragment = document.createDocumentFragment();
        fragment.appendChild(document.createTextNode(stampedMsg));
        fragment.appendChild(document.createElement('br'));
        // Log to the javascript console as well if available.
        if(console) {
            console.debug(stampedMsg);
        }
        this._logDiv.appendChild(fragment);
        this._logDiv.scrollTop = this._logDiv.scrollHeight;
  }
});

var logger = new Framework.logger("logger");

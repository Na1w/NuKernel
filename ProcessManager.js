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
   Process Manager
   Spawns and manages processes.
*/

Class.create("Framework.ProcessManager", {
/******************  Worker thread code starts here *****************************************/
    /*
        @Exports NONE
        @Implements onMessage. 
    */
    _runtimeಠMessage$onmessage: function (evt) {
        //XXX: Move the following to an initialization routine.
        if(!self._status) { // Initialize 
            self._status = "awaitingUpload";
        }
        if(!self._ping) {
            self._ping = null;
        }
        if(!self._rpcResult) {
            self._rpcResult = {};
        }

        var parsedData = JSON.parse(evt.data);
        var responseObject = {};
        /* Command selector */
        switch(parsedData.opcode) {
            case 'run':
                self._status = "running";
                self.respond(responseObject);
                responseObject.result = self._userProgram.init();
                self._status = "executed";
                break;
            case 'start':
            case 'status':
            case 'ping':
                if(parsedData.boot) {
                    self._startAtLink = parsedData.boot; 
                }
                self._ping=Date.now();
                break;
            case 'compile':
                var code = parsedData.payload;
                self._status = "parsingCode";
                self._userProgram = eval('(' + code + ')');
                self.that = self._userProgram;
                if(self._startAtLink) {
                    self._status = "bootstraping";
                } else {
                    self._status = "awaitingCommand";
                }
                break;
            case 'dump':
                // XX rewrite.
                responseObject.memory = JSON.stringify("debugging disabled.");
                self._status = "debug";
                break;
            case 'workerRPC':
                var selector = parsedData.selector;
                var args = parsedData.args;
                
                if(self._userProgram && self._userProgram[selector]) {
                    var program = self._userProgram[selector];
                    self._status = "executing";
                    self.respond(responseObject);

                    responseObject.result = program.apply(program, args);
                    self._status = "executed";
                }
                break;
            case 'RPCResponse':
                self._status = parsedData._oldStatus;
                if(parsedData.result) {
                    self._rpcResult[parsedData._commandId] = parsedData.result;
                }
                break;
            default:
                self._status = "idle";
                break;
        }

        self.respond(responseObject);
    },

    /* @Exports self.performRPC */
    _runtimeಠ$performRPC: function (targetString, variableArguments) {
        var args = Array.prototype.slice.call(arguments);
        var objectName = args.shift();
        var oldStatus = self._status;
        var commandHash = {};

        self._status = "RPCOnMainThread";
        commandHash._RPCTarget = objectName;
        commandHash._oldStatus = oldStatus;
        commandHash._args = args;
        self.respond(commandHash);
    },

    /* @Exports self.respond */
    _runtimಠe$respond: function (indata) {
        indata.status = self._status;
        indata.ping = self._ping;
        self.postMessage(JSON.stringify(indata));
    },

/*  ***************** ALL ABOVE IS THREAD CODE AND RUNS IN THE WORKER ******************/

    initialize: function () {
        this._processId = 0;
        this._pidBlobTable = {};
        this._processTable = {};
        this._processUpload = {};
        this._processNamePidTable = {};
        this._processState = {};
        this._processResponse = {};

        // Assemble and link basic worker initialization code and runtime.
        this._initCode = "";
      
        logger.debug("ProcessManager: Assembling worker runtime...");
        for(var v in this) {
            if(v.indexOf("ಠ") >= 0) {
              var s = v.split("$"); 
              logger.debug("ProcessManager: Exporting worker method self." + s[1] + " from this." + v);
              this._initCode += ";self." + s[1] + "=" + this[v].toString();  
            }
        }
        logger.debug("ProcessManager: Runtime assembled. Runtime size = " + this._initCode.length + " bytes.");
        logger.debug("ProcessManager: Threading bootstrap code been compiled, we're initialized...");
    },

    /*  
        Issues a command to a worker thread, 
        Returns true if successfully delivery
                false if the process is busy.
                null if no delivery target.  
    */
    _issueWorkerCommand: function (pid, messageObject) {
        var worker = this._processTable[pid];
        if(worker) {
            var message = JSON.stringify(messageObject);
            if(this._processState[pid] !== 'busy') {
                worker.postMessage(message);
                return true; 
            }
            return false;
        } 

        logger.debug("ProcessManager._issueWorkerCommand: No processes with pid " + pid);
        return null;
    },

    _performRPC: function (pid, method, variableArguments) {
        var args =  Array.prototype.slice.call(arguments);
        var pid = args.shift();
        var method = args.shift();
        
        this._issueWorkerCommand(pid, { opcode: "workerRPC",
                                        selector: method,
                                        args: args});
    },

    _createWorker: function (code, bootstrap) {
        var that = this;
        var pid = this._processId;
        var uploader = this._initCode;
        var blob = new Blob([uploader], { type: "text/javascript" });
        var worker = new Worker(window.URL.createObjectURL(blob));
        this._processTable[pid] = worker;
        this._pidBlobTable[pid] = blob;
        this._processUpload[pid] = "function () { return " + code + " }()";

        worker.onmessage = function () {
            return function(evt) {
                var friendName = "[" + that._processNamePidTable[pid] + "/" + pid + "]";
                var responseObject = JSON.parse(evt.data);
                that._processState[pid] = responseObject.status;
                switch(responseObject.status) {
                    case 'awaitingUpload': /* Thread created, signal ready here */
                        logger.debug("ProcessManager: " + friendName + " requested program upload.");
                        that._issueWorkerCommand(pid, { opcode: "compile",
                                                        payload: that._processUpload[pid]});
                        break;
                    case 'awaitingCommand': /* Code been successfully uploaded */
                        logger.debug("ProcessManager: " + "Code been uploaded to " + friendName +", this one can't run. It can only be invoked via RPC." );
                 //       logger.debug("Asking processes " + friendName + " to dump it's memory");
                      //  that._issueWorkerCommand(pid, { opcode: "dump"});
                        break;
                    case 'debug': /* Debug response */
                        responseObject.memory = JSON.parse(responseObject.memory);
                        if(console) {
                            console.debug("Contents of " + friendName);
                            console.dir(responseObject);
                        }
                        logger.debug("ProcessManager: " + "Contents of process " + friendName + " been dumped to the javascript console.");
                        break;
                    case 'bootstraping': /* Thread is autostarting, trigger start here */
                        logger.debug("ProcessManager: " + "Code been uploaded to " + friendName + ", it has an init method- signaling it to run now! (" + Date.now() + ")");
                        that._issueWorkerCommand(pid, { opcode: "run" });
                        break;
                    case 'executed': /* RPC executed successfully */
                        that._processResponse[pid] = responseObject.result;
                        /* CALL RPC CALLBACKS */
                        break;
                    case 'idle':
                        /* DO NOT DO ANYTHING HERE */
                        break;
                    case 'RPCOnMainThread': /* Perform RPC */
                        var fullPath = responseObject._RPCTarget;
                        var rootInstance = window[fullPath.split(".")[0]];
                        var nativeRes = null;

                        if(rootInstance) {
                            var method = RetriveFromNamespace(fullPath); 
                            nativeRes = method.apply(rootInstance, responseObject._args);
                        }
                        that._issueWorkerCommand(pid, { opcode: "RPCResponse",
                                                        oldStatus: responseObject._oldStatus,
                                                        result: nativeRes });
                        break;
                    case undefined:
                        break;
                    default: 
                        logger.debug("ProcessManager.processResponse @ " + friendName + " : " +  responseObject.status + " - " + (responseObject.result ? responseObject.result : "yes"));
                }
            }
        }(pid);

        worker.onerror = function () { 
            return function (evt) {
                var friendName = that._processNamePidTable[pid] + "/" + pid;
                var currentState = that._processState[pid];
                if(currentState === 'parsingCode') {
                    logger.error("Code failed compilation in target process " + friendName + " [ " + evt.message  + " ] ");
                    that._processState[pid] = 'upload failed.';
                    evt.preventDefault();
                } else {
                    that._processState[pid] = 'error: ' +  evt.message;
                    logger.debug("ProcessManager.processError @ " + friendName + "%" + currentState + " : " + evt.message);
                }
            }
        }(pid);

        this._issueWorkerCommand(pid, { opcode: "start", 
                                        boot: bootstrap });
        this._processId++;
        return pid;
    },

    _killWorker: function (pid) {
        if(this._processTable[pid]) {
            this._processTable[pid].terminate();
            window.URL.revokeObjectURL(this._pidBlobTable[pid]);
            delete this._processTable[pid];
            delete this._pidBlobTable[pid];

            return true;
        }
        return false;
    },

    listProcesses: function () {
        var procsses = 0;
        logger.debug(">>>ProcessListing - Legend: [Name/ProcessId]>>>")
        for(var v in this._processNamePidTable) {
            procsses++;
            var res = this._processResponse[v] ? "Response: " + this._processResponse[v] : "";
            logger.debug("* [" + this._processNamePidTable[v] + "/" + v + "] state: " + this._processState[v] + " " + res);
        }
        logger.debug("<<< " + procsses + " processes been listed. End of processlist.<<<");
    },

    /* 
        Spawns a process running the program block sent as the second argument,
        Please note this method assumes the block is a one level hash of functions.

        Also NOTICE that this code is run in another thread context- 

        YOU CAN __NOT__ USE GLOBAL VARIABLES NOR METHODS DEFINED OUTSIDE THIS BLOCK.

        IF YOU NEED TO PERFORM A PROCEDURE CALL ON ANOTHER CONTEXT USE THE REMOTE-
        PROCEDURE BRIDGE SUPPLIED VIA THE RUNTIME. 
        
        HOWEVER BEWARE THAT THIS METHOD IS HEAVY WEIGHT. 

        Additionally: If the handlerBlock has an init method (NOT initialize),
        this method will start executing immediately after the thread is up and running.
    */
    spawnProcess: function (processName, handlerBlock) {
        var shouldRunInit = false;
        var processblock = " { ";
        for(var v in handlerBlock) {
            var tag = handlerBlock[v];
            if(typeof tag === "function") {
                if(v === "init") {
                    shouldRunInit = true;
                }
                processblock += v + ": " + tag.toString(); 
            } else {
                processblock += v += ": " + JSON.stringify(tag);
            }
            processblock += ",";
        }
        processblock += "}";
        var pid = this._createWorker(processblock, shouldRunInit);
        logger.debug("ProcessManager: " +"Compiled and spawned process [" + processName + "/" + pid + "]");

        this._processNamePidTable[pid] = processName ;
        return pid;
    },

    /*
        Immediately kills and teardown a thread specified by the pid 
    */ 
    destroyProcess: function (pid) {
        if(this._killWorker(pid)) {
            logger.debug("ProcessManager: Killed process @ " + this._processNamePidTable[pid] + "/" + pid);
            delete this._processNamePidTable[pid];
            return true;
        }
        return false;
    }
}); 

var ProcessManager = new Framework.ProcessManager();
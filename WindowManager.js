require("Logger.js");

/*
    Manages windows and event routing.
    This is a system internal service; never call yourself.

    This class leverages heavially on HTML5 z index features.
*/

Class.create("Framework.HTML5WindowManager", {
    initialize: function (rootNodeId, baseLevel) {
        this._container = document.getElementById(rootNodeId);
        this._baseLevel = baseLevel || 0;
        this._windowTable = [];
        this._windowCounter = 0;
        this._keyTarget = null;
        this._dirtyWindowList = false; 
        this._renderLock = null;
        this._registerMove = false;

        this._dragTarget = null;
        this._dragOffsetX = 0;
        this._dragOffsetY = 0;
        this._activeWindow = null;

        var that = this;

        document.onmousedown=function (evt) {
            return that._handleMouseDown(evt);
        };

        document.onmouseup = function (evt) {
            return that._handleMouseUp(evt);
        };

        document.onmousemove = function (evt) {
            return that._handleMouseMoved(evt);
        };

        window.onkeypress = function (evt) {
            return that._routeEvent(evt);
        };

        if(this._container === null) {
            throw new Error("The window container could not be found");
        }
        
        this.notifyRedraw();

        logger.debug("HTML5WindowManager initialized.");
    },

    _handleMouseDown: function (evt) {
        var target = evt.target;

        if(target.getAttribute("behavior-dragable")) {
            this._registerMove = true;
            this._dragTarget = target;
            this._dragOffsetY = evt.clientY - target.offsetTop;
            this._dragOffsetX = evt.clientX - target.offsetLeft;
            for(var i = 0; i < this._windowTable.length; i++) {
                if(this._windowTable[i].isMyDragArea(target)) {
                    this._activeWindow = this._windowTable[i];
                    logger.debug("HTML5WindowManager: Window Id: " + this._activeWindow.getUniqueId() + " wants to handle this event.");
                    this._activeWindow.processDown(evt);
                    return false;
                }
            }
        }
    },

    _handleMouseUp: function (evt) {
        if(this._dragTarget) {
            this._registerMove = false;
            this._dragTarget = false;
            this._activeWindow.processUp(evt);
            this._activeWindow = null;
            return false;
        }
    },

    _handleMouseMoved: function (evt) {
        if(this._dragTarget && this._activeWindow) {
            this._activeWindow.setPosition(evt.clientX - this._dragOffsetX, evt.clientY - this._dragOffsetY);
            return false;
        } 
    },

    registerWindow: function (windowInstance) {
        if(windowInstance) { 
            if(!windowInstance.getUniqueId()) {
                windowInstance.setUniqueId(this._windowCounter++);
                this._dirtyWindowList = true;

                this._windowTable.push(windowInstance);
                this._reorganizeOrder();
                this._container.appendChild(windowInstance.getDomRepresentation());
                logger.debug("HTML5WindowManager: Registered window Id: " + windowInstance.getUniqueId());
            } else {
                throw new Error("Internal error: The window Id : " + windowInstance.getUniqueId() + " already been registered.");
            }
        }
    },

    _getWindowIndex: function (windowInstance) {
        var instanceIndex = this._windowTable.indexOf(windowInstance);
        if(instanceIndex >= 0) {
           return instanceIndex;
        }
        return null; 
    },

    _performWithIndex: function (windowInstance, func) {
      var index = this._getWindowIndex(windowInstance);
        if(index>=0) {
            func.call(this, index);
        }
    },

    unregisterWindow: function (windowInstance) {
        this._performWithIndex(windowInstance, function (index) {
            this._windowTable.splice(index,1);
            logger.debug("HTML5WindowManager: Window Id: " +  windowInstance.getUniqueId() + " has been destroyed.");

           /*
                Microoptimization No need to mark the windowlist dirty when removing windows.

             */
        });
    },

    moveToFront: function (windowInstance) {
        this._performWithIndex(windowInstance, function (index) {
            this._dirtyWindowList = true;
            this._windowTable.splice(this._windowTable.length, 0, this._windowTable.splice(index, 1)[0]);
            this._reorganizeOrder();
        });
    },

    makeKey: function (windowInstance) {
        this._keyTarget = windowInstance;
    },

    _reorganizeOrder: function () {
        if(this._dirtyWindowList) {
            var currentLevel = this._baseLevel;
            var currentWindow = null;
            for(var i=0; i < this._windowTable.length; i++) {
                currentWindow = this._windowTable[i];
                var fixedLevel = currentWindow.getFixedLevel();
                currentLevel++;
                if(fixedLevel) {
                    this._windowTable[i].setWindowLevel(fixedLevel);
                } else {
                    this._windowTable[i].setWindowLevel(currentLevel);
                }
            }
            this._dirtyWindowList = false;
        } else {
            logger.debug("WindowManager: No need to reorganize windows as the list is not dirty.");
        }
    },

    notifyRedraw: function () {
        var that = this;
        if(this._renderLock) { 
            window.cancelAnimationFrame(this._renderLock);
            this._renderLock = null;
        }

        this._renderLock = window.requestAnimationFrame( function (time)  {
            var windowInstance = null;
            var windowsRendered = 0;
            for(var i=0; i<that._windowTable.length;i++) {
                windowInstance = that._windowTable[i];
                if(windowInstance.isDirty()) {
                    windowInstance.render();
                    windowsRendered++;
                }
            }
            that._renderLock = null;
            that.notifyRedraw();
        });
    },

    _routeEvent: function (evt) {
        if(this._keyTarget) {
            return this._keyTarget.handleInput(evt);
        }
    }
});

WindowManager = new Framework.HTML5WindowManager("SystemWindowContainer", 10);
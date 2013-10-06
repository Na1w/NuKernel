/*
    
*/
require("WindowManager.js");

Class.create("Framework.Window", {
    initialize: function (x, y, width, height, title) {
        this._uniqueId = null;
        this._domWindow = null;
        this._contentViewHolder = null;
        this._handler = null;
        this._mouseState = 0;
        this._posX = x || 200;
        this._posY = y || 200;
        this._width = width || 200;
        this._height = height || 200;
        this._dirty = false;
        this._styleReferences = [];
        this._styleHolder = document.getElementsByTagName('head')[0];

        WindowManager.registerWindow(this);
    },

    _generateCssForNode: function (attachToNode, name, color, x, y, width, height, fixed, visible, margin, custom) {
        var style = document.createElement('style');
        style.type = 'text/css';
        var className = name + this.getUniqueId();
        var unit = (fixed ? 'px' : "%");

        style.innerHTML = '.'+className + ' {' +
                            'width:' + width + unit + ';' +
                            'height:' + height + unit + ';'+
                            'border-style: none;' +
                            'background-color: ' + (color ? color : ' #000') + ';' +
                            'left: ' + x + unit + ';' + 
                            'top: ' + y + unit + ';' +
                            ( margin ? ('margin:' + margin + ';') : "") + 
                            'position: ' + (fixed ? 'fixed' : 'relative') + ';' +
                            'display: ' + (visible ? 'block' : 'none') +';' +
                            'overflow: hidden;' +
                            (custom ? custom + ";" : "" ) +
                            '}';

        this._styleReferences.push(style);
        this._styleHolder.appendChild(style);
        if(attachToNode) {
            attachToNode.className = attachToNode.className + " " + className;
        }
    },

    _createDragRect: function () {
        var outerDragRect = document.createElement('div');
        this._generateCssForNode(outerDragRect, 
                                "WindowDragClass",
                                0,
                                this._posX,
                                this._posY,
                                this._width,
                                this._height,
                                true,
                                false,
                                null,
                                "padding:5px");

        var title = document.createElement('div'); 
        title.onselectstart= function () { return true} ;

        this._generateCssForNode(title,
                                 "WindowTitle",
                                 "#ccc",
                                 0,
                                 0,
                                 100,
                                 10,
                                 false,
                                 true,
                                 null,
                                 "pointer-events:none; insect: 5px");
        title.innerHTML = "Window " + this.getUniqueId();

        outerDragRect.appendChild(title); 

        outerDragRect.setAttribute("behavior-dragable", "true");
        return outerDragRect;
    },

    _getWindowRepresentation: function () {
    /* Create layout */

        var fragment = document.createDocumentFragment();
        var contentViewHolder = document.createElement('div');
        
        this._domWindow = this._createDragRect();

        var insect = 5;

        this._generateCssForNode(contentViewHolder, 
                                "WindowContentView",
                                "#FFF",
                                0,
                                0,
                                100,
                                90,
                                false,
                                true,
                                null);

        this._domWindow.appendChild(contentViewHolder);
        this._contentViewHolder = contentViewHolder;
        fragment.appendChild(this._domWindow);

        return fragment;
    },

    _getLocalStyle: function () {
        var element = this._domWindow;
        return element.style;
    },

    processDown: function (evt) {
       // this._getLocalStyle().opacity = 0.2;
        if(this.getFixedLevel()) {
            this.orderFront();
        } else {
            this.makeKeyAndOrderFront();
        }
    },

    processUp: function (evt) {
      //  this._getLocalStyle().opacity = 1.0;
    },

    isMyDragArea: function (element) {
        if(this._domWindow === element) {
            return true;
        }
    },

    setFixedLevel: function (level) {
        this._fixedLevel = level;
    },

    getFixedLevel: function () {
        return this._fixedLevel;
    },

    isDirty: function () {
        return this._dirty;
    },

    setPosition: function (x,y) {
        if(this._posX !== x || this._posY !== y ) {
            this._posX = x;
            this._posY = y;
            this._dirty = true;
        }
    },

    render: function () {
        var styleElement = this._getLocalStyle();

        styleElement.left = this._posX + "px";
        styleElement.top = this._posY + "px";
        this._dirty = false;
    },

    setWindowHandler: function (handler) {
        this._handler = handler;
    },

    setContentView: function (content) {
        this._contentViewHolder.appendChild(content);
    },

    getStyle: function () {

    },

    getDomRepresentation: function () {
        return this._getWindowRepresentation();
    },

    setUniqueId: function (id) {
        this._uniqueId = id;
    },

    getUniqueId: function () {
        return this._uniqueId;
    },

    _performOnSelf: function (func) {
        if(this._domWindow) {
            func.call(this, this._domWindow);
        }
    },

    orderFront: function () {
        WindowManager.moveToFront(this);
        var styleElement = this._getLocalStyle();

        styleElement.display = "block";
    },

    orderOut: function () {
        var styleElement = this._getLocalStyle();

        styleElement.display = "none";
    },

    makeKeyAndOrderFront: function () {
        this.orderFront();
        WindowManager.makeKey(this);
    },

    setWindowLevel: function (level) {
        this._performOnSelf(function (element) {
            element.style["z-index"] = level;
        });
    },

    handleInput: function (event) {
        alert("blah");
    },

    close: function () {
        WindowManager.unregisterWindow(this);

        var parent = this._domWindow.parentNode;
        parent.removeChild(this._domWindow); 
        this._domWindow = null;

        for(var i=0;i < this._styleReferences.length; i++) {
            this._styleHolder.removeChild(this._styleReferences[i]);
        }
        this._styleReferences = [];
    }
});

/* Save some typing again... */
window.Window = Framework.Window;
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
    A lightweight class framework,
    Supports single inheritance using javascripts native prototype chain for minimal overhead,
    supports superclass invokation of methods via this._superClass. 

    Ex: 
    Assume the superClass has a method called "createObject", 
    In our new class we override createObject with the following

    createObject: function (inArg) {
        console.debug("Creating object");
        return this._superClass.createObject(inArg);
    }
*/

/* Return the class name from an class/namespace combo */
function getClassName(includingNameSpace) {
    var nsArray = includingNameSpace.split(".");
    return nsArray.pop();
};

/* Defines a property in a namespace, allocates holders for the namespace if necessary */
function DefineInNameSpace(namespace, object) {
    var nsArray = namespace.split(".");
    var propertyName = nsArray.pop();
    var root = window;

    for(var i = 0; i < nsArray.length; i++) {
        if(!root[nsArray[i]]) {
            root[nsArray[i]] = {};
        }
        root = root[nsArray[i]];
    }
    root[propertyName] = object;
};

/* Retrieves the property defined by the namespacePath */
function RetriveFromNamespace(namespacePath) {
    var nsArray = namespacePath.split(".");
    var propertyName = nsArray.pop();
    var root = window;

    for(var i = 0; i < nsArray.length; i++) {
        if(!root[nsArray[i]]) {
            root[nsArray[i]] = {};
        }
        root = root[nsArray[i]];
    }
    return root[propertyName];
}

/* Compiles the class definition and links it to the prototype chain if necessary */
function ClassDefine(className, superClass, hash) {
    var superClassDef = superClass;
    var propertyTable = hash || null;

    // Set the swap the properties if the superClass argument is missing.
    if(!propertyTable) {
        propertyTable = superClass; 
        superClassDef = null;
    }

    // Link in super class and automatically invoke it's constructor upon allocation
    // Notice: The super class constructor will ALWAYS be called before the class constructor,
    // This is by design to allow the class derative to modify the state after the superclass been 
    // initialized.

    var initSuperClass = "";
    if(superClassDef) {
        initSuperClass = "var superClass = " + superClassDef.className + "; ";
        initSuperClass += "this._superClass = superClass.prototype;";
        initSuperClass += "superClass.apply(this, arguments);";
    } else {
        initSuperClass += "this._superClass = null;";
    }

    var init = " { " + initSuperClass;
    // Create class constructor
    if(propertyTable.initialize) {
        var initTail = '(' + propertyTable.initialize.toString() + ').apply(this, arguments)';
        init += initTail;
        delete propertyTable.initialize;
    } 
    init = init + " } ";
    
    var classBase = "function " + getClassName(className) + "() " + init; 
    var classObject = eval('(' + classBase + ')');
    // Fix up prototype chain
    if(superClassDef) {
        classObject.prototype = eval("Object.create(" + superClassDef.className + ".prototype);");
    }

    //Install methods
    for(var key in propertyTable) {
        classObject.prototype[key] = propertyTable[key];
    }

    classObject.className = className;
    classObject.prototype.className = className;
    DefineInNameSpace(className, classObject);
}

/* Create basic class framework wrapper */
ClassDefine("Framework.classFactory", {
    initialize: function () {
        if(console) {
            console.debug("ClassFactory: initialized.");
        }
    },
    /* Defines a class */
    create: function (className, superClass, hash) {
        ClassDefine(className, superClass, hash);
    },

    /* Compares if the class is an instance of anotherKlass */
    isA: function (klass, anotherKlass) {
        if(anotherKlass && anotherKlass.className) {
            var classProto = RetriveFromNamespace(anotherKlass.className);
            return klass instanceof classProto;
        }
        return false;
    }
});

Class = new Framework.classFactory();

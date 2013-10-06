require("Window.js");

for(var i = 1; i<10; i++) {
    var offset = i * 20;

    var myWindow = new Window(offset, 50+ offset, 200, 200, "test");

    var content = document.createElement("div");
    var button = document.createElement("button");
    content.width = "100%";
    content.height = "100%";
    
    button.appendChild(document.createTextNode("Close Me"));
    content.appendChild(button);

    var generateHandler = function (instance) {
        return function () {
            instance.close();
        }
    };
    button.onclick = generateHandler(myWindow);

    myWindow.setContentView(content);
    myWindow.orderFront();
}
/*
    Playground to verify threading.

    Notice: The "sleep" method used here will utilities 100% cpu time 
    while sleeping, don't use it for any real application, it's simply 
    a demonstration to throttle the output of these threads.

    Use setTimeout or something if you really have to sleep.
*/
require("ProcessManager.js");

ProcessManager.spawnProcess("KillerThread", 
{ 
 sleep: function(howLong) {
    var targetTime = Date.now() + howLong;
    while(targetTime > Date.now())
        ;
 },

 init: function () {
    // Runs for 4 seconds before it exits the loop.
    var start = Date.now();
    var endTime = start + (4 * 1000);
    var running = true;
    self.performRPC("logger.debug", "Hello from MrKillerThread");

    do {
        that.sleep(1500);
        var sample = Date.now()
        self.performRPC("logger.debug", "Thread 1 says : " + Math.floor((sample - start)/1000) + 
            " second(s) since launch...");
        if(endTime < sample) {
            running = false;
        } 
    } while(running)
    self.performRPC("ProcessManager.listProcesses");
    self.performRPC("logger.debug", "***** Swining the axe- Killing process 1");
    self.performRPC("ProcessManager.destroyProcess", 1);
    self.performRPC("ProcessManager.listProcesses");
    self.performRPC("ProcessManager.teardownAllThreads");
    return 0;
 }
});

/* I just happen to know that this one will be process 1  as it's spawned after process 0 :-)
   but genereally, but it's not good practice really to hardcode it this way :-) */

ProcessManager.spawnProcess("TheVictim", 
{ 
 sleep: function(howLong) {
    var targetTime = Date.now() + howLong;
    while(targetTime > Date.now())
        ;
 },

 init: function () {
    var a = Date.now() + (20*1000); // <--- Notice this would run for 20 seconds if it wasn't killed
    var c = 0;
    self.performRPC("logger.debug", "Hello World from TheVictimThread");
    while(a > Date.now()) {
        that.sleep(500);
        self.performRPC("logger.debug", "Thread 2 says " + new Date().getMinutes() +
         " minute past the hour...");
    }
    return 0;
 }
});

ProcessManager.spawnProcess("DumbThreadThatDoesNothing", {});
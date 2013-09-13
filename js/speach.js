(function() {
    "use strict";
    
    var context = this;
    function defineCommands() {
        if (context.annyang) {
            // Let's define a command.
            var commands = {
                'start request': function() {
                    console.log('Voice command: start request');
                },
                'clear': function() {
                    console.log('Voice command: clear');
                },
                'save': function() {
                    console.log('Voice command: save');
                },
                'open': function() {
                    console.log('Voice command: open');
                },
                'show :page': function(page) {
                    console.log('Voice command: show page - ' + page);
                }
            };
            context.annyang.debug();
            // Initialize annyang with our commands
            context.annyang.init(commands);
            context.annyang.setLanguage('en');
            // Start listening.
            context.annyang.start();
        }
    }
    
    function loadAnnyag(callback){
        var ga = document.createElement('script');
        ga.type = 'text/javascript';
        ga.src = chrome.runtime.getURL('js/annyang.js');
        ga.onload = function() {
            callback.call(window);
        };
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(ga, s);
    };
    
    this.restClientSpeach = function(){
        loadAnnyag(defineCommands);
    };
    
}).call(this);
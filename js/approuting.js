function AppRouter() {
    if (typeof Router === 'undefined') {
        throw "Router is not loaded";
    }
    this.router = new Router();
}
AppRouter.prototype = {
    constructor: AppRouter,
    initialize: function() {
        this.requestsRoutes();
        this.appRoutes();
        
        this.router.start();
    },
    requestsRoutes: function() {
        this.router.route('', function() {
            window.restClientUI.showPage('request');
        });
        this.router.route('/index.html\\?request', function() {
            window.restClientUI.showPage('request');
        });
        this.router.route('/index.html\\?request/:source/:id', function(source, id) {
            window.restClientUI.showPage('request');
        });
        
    },
    
    appRoutes: function(){
        this.router.route('/index.html\\?history', function() {
            window.restClientUI.showPage('history');
        });
        this.router.route('/index.html\\?settings', function() {
            window.restClientUI.showPage('settings');
        });
        this.router.route('/index.html\\?about', function() {
            window.restClientUI.showPage('about');
        });
        this.router.route('/index.html\\?socket', function() {
            window.restClientUI.showPage('socket');
        });
        this.router.route('/index.html\\?saved', function() {
            window.restClientUI.showPage('saved');
        });
    }
}

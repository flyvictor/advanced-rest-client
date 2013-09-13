function AppRouter() {
    if (typeof Router === 'undefined') {
        throw "Router is not loaded";
    }
    this.router = new Router();
}
AppRouter.prototype = {
    constructor: AppRouter,
    initialize: function() {
        this.appRoutes();
        this.router.start();
    },
    
    appRoutes: function(){
        
        var firePageChangeEvent = function(page, details){
            details = details || null;
            var event = createCustomeEvent('pagechangeevent', {
                'page': page,
                'details': details
            });
            document.querySelector('body').dispatchEvent(event);
        };
        
        
        this.router.route('/index.html', function() {
            firePageChangeEvent('request');
        });
        this.router.route('/index.html\\?request', function() {
            firePageChangeEvent('request');
        });
        this.router.route('/index.html\\?request/:source/:id', function(source, id) {
            firePageChangeEvent('request', {source: source, id: id});
        });
        
        this.router.route('/index.html\\?history', function() {
            firePageChangeEvent('history');
        });
        this.router.route('/index.html\\?settings', function() {
            firePageChangeEvent('settings');
//            window.restClientUI.showPage('settings');
        });
        this.router.route('/index.html\\?about', function() {
            firePageChangeEvent('about');
//            window.restClientUI.showPage('about');
        });
        this.router.route('/index.html\\?socket', function() {
            firePageChangeEvent('socket');
//            window.restClientUI.showPage('socket');
        });
        this.router.route('/index.html\\?saved', function() {
            firePageChangeEvent('saved');
//            window.restClientUI.showPage('saved');
        });
    }
};
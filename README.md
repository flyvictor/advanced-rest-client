# Advanced Rest Client for Google Chrome &trade;

This is a next version of the Chrome Legacy App. Previous version was done using Google Web Toolkit. However, since Java can't be so flexible to meet app's requirements I decided to rewrite the app.
So I chose Angularjs framework.

Source code for previous app can be found at [Google Code](https://code.google.com/p/chrome-rest-client/).
And working app can be found in [Chrome Web Store](https://chrome.google.com/webstore/detail/advanced-rest-client/hgmloofddffdnphfgcellkdfbfbjeloo)

Since it is not possible to upgrade legacy apps to new Chrome Apps it will be new application.

Most relevant change since last version is HTTP connection engine. Previous version was based on XMLHttpRequest with all it's limitations:
* can't set some request headers listed in the spec as available only for browser to set
* can't read some response headers like Cookie (because of security issues).

This project's version is based on Chrome's [socket's API](https://developer.chrome.com/apps/sockets_tcp). Now there's no limitations for HTTP request but it is a javascript's implementation for HTTP communication.
Currently (May 12, 2014) Chrome socket API do not support SSL connections. However Chrome team is working on it right now. So either it will be available for use when app will be ready or there will be some kind of fallback for ssl connections.

Please, feel free to for repository, propose changes or suggest improvements. I'm working on it alone but there's over 300K developers using this tool every week.
const liveServer = require('live-server');

liveServer.start({
    port: 13444,
    open: false,
    root: './dist'
});

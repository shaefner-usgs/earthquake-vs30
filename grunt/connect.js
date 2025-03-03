'use strict';


var config = require('./config'),
    gateway = require('gateway'),
    proxy = require('http-proxy-middleware'),
    rewrite = require('http-rewrite-middleware');

var MOUNT_PATH = config.ini.MOUNT_PATH;

var addMiddleware = function(connect, options, middlewares) {
  middlewares.unshift( // add custom middleware to default middlewares[]
    proxy.createProxyMiddleware(MOUNT_PATH + '/data', {
      changeOrigin: true,
      headers: {
        'accept-encoding': 'identity',
      },
      target: 'https://' + config.ini.DATA_HOST
    }),
    proxy.createProxyMiddleware('/theme', {
      pathRewrite: {
        '^/theme': ''
      },
      target: 'http://localhost:' + config.templatePort
    }),
    rewrite.getMiddleware(getRewrites()),
    gateway(options.base[0], {
      '.php': 'php-cgi',
      'env': {
        'PHPRC': 'node_modules/hazdev-template/dist/conf/php.ini'
      }
    })
  );

  return middlewares;
};

var connect = {
  options: {
    hostname: '*'
  },

  build: {
    options: {
      base: config.build + '/' + config.src + '/htdocs',
      livereload: config.liveReloadPort,
      middleware: addMiddleware,
      port: config.buildPort
    }
  },

  dist: {
    options: {
      base: config.dist + '/htdocs',
      keepalive: true,
      middleware: addMiddleware,
      port: config.distPort
    }
  },

  template: {
    options: {
      base: 'node_modules/hazdev-template/dist/htdocs',
      middleware: addMiddleware,
      port: config.templatePort
    }
  }
};


/**
 * Get a list of rewrite rules for app
 *
 * @return {Array}
 */
function getRewrites() {
  return [
    {
      from: '^' + MOUNT_PATH + '/(.*)$',
      to: '/$1'
    }
  ];
}


module.exports = connect;

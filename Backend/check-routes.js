// Test script to verify route registration
const app = require('./src/app');

console.log('\n=== Checking Registered Routes ===\n');

function listRoutes(routes, prefix = '') {
  routes.forEach(route => {
    if (route.route) {
      const methods = Object.keys(route.route.methods).join(', ').toUpperCase();
      console.log(`${methods} ${prefix}${route.route.path}`);
    } else if (route.name === 'router') {
      listRoutes(route.handle.stack, prefix + route.regexp.source.replace('\\/?', '').replace('(?=\\/|$)', '').replace(/\\\//g, '/'));
    }
  });
}

const routes = app._router.stack.filter(r => r.route || r.name === 'router');
listRoutes(routes);

console.log('\n=== Route Check Complete ===\n');

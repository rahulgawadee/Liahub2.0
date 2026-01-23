require('dotenv').config();
const dashboardRoutes = require('./src/routes/dashboardRoutes');

console.log('\n=== Dashboard Routes Stack ===\n');

dashboardRoutes.stack.forEach((layer, index) => {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
    const path = layer.route.path;
    console.log(`${index + 1}. ${methods} /dashboard${path}`);
  }
});

console.log('\n=== Total routes: ' + dashboardRoutes.stack.filter(l => l.route).length + ' ===\n');

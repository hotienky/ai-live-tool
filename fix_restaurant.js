const fs = require('fs');
const path = require('path');

// 1. Fix bundle.js
const bundlePath = path.join(__dirname, 'backend-laravel/public/plugins/restaurant/bundle.js');
let bundle = fs.readFileSync(bundlePath, 'utf8');
// Replace table_number with number only in the table rendering and form binding
bundle = bundle.replace(/t\.table_number/g, 't.number');
bundle = bundle.replace(/form\.table_number/g, 'form.number');
bundle = bundle.replace(/table_number:''/g, "number:''");
fs.writeFileSync(bundlePath, bundle, 'utf8');
console.log('Fixed bundle.js');

// 2. Fix RestaurantController
const ctrlPath = path.join(__dirname, 'backend-laravel/app/Http/Controllers/Tenant/RestaurantController.php');
let ctrl = fs.readFileSync(ctrlPath, 'utf8');

// The error showed:
// select * from "restaurant_tables" order by "table_number" asc
ctrl = ctrl.replace(/orderBy\('table_number'\)/g, "orderBy('number')");

// Also check validation for table creation/updating
// Find `table_number` inside functions dealing with tables (not reservations)
// It usually looks like `table_number' => 'required|string` or similar
ctrl = ctrl.replace(/(['"])(table_number)(['"]\s*=>\s*['"](?:required|nullable)\|string\|max:20['"])/g, "$1number$3");

// Find update payload
ctrl = ctrl.replace(/only\(\['table_number'/g, "only(['number'");

fs.writeFileSync(ctrlPath, ctrl, 'utf8');
console.log('Fixed RestaurantController.php');

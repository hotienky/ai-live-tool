/**
 * Auto-generated stub bundle for module: booking
 * This registers sidebar items and routes via the hook system.
 * Replace with a full bundle when custom UI components are available.
 */
(function() {
  var id = 'booking';
  var hooks = (window.__APP_BRIDGE__ && window.__APP_BRIDGE__.hooks) || window.__APP_HOOKS__;
  if (!hooks) { console.warn('[Plugin:' + id + '] Hooks not available'); return; }

  // Register sidebar items
  hooks.addFilter('sidebar_items', function(items) {
    items.push({key:'booking/services',label:'Dịch vụ',icon:'Briefcase',featureGroup:'store',moduleId:'booking'},{key:'booking/appointments',label:'Lịch hẹn',icon:'CalendarDays',featureGroup:'store',moduleId:'booking'},{key:'booking/calendar',label:'Lịch',icon:'Calendar',featureGroup:'store',moduleId:'booking'});
    return items;
  });

  // Register admin routes
  hooks.addFilter('admin_routes', function(config) {
    Object.assign(config.routeToTab, {'booking/services':'booking-services','booking/appointments':'booking-appointments','booking/calendar':'booking-calendar'});
    return config;
  });

  // Register plugin
  var plugin = {
    id: id,
    name: 'Đặt lịch & Dịch vụ',
    version: '1.0.0',
    sidebar: {"group":"Đặt lịch","items":[{"key":"booking-services","label":"Dịch vụ","icon":"Briefcase","route":"booking\/services"},{"key":"booking-appointments","label":"Lịch hẹn","icon":"CalendarDays","route":"booking\/appointments"},{"key":"booking-calendar","label":"Lịch","icon":"Calendar","route":"booking\/calendar"}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__[id] = plugin;
})();

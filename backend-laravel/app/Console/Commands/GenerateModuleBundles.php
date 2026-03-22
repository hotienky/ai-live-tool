<?php

namespace App\Console\Commands;

use App\Models\Module;
use Illuminate\Console\Command;

/**
 * Auto-generate stub bundle.js files for modules that have sidebar config
 * but no frontend bundle. This ensures route registration via the hook system.
 *
 * Usage: php artisan modules:generate-bundles
 */
class GenerateModuleBundles extends Command
{
    protected $signature = 'modules:generate-bundles {--force : Overwrite existing bundles}';
    protected $description = 'Generate stub bundle.js + style.css for modules missing frontend bundles';

    public function handle(): int
    {
        $modules = Module::whereRaw('"is_active" = true')
            ->whereNotNull('sidebar')
            ->get();

        $generated = 0;
        $skipped = 0;

        foreach ($modules as $module) {
            $dir = public_path("plugins/{$module->module_id}");
            $bundlePath = "{$dir}/bundle.js";
            $stylePath = "{$dir}/style.css";

            if (file_exists($bundlePath) && !$this->option('force')) {
                $skipped++;
                continue;
            }

            // Ensure directory exists
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }

            // Generate bundle.js
            $js = $this->generateBundle($module);
            file_put_contents($bundlePath, $js);

            // Generate empty style.css if not exists
            if (!file_exists($stylePath)) {
                file_put_contents($stylePath, "/* {$module->name} styles */\n");
            }

            $this->info("✅ Generated: {$module->module_id}");
            $generated++;
        }

        $this->info("Done! Generated: {$generated}, Skipped: {$skipped}");
        return 0;
    }

    private function generateBundle(Module $module): string
    {
        $id = $module->module_id;
        $name = addslashes($module->name);
        $sidebar = $module->sidebar;
        $sidebarJson = json_encode($sidebar, JSON_UNESCAPED_UNICODE);

        // Build sidebar items registration
        $sidebarItems = [];
        $routeToTab = [];
        $group = $sidebar['group'] ?? '';

        foreach ($sidebar['items'] ?? [] as $item) {
            $route = $item['route'] ?? '';
            $label = addslashes($item['label'] ?? '');
            $icon = $item['icon'] ?? 'Box';
            $key = $item['key'] ?? $route;

            $sidebarItems[] = "{key:'{$route}',label:'{$label}',icon:'{$icon}',featureGroup:'store',moduleId:'{$id}'}";

            // Map route to tab
            $tab = $key;
            $routeToTab[] = "'{$route}':'{$tab}'";
        }

        $sidebarItemsJs = implode(',', $sidebarItems);
        $routeToTabJs = implode(',', $routeToTab);

        return <<<JS
/**
 * Auto-generated stub bundle for module: {$id}
 * This registers sidebar items and routes via the hook system.
 * Replace with a full bundle when custom UI components are available.
 */
(function() {
  var id = '{$id}';
  var hooks = (window.__APP_BRIDGE__ && window.__APP_BRIDGE__.hooks) || window.__APP_HOOKS__;
  if (!hooks) { console.warn('[Plugin:' + id + '] Hooks not available'); return; }

  // Register sidebar items
  hooks.addFilter('sidebar_items', function(items) {
    items.push({$sidebarItemsJs});
    return items;
  });

  // Register admin routes
  hooks.addFilter('admin_routes', function(config) {
    Object.assign(config.routeToTab, {{$routeToTabJs}});
    return config;
  });

  // Register plugin
  var plugin = {
    id: id,
    name: '{$name}',
    version: '1.0.0',
    sidebar: {$sidebarJson}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__[id] = plugin;
})();

JS;
    }
}

<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Auto-discover repositories: scan app/Repositories/*/
        // Convention: {Name}RepositoryInterface.php + {Name}Repository.php
        $repoPath = app_path('Repositories');
        if (!is_dir($repoPath)) return;

        foreach (scandir($repoPath) as $dir) {
            if ($dir === '.' || $dir === '..' || !is_dir("{$repoPath}/{$dir}")) continue;

            $namespace = "App\\Repositories\\{$dir}";

            // Find all *Interface.php files in this directory
            foreach (glob("{$repoPath}/{$dir}/*Interface.php") as $interfaceFile) {
                $interfaceName = basename($interfaceFile, '.php');
                $implName = str_replace('Interface', '', $interfaceName);

                $interfaceClass = "{$namespace}\\{$interfaceName}";
                $implClass = "{$namespace}\\{$implName}";

                if (interface_exists($interfaceClass) && class_exists($implClass)) {
                    $this->app->bind($interfaceClass, $implClass);
                }
            }
        }
    }

    public function boot(): void {}
}

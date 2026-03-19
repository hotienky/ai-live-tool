<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Create supported_languages table in central DB.
 * This is the master list of all languages the system supports.
 * Tenants pick from this list when adding languages.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('supported_languages')) {
            Schema::create('supported_languages', function (Blueprint $table) {
                $table->id();
                $table->string('code', 10)->unique();
                $table->string('name', 100);        // English name
                $table->string('native_name', 100);  // Native script name
                $table->string('flag', 10)->default('🌐');
                $table->boolean('is_active')->default(true);
                $table->integer('sort')->default(0);
                $table->timestamps();
            });
        }

        // Seed default supported languages
        $languages = [
            ['code' => 'vi', 'name' => 'Vietnamese',  'native_name' => 'Tiếng Việt',  'flag' => '🇻🇳', 'sort' => 1],
            ['code' => 'en', 'name' => 'English',      'native_name' => 'English',      'flag' => '🇬🇧', 'sort' => 2],
            ['code' => 'ja', 'name' => 'Japanese',     'native_name' => '日本語',        'flag' => '🇯🇵', 'sort' => 3],
            ['code' => 'zh', 'name' => 'Chinese',      'native_name' => '中文',          'flag' => '🇨🇳', 'sort' => 4],
            ['code' => 'ko', 'name' => 'Korean',       'native_name' => '한국어',        'flag' => '🇰🇷', 'sort' => 5],
            ['code' => 'th', 'name' => 'Thai',         'native_name' => 'ภาษาไทย',     'flag' => '🇹🇭', 'sort' => 6],
            ['code' => 'ru', 'name' => 'Russian',      'native_name' => 'Русский',      'flag' => '🇷🇺', 'sort' => 7],
            ['code' => 'fr', 'name' => 'French',       'native_name' => 'Français',     'flag' => '🇫🇷', 'sort' => 10],
            ['code' => 'de', 'name' => 'German',       'native_name' => 'Deutsch',      'flag' => '🇩🇪', 'sort' => 11],
            ['code' => 'es', 'name' => 'Spanish',      'native_name' => 'Español',      'flag' => '🇪🇸', 'sort' => 12],
            ['code' => 'it', 'name' => 'Italian',      'native_name' => 'Italiano',     'flag' => '🇮🇹', 'sort' => 13],
            ['code' => 'pt', 'name' => 'Portuguese',   'native_name' => 'Português',    'flag' => '🇵🇹', 'sort' => 14],
            ['code' => 'nl', 'name' => 'Dutch',        'native_name' => 'Nederlands',   'flag' => '🇳🇱', 'sort' => 15],
            ['code' => 'pl', 'name' => 'Polish',       'native_name' => 'Polski',       'flag' => '🇵🇱', 'sort' => 16],
            ['code' => 'sv', 'name' => 'Swedish',      'native_name' => 'Svenska',      'flag' => '🇸🇪', 'sort' => 17],
            ['code' => 'da', 'name' => 'Danish',       'native_name' => 'Dansk',        'flag' => '🇩🇰', 'sort' => 18],
            ['code' => 'fi', 'name' => 'Finnish',      'native_name' => 'Suomi',        'flag' => '🇫🇮', 'sort' => 19],
            ['code' => 'no', 'name' => 'Norwegian',    'native_name' => 'Norsk',        'flag' => '🇳🇴', 'sort' => 20],
            ['code' => 'cs', 'name' => 'Czech',        'native_name' => 'Čeština',      'flag' => '🇨🇿', 'sort' => 21],
            ['code' => 'el', 'name' => 'Greek',        'native_name' => 'Ελληνικά',     'flag' => '🇬🇷', 'sort' => 22],
            ['code' => 'ro', 'name' => 'Romanian',     'native_name' => 'Română',       'flag' => '🇷🇴', 'sort' => 23],
            ['code' => 'hu', 'name' => 'Hungarian',    'native_name' => 'Magyar',       'flag' => '🇭🇺', 'sort' => 24],
            ['code' => 'tr', 'name' => 'Turkish',      'native_name' => 'Türkçe',       'flag' => '🇹🇷', 'sort' => 25],
            ['code' => 'ar', 'name' => 'Arabic',       'native_name' => 'العربية',      'flag' => '🇸🇦', 'sort' => 26],
            ['code' => 'hi', 'name' => 'Hindi',        'native_name' => 'हिन्दी',       'flag' => '🇮🇳', 'sort' => 27],
        ];

        foreach ($languages as $lang) {
            if (!DB::table('supported_languages')->where('code', $lang['code'])->exists()) {
                DB::table('supported_languages')->insert(array_merge($lang, [
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('supported_languages');
    }
};

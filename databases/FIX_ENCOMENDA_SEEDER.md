# Fix for EncomendaSeeder Error

## Problem
The `EncomendaSeeder` is trying to insert a `name` column into `encomenda_items` table, but this column doesn't exist.

## Error Message
```
SQLSTATE[42S22]: Column not found: 1054 Unknown column 'name' in 'field list'
```

## Solutions

### Option 1: Add the `name` column to the table (Recommended if you need it)

Run this SQL migration in your Laravel backend:

```sql
ALTER TABLE `encomenda_items` 
ADD COLUMN `name` VARCHAR(255) NULL AFTER `encomenda_id`;
```

Or create a Laravel migration:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('encomenda_items', function (Blueprint $table) {
            $table->string('name')->nullable()->after('encomenda_id');
        });
    }

    public function down(): void
    {
        Schema::table('encomenda_items', function (Blueprint $table) {
            $table->dropColumn('name');
        });
    }
};
```

### Option 2: Update the Seeder to match existing table structure

If the table already has a different column name (like `item_name`, `product_name`, `description`, etc.), update your `EncomendaSeeder.php`:

**Before:**
```php
'encomenda_id' => 1,
'name' => 'Bolo Grande',
'quantity' => 1,
// ...
```

**After (if column is `item_name`):**
```php
'encomenda_id' => 1,
'item_name' => 'Bolo Grande',  // or whatever the actual column name is
'quantity' => 1,
// ...
```

### Option 3: Check the actual table structure

To see what columns exist in your `encomenda_items` table, run:

```bash
php artisan db:show --table=encomenda_items
```

Or check your migration file that creates the `encomenda_items` table.

## Quick Fix

The fastest solution is to check your `encomenda_items` migration file and see what columns it defines, then update the seeder accordingly.

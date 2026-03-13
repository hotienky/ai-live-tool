# Architecture Standards — ReadComment Backend Laravel

> Based on the vsecure-api reference architecture. All new features MUST follow this pattern.

---

## Request Flow

```
Route → Controller → Action → Repository → Database
                       ↓
                  Transformer → JSON Response
```

### Layer Responsibilities

| Layer | Responsibility | Rules |
|---|---|---|
| **Route** | URL mapping → Controller method | NO inline closures. NO business logic. Split by module files. |
| **Controller** | Thin. Delegates to Action | NO `DB::` calls. NO business logic. Only receives request + DI resolves Action → calls `$action()`. |
| **Action** | Business logic container | Validation, authorization, orchestration. Uses Repositories for data. Uses Transformers for output. Uses `DB::beginTransaction()` for complex ops. |
| **Repository** | Data access layer | ALL database interaction goes here. Extends `BaseEloquentRepository`. Uses Pipeline for filtering/search. |
| **Pipeline** | Query filtering | Composes QueryBuilder Filter pipes. Each filter = one concern (search, status, date range, etc.) |
| **Transformer** | Response shaping | Maps Model → API response array. Extends `BaseTransformer`. Keeps controllers and actions clean. |
| **Service** | External integrations | Third-party APIs, file uploads, notifications. Injected into Actions. |

---

## Directory Structure

```
app/
├── Actions/
│   ├── Tenant/              # Tenant-scoped actions
│   │   ├── Product/
│   │   │   ├── BaseAction.php
│   │   │   ├── IndexAction.php
│   │   │   ├── StoreAction.php
│   │   │   ├── ShowAction.php
│   │   │   └── UpdateAction.php
│   │   ├── Order/
│   │   └── ...
│   └── Master/              # Master panel actions
│       ├── Tenant/
│       └── Auth/
├── Http/
│   ├── Controllers/
│   │   ├── Tenant/          # Tenant-scoped controllers
│   │   │   ├── ProductsController.php
│   │   │   ├── OrdersController.php
│   │   │   └── ...
│   │   ├── Master/          # Master panel controllers
│   │   │   ├── AuthController.php
│   │   │   └── TenantsController.php
│   │   ├── Storefront/      # Public storefront controllers
│   │   └── Controller.php
│   ├── Middleware/
│   └── Requests/            # Form Request validation classes
├── Models/
├── Pipelines/
│   ├── AbstractFilterPipeline.php
│   ├── ProductFilterPipeline.php
│   └── ...
├── QueryBuilder/
│   ├── Filter.php           # Abstract filter base
│   ├── Sort.php             # Abstract sort base
│   ├── Product/
│   │   ├── Search.php
│   │   ├── Status.php
│   │   └── Category.php
│   └── ...
├── Repositories/
│   ├── BaseRepoInterface.php
│   ├── BaseEloquentRepository.php
│   ├── Product/
│   │   ├── ProductRepositoryInterface.php
│   │   └── ProductRepository.php
│   └── ...
├── Services/
├── Traits/
│   ├── ApiResponse.php
│   └── HandlesValidation.php
└── Transformers/
    ├── BaseTransformer.php
    ├── ProductTransformer.php
    └── ...

routes/
├── api.php                  # Main entry — imports module files
├── tenantModules/           # Tenant-scoped route files
│   ├── products.php
│   ├── orders.php
│   ├── customers.php
│   └── ...
└── masterModules/           # Master panel route files
    ├── auth.php
    ├── tenants.php
    └── ...
```

---

## Route Organization

### `routes/api.php` — Main entry point

```php
Route::get('/health', fn () => ...);

// Storefront (public, tenant-scoped)
Route::middleware([TenantMiddleware::class])
    ->prefix('storefront')
    ->group(function () {
        foreach (glob(__DIR__ . '/storefrontModules/*.php') as $file) {
            require $file;
        }
    });

// Tenant Admin (authenticated, tenant-scoped)
Route::middleware([TenantMiddleware::class, TokenAuth::class])
    ->group(function () {
        foreach (glob(__DIR__ . '/tenantModules/*.php') as $file) {
            require $file;
        }
    });

// Master Panel (authenticated)
Route::prefix('master')
    ->group(function () {
        foreach (glob(__DIR__ . '/masterModules/*.php') as $file) {
            require $file;
        }
    });
```

### Module file example: `routes/tenantModules/products.php`

```php
<?php
use App\Http\Controllers\Tenant\ProductsController;

Route::prefix('products')->group(function () {
    Route::get('/', [ProductsController::class, 'index']);
    Route::post('/', [ProductsController::class, 'store']);
    Route::get('/{product}', [ProductsController::class, 'show']);
    Route::put('/{product}', [ProductsController::class, 'update']);
    Route::delete('/{product}', [ProductsController::class, 'destroy']);
});
```

---

## Controller Pattern

Controllers are **thin**. Each method receives the Request + the Action (via DI), then delegates.

```php
<?php

namespace App\Http\Controllers\Tenant;

use App\Actions\Tenant\Product\IndexAction;
use App\Actions\Tenant\Product\StoreAction;
use App\Actions\Tenant\Product\ShowAction;
use App\Actions\Tenant\Product\UpdateAction;
use App\Actions\Tenant\Product\DestroyAction;
use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductsController extends Controller
{
    public function index(IndexAction $action)
    {
        return $action();
    }

    public function store(Request $request, StoreAction $action)
    {
        return $action($request);
    }

    public function show(Product $product, ShowAction $action)
    {
        return $action($product);
    }

    public function update(Request $request, Product $product, UpdateAction $action)
    {
        return $action($request, $product);
    }

    public function destroy(Product $product, DestroyAction $action)
    {
        return $action($product);
    }
}
```

---

## Action Pattern

Actions contain business logic and are invoked via `__invoke()`.

### BaseAction (shared per module)

```php
<?php

namespace App\Actions\Tenant\Product;

use App\Repositories\Product\ProductRepositoryInterface;
use App\Transformers\ProductTransformer;
use App\Traits\ApiResponse;

class BaseAction
{
    use ApiResponse;

    protected $productRepository;
    protected $productTransformer;

    public function __construct(
        ProductRepositoryInterface $productRepository,
        ProductTransformer $productTransformer
    ) {
        $this->productRepository = $productRepository;
        $this->productTransformer = $productTransformer;
    }
}
```

### IndexAction

```php
<?php

namespace App\Actions\Tenant\Product;

class IndexAction extends BaseAction
{
    public function __invoke()
    {
        $filters = request()->all();
        $products = $this->productRepository->index($filters);
        $products['items'] = $this->productTransformer
            ->transformCollection(collect($products['items']));
        return $this->successResponse($products, 'Products retrieved');
    }
}
```

### StoreAction (with validation + transaction)

```php
<?php

namespace App\Actions\Tenant\Product;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class StoreAction extends BaseAction
{
    public function __invoke(Request $request)
    {
        try {
            DB::beginTransaction();

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'price' => 'required|numeric|min:0',
                // ...rules
            ]);

            if ($validator->fails()) {
                return $this->errorResponse('Validation failed', 422,
                    $validator->errors()->toArray());
            }

            $product = $this->productRepository->store($request->only([
                'name', 'price', 'sku', ...
            ]));

            DB::commit();
            return $this->successResponse(
                $this->productTransformer->transform($product),
                'Product created', 201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse($e->getMessage(), 500);
        }
    }
}
```

---

## Repository Pattern

### Interface (extends BaseRepoInterface)

```php
<?php

namespace App\Repositories\Product;

use App\Repositories\BaseRepoInterface;

interface ProductRepositoryInterface extends BaseRepoInterface
{
    public function index($filters = null);
    public function findWithDetails($id);
    public function findBySlugOrId($identifier);
}
```

### Implementation (extends BaseEloquentRepository)

```php
<?php

namespace App\Repositories\Product;

use App\Models\Product;
use App\Repositories\BaseEloquentRepository;
use App\Pipelines\ProductFilterPipeline;

class ProductRepository extends BaseEloquentRepository
    implements ProductRepositoryInterface
{
    public function __construct(Product $model)
    {
        parent::__construct($model);
    }

    public function index($filters = null)
    {
        $filters = $filters ?? request()->all();
        $query = $this->query()->with(['category', 'brand']);
        $query = ProductFilterPipeline::run($query, $filters);
        return $this->paginate($query, $filters['per_page'] ?? 15);
    }

    public function findWithDetails($id)
    {
        return $this->query()->with(['category', 'brand', 'variants'])->find($id);
    }

    public function findBySlugOrId($identifier)
    {
        return $this->query()
            ->where('id', $identifier)
            ->orWhere('slug', $identifier)
            ->first();
    }
}
```

---

## Pipeline + QueryBuilder Pattern

### FilterPipeline

```php
<?php

namespace App\Pipelines;

class ProductFilterPipeline extends AbstractFilterPipeline
{
    protected $pipes = [
        \App\QueryBuilder\Product\Search::class,
        \App\QueryBuilder\Product\Category::class,
        \App\QueryBuilder\Product\Status::class,
        \App\QueryBuilder\Product\PriceRange::class,
    ];

    public static function run($builder, array $context)
    {
        return app(static::class)->with($context)->send($builder)->thenReturn();
    }
}
```

### QueryBuilder Filter Pipe

```php
<?php

namespace App\QueryBuilder\Product;

use App\QueryBuilder\Filter;

class Search extends Filter
{
    protected function applyFilters($builder, $context)
    {
        return $builder->where(function ($q) use ($context) {
            $q->where('name', 'like', '%' . $this->value($context) . '%')
              ->orWhere('sku', 'like', '%' . $this->value($context) . '%');
        });
    }
}
```

---

## Transformer Pattern

```php
<?php

namespace App\Transformers;

use App\Models\Product;

class ProductTransformer extends BaseTransformer
{
    public function transform($item): array
    {
        return [
            'id' => $item->id,
            'name' => $item->name,
            'slug' => $item->slug,
            'price' => $item->price,
            'sku' => $item->sku,
            'category' => $item->category?->name,
            'brand' => $item->brand?->name,
            'is_active' => $item->is_active,
            'created_at' => $item->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}
```

---

## Key Rules

### ❌ NEVER do this

```php
// Controller with DB:: calls
public function index() {
    return response()->json(DB::table('products')->get());
}

// Inline closures in routes
Route::get('/products', fn () => response()->json(DB::table('products')->get()));

// Business logic in controllers
public function store(Request $request) {
    $data = $request->validate([...]);
    $product = Product::create($data);
    return response()->json($product);
}
```

### ✅ ALWAYS do this

```php
// Thin controller → Action
public function index(IndexAction $action) {
    return $action();
}

// Action uses Repository + Transformer
public function __invoke() {
    $data = $this->productRepository->index(request()->all());
    $data['items'] = $this->transformer->transformCollection(collect($data['items']));
    return $this->successResponse($data);
}

// Repository handles all DB interaction
public function index($filters = null) {
    $query = $this->query()->with(['category']);
    $query = ProductFilterPipeline::run($query, $filters ?? []);
    return $this->paginate($query);
}
```

---

## Checklist for Adding a New Feature

1. **Model** — Create Eloquent model in `app/Models/`
2. **Repository** — Create Interface + Implementation in `app/Repositories/Module/`
3. **Register** — Bind in `app/Providers/RepositoryServiceProvider.php`
4. **Transformer** — Create in `app/Transformers/` (if API output needed)
5. **Pipeline** — Create FilterPipeline + QueryBuilder pipes (if listing with filters)
6. **Actions** — Create BaseAction + individual actions in `app/Actions/{Tenant|Master}/Module/`
7. **Controller** — Create thin controller in `app/Http/Controllers/{Tenant|Master}/`
8. **Route** — Add route file in `routes/{tenantModules|masterModules}/`
9. **Test** — Verify endpoint works end-to-end

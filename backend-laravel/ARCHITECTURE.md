# Backend Architecture Convention

## Layered Architecture Pattern

Mọi chức năng CRUD / API phải tuân thủ luồng xử lý sau:

```
Route → Controller → Action → Repository → Pipeline (nếu cần filter/sort) → Response
```

### Nguyên tắc cốt lõi

1. **Controller** = Thin wrapper. Chỉ nhận request, delegate cho Action, trả response.
2. **Action** = Business logic. Validation, transform data, gọi repository, side-effects (log, event, notification).
3. **Repository** = Database layer. Query, insert, update, delete. Không chứa business logic.
4. **Pipeline** = Query filter/sort. Xử lý `?search=`, `?sort_by=`, `?status=` qua chain of filters.
5. **KHÔNG BAO GIỜ** dùng `DB::table()` hoặc `Model::where()` trực tiếp trong Controller.

---

## File Structure

```
app/
├── Actions/
│   └── {Entity}/
│       ├── BaseAction.php          # Inject repo + traits (ApiResponse, LogsActivity)
│       ├── IndexAction.php         # List with pagination + filters
│       ├── ShowAction.php          # Get single record
│       ├── StoreAction.php         # Validate + create
│       ├── UpdateAction.php        # Validate + update
│       └── DestroyAction.php       # Delete
│
├── Http/Controllers/
│   └── {Context}/
│       └── {Entity}Controller.php  # THIN — only delegates to Actions
│
├── Pipelines/
│   ├── QueryPipeline.php           # Base pipeline runner
│   └── Filters/
│       ├── SearchFilter.php        # ?search=keyword
│       ├── SortFilter.php          # ?sort_by=name&sort_dir=asc
│       ├── StatusFilter.php        # ?status=active
│       └── DateRangeFilter.php     # ?from=...&to=...
│
├── Repositories/
│   ├── BaseRepoInterface.php
│   ├── BaseEloquentRepository.php
│   └── {Entity}/
│       ├── {Entity}RepositoryInterface.php
│       └── {Entity}Repository.php
│
└── Providers/
    └── RepositoryServiceProvider.php  # Interface → Impl bindings
```

---

## Code Standards

### Controller (THIN — max ~30 lines)

```php
class BannersController extends Controller
{
    public function index(IndexAction $action) { return $action(); }
    public function show($id, ShowAction $action) { return $action($id); }
    public function store(Request $request, StoreAction $action) { return $action($request); }
    public function update(Request $request, $id, UpdateAction $action) { return $action($request, $id); }
    public function destroy($id, DestroyAction $action) { return $action($id); }
}
```

### Action (Business Logic)

```php
namespace App\Actions\Banner;

use App\Repositories\Banner\BannerRepositoryInterface;
use App\Traits\ApiResponse;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;

class StoreAction
{
    use ApiResponse, LogsActivity;

    public function __construct(private BannerRepositoryInterface $repo) {}

    public function __invoke(Request $request)
    {
        try {
            $data = $request->validate([
                'title' => 'required|string|max:255',
                'image_url' => 'required|string',
                // ...
            ]);

            $banner = $this->repo->store($data);
            $this->logActivity('banner.created', 'banner', $banner->id, ['title' => $data['title']]);

            return $this->successResponse($banner, 'Banner created', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e->errors());
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
```

### Action with Pipeline (for listing with filters)

```php
class IndexAction
{
    use ApiResponse;

    public function __construct(
        private BannerRepositoryInterface $repo,
        private QueryPipeline $pipeline,
    ) {}

    public function __invoke()
    {
        $query = $this->repo->query();

        // Apply filters from request (?search=, ?status=, ?sort_by=)
        $query = $this->pipeline
            ->through([
                SearchFilter::class,    // filters ?search=
                StatusFilter::class,    // filters ?is_active=
                SortFilter::class,      // sorts by ?sort_by=&sort_dir=
            ])
            ->process($query);

        return $this->successResponse(
            $this->repo->paginate($query)
        );
    }
}
```

### Repository (Database Only)

```php
// Interface
interface BannerRepositoryInterface extends BaseRepoInterface
{
    public function findActive(): Collection;
    public function findByPosition(string $position): Collection;
}

// Implementation
class BannerRepository extends BaseEloquentRepository implements BannerRepositoryInterface
{
    public function __construct(Banner $model)
    {
        parent::__construct($model);
    }

    public function findActive(): Collection
    {
        return $this->model->where('is_active', true)->orderBy('sort_order')->get();
    }

    public function findByPosition(string $position): Collection
    {
        return $this->model->where('position', $position)->where('is_active', true)->get();
    }
}
```

### Pipeline Filter

```php
namespace App\Pipelines\Filters;

class SearchFilter
{
    public function handle($query, \Closure $next)
    {
        $search = request('search');
        if ($search) {
            // Each entity can define $searchable columns
            $searchable = $query->getModel()->searchable ?? ['name'];
            $query->where(function ($q) use ($search, $searchable) {
                foreach ($searchable as $col) {
                    $q->orWhere($col, 'ilike', "%{$search}%");
                }
            });
        }
        return $next($query);
    }
}
```

---

## Checklist cho mỗi chức năng mới

- [ ] Model tại `app/Models/{Entity}.php`
- [ ] Migration tại `database/migrations/`
- [ ] Repository Interface: `app/Repositories/{Entity}/{Entity}RepositoryInterface.php`
- [ ] Repository Implementation: `app/Repositories/{Entity}/{Entity}Repository.php`
- [ ] Đăng ký binding trong `RepositoryServiceProvider`
- [ ] Base Action: `app/Actions/{Entity}/BaseAction.php`
- [ ] Actions: Index, Show, Store, Update, Destroy
- [ ] Controller (thin): `app/Http/Controllers/{Context}/{Entity}Controller.php`
- [ ] Route tại `routes/tenant.php` hoặc tương ứng
- [ ] **KHÔNG** dùng `DB::table()` trong Controller hoặc Action
- [ ] **KHÔNG** viết query logic trong Controller
- [ ] List API phải dùng Pipeline cho filter/sort

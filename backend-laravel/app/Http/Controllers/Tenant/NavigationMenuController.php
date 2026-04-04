<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\NavigationMenu;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class NavigationMenuController extends Controller
{
    use ApiResponse;

    public function index()
    {
        try {
            $menus = NavigationMenu::all();
            return $this->successResponse($menus);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function show($id)
    {
        try {
            $menu = NavigationMenu::find($id);
            if (!$menu) return $this->notFoundResponse('Menu not found');
            return $this->successResponse($menu);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function getByLocation($location)
    {
        try {
            $menu = NavigationMenu::where('location', $location)->first();
            if (!$menu) return $this->notFoundResponse('Menu not found for location');
            return $this->successResponse($menu);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'name' => 'required|string|max:255',
                'location' => 'nullable|string',
                'json_data' => 'nullable|array',
                'translations' => 'nullable|array',
            ]);

            $menu = NavigationMenu::create($data);
            return $this->successResponse($menu, 'Navigation menu created', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $menu = NavigationMenu::find($id);
            if (!$menu) return $this->notFoundResponse('Menu not found');

            $data = $request->validate([
                'name' => 'nullable|string|max:255',
                'location' => 'nullable|string',
                'json_data' => 'nullable|array',
                'translations' => 'nullable|array',
            ]);

            $menu->update($data);
            return $this->successResponse($menu, 'Navigation menu updated');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function destroy($id)
    {
        try {
            $menu = NavigationMenu::find($id);
            if (!$menu) return $this->notFoundResponse('Menu not found');
            $menu->delete();
            return $this->successResponse(null, 'Navigation menu deleted');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}

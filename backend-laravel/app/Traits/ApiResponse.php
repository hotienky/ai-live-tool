<?php

namespace App\Traits;

trait ApiResponse
{
    protected function successResponse($data = null, string $message = 'Success', int $code = 200)
    {
        return response()->json([
            'type' => 'success',
            'message' => $message,
            'code' => $code,
            'data' => $data,
        ], $code);
    }

    protected function errorResponse(string $message, int $code = 400, array $errors = [])
    {
        return response()->json([
            'type' => 'error',
            'message' => $message,
            'code' => $code,
            'errors' => $errors,
        ], $code);
    }

    protected function validationErrorResponse($errors, string $message = 'Validation failed')
    {
        return response()->json([
            'type' => 'error',
            'message' => $message,
            'code' => 422,
            'errors' => $errors,
        ], 422);
    }

    protected function notFoundResponse(string $message = 'Resource not found')
    {
        return $this->errorResponse($message, 404);
    }

    protected function unauthorizedResponse(string $message = 'Unauthorized')
    {
        return $this->errorResponse($message, 401);
    }

    protected function formatPaginatedResponse($result)
    {
        return [
            'items' => $result->items(),
            'pagination' => [
                'total' => $result->total(),
                'per_page' => $result->perPage(),
                'current_page' => $result->currentPage(),
                'last_page' => $result->lastPage(),
                'from' => $result->firstItem(),
                'to' => $result->lastItem(),
                'has_more_pages' => $result->hasMorePages(),
            ],
        ];
    }

    protected function paginationResponse($result, string $message = 'Success', int $code = 200)
    {
        return response()->json([
            'type' => 'success',
            'message' => $message,
            'code' => $code,
            'data' => $this->formatPaginatedResponse($result),
        ], $code);
    }
}

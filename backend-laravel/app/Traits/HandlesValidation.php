<?php

namespace App\Traits;

use Illuminate\Support\Facades\Validator;

trait HandlesValidation
{
    /**
     * Validate request data and return errors if validation fails.
     *
     * @param array $data
     * @param array $rules
     * @param array $messages
     * @return \Illuminate\Support\MessageBag|null
     */
    protected function validateData(array $data, array $rules, array $messages = [])
    {
        $validator = Validator::make($data, $rules, $messages);

        if ($validator->fails()) {
            return $validator->errors();
        }

        return null;
    }

    /**
     * Validate and return error response if invalid.
     *
     * @return \Illuminate\Http\JsonResponse|null
     */
    protected function validateOrFail(array $data, array $rules, array $messages = [])
    {
        $errors = $this->validateData($data, $rules, $messages);

        if ($errors) {
            return $this->errorResponse('Validation failed', 422, $errors->toArray());
        }

        return null;
    }
}

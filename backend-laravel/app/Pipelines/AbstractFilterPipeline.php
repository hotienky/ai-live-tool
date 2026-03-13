<?php

namespace App\Pipelines;

use Illuminate\Pipeline\Pipeline;
use Throwable;

abstract class AbstractFilterPipeline extends Pipeline
{
    protected $context;

    protected function carry()
    {
        $context = $this->context;

        return function ($stack, $pipe) use ($context) {
            return function ($passable) use ($stack, $pipe, $context) {
                try {
                    if (is_callable($pipe)) {
                        return $pipe($passable, collect($context ?? []), $stack);
                    } elseif (!is_object($pipe)) {
                        [$name, $parameters] = $this->parsePipeString($pipe);
                        $pipe = $this->getContainer()->make($name);
                        $parameters = array_merge([$passable, collect($context ?? []), $stack], $parameters);
                    } else {
                        $parameters = [$passable, collect($context ?? []), $stack];
                    }

                    $carry = method_exists($pipe, $this->method)
                        ? $pipe->{$this->method}(...$parameters)
                        : $pipe(...$parameters);

                    return $this->handleCarry($carry);
                } catch (Throwable $e) {
                    return $this->handleException($passable, $e);
                }
            };
        };
    }

    protected function with(array $context): static
    {
        $this->context = $context;
        return $this;
    }
}

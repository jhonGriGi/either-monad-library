import type { ErrorType, OK } from './either-types';

/**
 * Interface for pattern matching expressions in fold operations
 * @template R - Return type of both functions
 * @template E - Error type
 * @template T - Success value type
 */
interface FoldExpression<R, E, T> {
    /** Function to handle error cases */
    fnError: (error: E) => R;
    /** Function to handle success cases */
    fnOk: (value: T) => R;
}

/**
 * Either monad implementation representing a value that can be either successful (Ok) or failed (Error)
 * @template T - Type of the success value
 * @template E - Type of the error value
 */
export class Either<T, E> {
    /**
     * Private constructor to ensure Either instances are created through static methods
     * @param value - Success value (only for Ok instances)
     * @param error - Error value (only for Error instances)
     * @param isOk - Internal flag to distinguish between Ok and Error states
     */
    private constructor(
        private readonly value: T | undefined,
        private readonly error: E | undefined,
        private readonly _isOk: boolean
    ) { }

    /**
     * Creates a successful Either instance containing a value
     * @template T - Type of the success value
     * @param value - The success value to wrap
     * @returns OK<T> - Success Either instance
     * @example
     * ```typescript
     * const result = Either.Ok(42);
     * console.log(result.getValue()); // 42
     * ```
     */
    static Ok<T>(value: T): OK<T> {
        return new Either(value, undefined, true) as OK<T>;
    }

    /**
     * Creates a failed Either instance containing an error
     * @template E - Type of the error value
     * @param error - The error value to wrap
     * @returns ErrorType<E> - Error Either instance
     * @example
     * ```typescript
     * const result = Either.Error(new Error('Something went wrong'));
     * console.log(result.getError().message); // Something went wrong
     * ```
     */
    static Error<E>(error: E): ErrorType<E> {
        return new Either(undefined, error, false) as ErrorType<E>;
    }

    /**
     * Type guard to check if Either contains a success value
     * @returns true if Either is Ok, false otherwise
     * @example
     * ```typescript
     * const result = Either.Ok(42);
     * if (result.isOk()) {
     *     console.log(result.getValue()); // TypeScript knows this is safe
     * }
     * ```
     */
    public isOk(): this is OK<T> {
        return this._isOk;
    }

    /**
     * Type guard to check if Either contains an error value
     * @returns true if Either is Error, false otherwise
     * @example
     * ```typescript
     * const result = Either.Error(new Error('Failed'));
     * if (result.isError()) {
     *     console.log(result.getError().message); // TypeScript knows this is safe
     * }
     * ```
     */
    public isError(): this is ErrorType<E> {
        return !this._isOk;
    }

    /**
     * Extracts the success value from Ok instance
     * @returns The success value
     * @throws Error if called on Error instance
     * @example
     * ```typescript
     * const result = Either.Ok(42);
     * console.log(result.getValue()); // 42
     * ```
     */
    public getValue(): T {
        if (!this.isOk()) {
            throw new Error('Cannot access value in a non-Ok instance');
        }

        return this.value as T;
    }

    /**
     * Extracts the error value from Error instance
     * @returns The error value
     * @throws Error if called on Ok instance
     * @example
     * ```typescript
     * const result = Either.Error(new Error('Failed'));
     * console.log(result.getError().message); // Failed
     * ```
     */
    public getError(): E {
        if (!this.isError()) {
            throw new Error('Cannot access error in a non-Error instance');
        }

        return this.error as E;
    }

    /**
     * Pattern matching for Either values - executes appropriate function based on Either state
     * @template R - Return type of both handler functions
     * @param expressions - Object containing handlers for Ok and Error cases
     * @returns Result of executing the appropriate handler function
     * @example
     * ```typescript
     * const result = Either.Ok(42);
     * const message = result.fold({
     *     fnOk: (value) => `Success: ${value}`,
     *     fnError: (error) => `Error: ${error.message}`
     * });
     * console.log(message); // Success: 42
     * ```
     */
    public fold<R>(expressions: FoldExpression<R, E, T>): R {
        return this.isError()
            ? expressions.fnError(this.error as E)
            : expressions.fnOk(this.value as T);
    }

    /**
     * Transforms the success value if Ok, otherwise returns Error unchanged
     * @template U - Type of the transformed value
     * @param fn - Transformation function to apply to success value
     * @returns Either<U, E> - New Either with transformed value or original error
     * @example
     * ```typescript
     * const result = Either.Ok(5).map(x => x * 2);
     * console.log(result.getValue()); // 10
     * ```
     */
    public map<U>(fn: (value: T) => U): Either<U, E> {
        return this.isOk() 
            ? Either.Ok(fn(this.value as T)) 
            : Either.Error(this.error as E);
    }

    /**
     * Chains Either-returning operations (monadic bind)
     * @template U - Type of the new success value
     * @param fn - Function that takes success value and returns an Either
     * @returns Either<U, E> - Flattened result of the operation
     * @example
     * ```typescript
     * const result = Either.Ok(5)
     *     .flatMap(x => x > 0 ? Either.Ok(x * 2) : Either.Error('Negative'));
     * console.log(result.getValue()); // 10
     * ```
     */
    public flatMap<U>(fn: (value: T) => Either<U, E>): Either<U, E> {
        return this.isOk() 
            ? fn(this.value as T) 
            : Either.Error(this.error as E);
    }

    /**
     * Transforms the error value if Error, otherwise returns Ok unchanged
     * @template F - Type of the new error value
     * @param fn - Function to transform the error value
     * @returns Either<T, F> - Either with transformed error type or original success
     * @example
     * ```typescript
     * const result = Either.Error('failed')
     *     .mapError(msg => new Error(msg.toUpperCase()));
     * console.log(result.getError().message); // FAILED
     * ```
     */
    public mapError<F>(fn: (error: E) => F): Either<T, F> {
        return this.isError() 
            ? Either.Error(fn(this.error as E)) 
            : Either.Ok(this.value as T);
    }

    /**
     * Safely extracts value with fallback for Error cases
     * @param defaultValue - Value to return if Either is Error
     * @returns The success value or the provided default value
     * @example
     * ```typescript
     * const result = Either.Error('failed').getOrElse('default');
     * console.log(result); // default
     * ```
     */
    public getOrElse(defaultValue: T): T {
        return this.isOk() ? this.value as T : defaultValue;
    }

    /**
     * Combines two Either values into a tuple
     * @template U - Type of the other Either's success value
     * @param other - Another Either to combine with
     * @returns Either<[T, U], E> - Tuple of both values if both are Ok, or first error encountered
     * @example
     * ```typescript
     * const result = Either.Ok(1).zip(Either.Ok(2));
     * console.log(result.getValue()); // [1, 2]
     * ```
     */
    public zip<U>(other: Either<U, E>): Either<[T, U], E> {
        return this.isError() 
            ? Either.Error(this.error as E)
            : other.isError() 
                ? Either.Error(other.getError())
                : Either.Ok([this.value as T, other.getValue()]);
    }

    /**
     * Combines two Either values using a function
     * @template U - Type of the other Either's success value
     * @template R - Type of the combined result
     * @param other - Another Either to combine with
     * @param fn - Function to combine the two success values
     * @returns Either<R, E> - Combined result if both are Ok, or first error encountered
     * @example
     * ```typescript
     * const result = Either.Ok(5).zipWith(Either.Ok(3), (a, b) => a + b);
     * console.log(result.getValue()); // 8
     * ```
     */
    public zipWith<U, R>(other: Either<U, E>, fn: (a: T, b: U) => R): Either<R, E> {
        return this.zip(other).map(([a, b]) => fn(a, b));
    }

    /**
     * Filters the success value with a predicate
     * @param predicate - Function to test the success value
     * @param error - Error to return if predicate fails or Either is already Error
     * @returns Either<T, E> - Original Either if predicate passes, Error otherwise
     * @example
     * ```typescript
     * const result = Either.Ok(5).filter(x => x > 3, 'Too small');
     * console.log(result.getValue()); // 5
     * ```
     */
    public filter(predicate: (value: T) => boolean, error: E): Either<T, E> {
        return this.isOk() && predicate(this.value as T) 
            ? this 
            : Either.Error(error);
    }

    /**
     * Alias for flatMap (functional programming convention)
     * @template U - Type of the new success value
     * @param fn - Function that returns an Either
     * @returns Either<U, E> - Result of the function
     * @example
     * ```typescript
     * const result = Either.Ok(5).find(x => Either.Ok(x * 2));
     * console.log(result.getValue()); // 10
     * ```
     */
    public find<U>(fn: (value: T) => Either<U, E>): Either<U, E> {
        return this.flatMap(fn);
    }

    /**
     * Converts Either to Promise (resolves Ok, rejects Error)
     * @returns Promise<T> - Promise that resolves with success value or rejects with error
     * @example
     * ```typescript
     * const result = Either.Ok(42);
     * result.toPromise().then(value => console.log(value)); // 42
     * ```
     */
    public toPromise(): Promise<T> {
        return this.isOk() 
            ? Promise.resolve(this.value as T)
            : Promise.reject(this.error);
    }

    /**
     * Converts Either to optional value
     * @returns T | undefined - Success value if Ok, undefined if Error
     * @example
     * ```typescript
     * const result = Either.Ok(42);
     * const optional = result.toOptional(); // 42
     * ```
     */
    public toOptional(): T | undefined {
        return this.isOk() ? this.value as T : undefined;
    }

    /**
     * Swaps the Ok and Error positions
     * @returns Either<E, T> - Either with swapped success and error types
     * @example
     * ```typescript
     * const result = Either.Ok(42).swap();
     * console.log(result.getError()); // 42
     * ```
     */
    public swap(): Either<E, T> {
        return this.isOk() 
            ? (Either.Error(this.value as unknown as E) as unknown as Either<E, T>)
            : (Either.Ok(this.error as unknown as T) as unknown as Either<E, T>);
    }

    /**
     * Recovers from error with a function that converts error to success value
     * @param fn - Function to convert error to success value
     * @returns Either<T, never> - Always returns Ok with either original or recovered value
     * @example
     * ```typescript
     * const result = Either.Error('failed').recover(err => `Recovered: ${err}`);
     * console.log(result.getValue()); // Recovered: failed
     * ```
     */
    public recover(fn: (error: E) => T): Either<T, never> {
        return this.isError() 
            ? Either.Ok(fn(this.error as E))
            : Either.Ok(this.value as T);
    }

    /**
     * Recovers from error with an Either-returning function
     * @param fn - Function that takes error and returns an Either
     * @returns Either<T, E> - Result of recovery function or original Ok
     * @example
     * ```typescript
     * const result = Either.Error('failed')
     *     .recoverWith(err => Either.Ok(`Recovered: ${err}`));
     * console.log(result.getValue()); // Recovered: failed
     * ```
     */
    public recoverWith(fn: (error: E) => Either<T, E>): Either<T, E> {
        return this.isError() ? fn(this.error as E) : this;
    }

    /**
     * Executes a side effect on success value without changing the Either
     * @param fn - Side effect function to execute on success value
     * @returns Either<T, E> - Original Either unchanged
     * @example
     * ```typescript
     * const result = Either.Ok(42)
     *     .tap(value => console.log(`Processing: ${value}`))
     *     .map(x => x * 2);
     * ```
     */
    public tap(fn: (value: T) => void): Either<T, E> {
        if (this.isOk()) fn(this.value as T);
        return this;
    }

    /**
     * Executes a side effect on error value without changing the Either
     * @param fn - Side effect function to execute on error value
     * @returns Either<T, E> - Original Either unchanged
     * @example
     * ```typescript
     * const result = Either.Error('failed')
     *     .tapError(error => console.log(`Error occurred: ${error}`))
     *     .recover(err => 'default');
     * ```
     */
    public tapError(fn: (error: E) => void): Either<T, E> {
        if (this.isError()) fn(this.error as E);
        return this;
    }
}
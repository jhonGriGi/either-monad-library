/**
 * Either monad implementation representing a value that can be either successful (Ok) or failed (Error)
 * @template T - Type of the success value
 * @template E - Type of the error value
 */
export declare class Either<T, E> {
    private constructor();
    
    /**
     * Creates a successful Either instance containing a value
     * @template T - Type of the success value
     * @param value - The success value to wrap
     * @returns OK<T> - Success Either instance
     */
    static Ok<T>(value: T): OK<T>;
    
    /**
     * Creates a failed Either instance containing an error
     * @template E - Type of the error value
     * @param error - The error value to wrap
     * @returns ErrorType<E> - Error Either instance
     */
    static Error<E>(error: E): ErrorType<E>;
    
    /**
     * Type guard to check if Either contains a success value
     * @returns true if Either is Ok, false otherwise
     */
    isOk(): this is OK<T>;
    
    /**
     * Type guard to check if Either contains an error value
     * @returns true if Either is Error, false otherwise
     */
    isError(): this is ErrorType<E>;
    
    /**
     * Extracts the success value from Ok instance
     * @returns The success value
     * @throws Error if called on Error instance
     */
    getValue(): T;
    
    /**
     * Extracts the error value from Error instance
     * @returns The error value
     * @throws Error if called on Ok instance
     */
    getError(): E;
    
    /**
     * Pattern matching for Either values - executes appropriate function based on Either state
     * @template R - Return type of both handler functions
     * @param expressions - Object containing handlers for Ok and Error cases
     * @returns Result of executing the appropriate handler function
     */
    fold<R>(expressions: { fnError: (error: E) => R; fnOk: (value: T) => R }): R;
    
    /**
     * Transforms the success value if Ok, otherwise returns Error unchanged
     * @template U - Type of the transformed value
     * @param fn - Transformation function to apply to success value
     * @returns Either<U, E> - New Either with transformed value or original error
     */
    map<U>(fn: (value: T) => U): Either<U, E>;
    
    /**
     * Chains Either-returning operations (monadic bind)
     * @template U - Type of the new success value
     * @param fn - Function that takes success value and returns an Either
     * @returns Either<U, E> - Flattened result of the operation
     */
    flatMap<U>(fn: (value: T) => Either<U, E>): Either<U, E>;
    
    /**
     * Transforms the error value if Error, otherwise returns Ok unchanged
     * @template F - Type of the new error value
     * @param fn - Function to transform the error value
     * @returns Either<T, F> - Either with transformed error type or original success
     */
    mapError<F>(fn: (error: E) => F): Either<T, F>;
    
    /**
     * Safely extracts value with fallback for Error cases
     * @param defaultValue - Value to return if Either is Error
     * @returns The success value or the provided default value
     */
    getOrElse(defaultValue: T): T;
    
    /**
     * Combines two Either values into a tuple
     * @template U - Type of the other Either's success value
     * @param other - Another Either to combine with
     * @returns Either<[T, U], E> - Tuple of both values if both are Ok, or first error encountered
     */
    zip<U>(other: Either<U, E>): Either<[T, U], E>;
    
    /**
     * Combines two Either values using a function
     * @template U - Type of the other Either's success value
     * @template R - Type of the combined result
     * @param other - Another Either to combine with
     * @param fn - Function to combine the two success values
     * @returns Either<R, E> - Combined result if both are Ok, or first error encountered
     */
    zipWith<U, R>(other: Either<U, E>, fn: (a: T, b: U) => R): Either<R, E>;
    
    /**
     * Filters the success value with a predicate
     * @param predicate - Function to test the success value
     * @param error - Error to return if predicate fails or Either is already Error
     * @returns Either<T, E> - Original Either if predicate passes, Error otherwise
     */
    filter(predicate: (value: T) => boolean, error: E): Either<T, E>;
    
    /**
     * Chains Either-returning operations (alias for flatMap)
     * @template U - Type of the new success value
     * @param fn - Function that returns an Either
     * @returns Either<U, E> - Result of the chained operation
     */
    chain<U>(fn: (value: T) => Either<U, E>): Either<U, E>;
    
    /**
     * Converts Either to Promise (resolves Ok, rejects Error)
     * @returns Promise<T> - Promise that resolves with success value or rejects with error
     */
    toPromise(): Promise<T>;
    
    /**
     * Converts Either to optional value
     * @returns T | undefined - Success value if Ok, undefined if Error
     */
    toOptional(): T | undefined;
    
    /**
     * Swaps the Ok and Error positions
     * @returns Either<E, T> - Either with swapped success and error types
     */
    swap(): Either<E, T>;
    
    /**
     * Recovers from error with a function that converts error to success value
     * @param fn - Function to convert error to success value
     * @returns Either<T, never> - Always returns Ok with either original or recovered value
     */
    recover(fn: (error: E) => T): Either<T, never>;
    
    /**
     * Recovers from error with an Either-returning function
     * @param fn - Function that takes error and returns an Either
     * @returns Either<T, E> - Result of recovery function or original Ok
     */
    recoverWith(fn: (error: E) => Either<T, E>): Either<T, E>;
    
    /**
     * Executes a side effect on success value without changing the Either
     * @param fn - Side effect function to execute on success value
     * @returns Either<T, E> - Original Either unchanged
     */
    tap(fn: (value: T) => void): Either<T, E>;
    
    /**
     * Executes a side effect on error value without changing the Either
     * @param fn - Side effect function to execute on error value
     * @returns Either<T, E> - Original Either unchanged
     */
    tapError(fn: (error: E) => void): Either<T, E>;
}

/** Type alias for successful Either with never error type */
export type OK<T> = Either<T, never>;

/** Type alias for failed Either with never success type */
export type ErrorType<E> = Either<never, E>;

/**
 * Overload for when fn() returns Either<U, V>
 * @template U - Type of the nested Either's success value
 * @template V - Type of the nested Either's error value
 * @template E - Type of the wrapper error (must extend Error)
 * @param args - Configuration object
 * @param args.fn - Function that returns a Promise of Either
 * @param args.ErrClass - Error constructor for caught exceptions
 * @returns Promise<Either<U, V | E>> - Promise of Either with flattened error types
 */
export declare function safeAsync<U, V, E extends Error>(args: {
    fn: () => PromiseLike<Either<U, V>>;
    ErrClass: new (...args: any[]) => E;
}): Promise<Either<U, V | E>>;

/**
 * Wraps an asynchronous operation that may throw, converting exceptions to Either
 * @template T - Type of the success value
 * @template E - Type of the error (must extend Error)
 * @param args - Configuration object
 * @param args.fn - Async function to execute safely
 * @param args.ErrClass - Error constructor for caught exceptions
 * @returns Promise<Either<T, E>> - Promise of Either result
 */
export declare function safeAsync<T, E extends Error>(args: {
    fn: () => PromiseLike<T>;
    ErrClass: new (...args: any[]) => E;
}): Promise<Either<T, E>>;

/**
 * Wraps a synchronous operation that may throw, converting exceptions to Either
 * @template T - Type of the success value
 * @template E - Type of the error (must extend Error)
 * @param args - Configuration object
 * @param args.fn - Function to execute safely
 * @param args.ErrClass - Error constructor for caught exceptions
 * @returns Either<T, E> - Either containing success value or wrapped error
 */
export declare function safeSync<T, E extends Error>(args: {
    fn: () => T;
    ErrClass: new (...args: any[]) => E;
}): Either<T, E>;

/**
 * Converts a nullable value to Either
 * @template T - Type of the value
 * @param value - Value that might be null or undefined
 * @returns Either<T, Error> - Ok if value exists, Error if null/undefined
 */
export declare function fromNullable<T>(value: T | null | undefined): Either<T, Error>;

/**
 * Creates Either based on predicate test
 * @template T - Type of the value
 * @param value - Value to test
 * @param predicate - Function to test the value
 * @param error - Error to return if predicate fails
 * @returns Either<T, Error> - Ok if predicate passes, Error otherwise
 */
export declare function fromPredicate<T>(
    value: T,
    predicate: (value: T) => boolean,
    error: Error
): Either<T, Error>;

/**
 * Combines array of Either values into Either of array
 * @template T - Type of success values
 * @template E - Type of error values
 * @param eithers - Array of Either values to combine
 * @returns Either<T[], E> - Array of all success values or first error encountered
 */
export declare function sequence<T, E>(eithers: Either<T, E>[]): Either<T[], E>;

/**
 * Separates Either array into success and error arrays
 * @template T - Type of success values
 * @template E - Type of error values
 * @param eithers - Array of Either values to partition
 * @returns [T[], E[]] - Tuple containing array of success values and array of errors
 */
export declare function partition<T, E>(eithers: Either<T, E>[]): [T[], E[]];

/**
 * Maps array values to Either and sequences the results
 * @template T - Type of input values
 * @template U - Type of output success values
 * @template E - Type of error values
 * @param values - Array of input values to transform
 * @param fn - Function that converts each value to Either
 * @returns Either<U[], E> - Array of transformed values or first error encountered
 */
export declare function traverse<T, U, E>(values: T[], fn: (value: T) => Either<U, E>): Either<U[], E>;

/**
 * Collects all errors from Either array, or all success values if no errors exist
 * @template T - Type of success values
 * @template E - Type of error values
 * @param eithers - Array of Either values to process
 * @returns Either<T[], E[]> - All success values if no errors, or all errors if any exist
 */
export declare function sequenceAll<T, E>(eithers: Either<T, E>[]): Either<T[], E[]>;
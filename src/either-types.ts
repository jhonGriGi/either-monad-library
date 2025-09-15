import { Either } from './either';

/** Type alias for successful Either with never error type */
export type OK<T> = Either<T, never>;

/** Type alias for failed Either with never success type */
export type ErrorType<E> = Either<never, E>;

/** Constructor type for creating error instances */
type Constructor<T extends Error> = new (message?: string) => T;

/**
 * Arguments interface for safeAsync function
 * @template T - Type of the success value
 * @template E - Type of the error (must extend Error)
 */
interface SafeAsyncArgs<T, E extends Error> {
    /** Function that returns a Promise-like value */
    fn: () => PromiseLike<T>;
    /** Error constructor class */
    ErrClass: Constructor<E>;
}

/**
 * Safely stringifies objects for error messages
 * @param data - Object to stringify
 * @returns JSON string representation
 */
function safeStringify(data: object): string {
    return JSON.stringify(data, null, 2);
}

/**
 * Extracts error message from unknown error value
 * @param error - Unknown error value
 * @returns String representation of the error
 */
function extractErrorMessage(error: unknown): string {
    return error instanceof Error
        ? error.message
        : typeof error === 'string'
            ? error
            : typeof error === 'object' && error !== null
                ? safeStringify(error)
                : String(error);
}

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
export async function safeAsync<U, V, E extends Error>({
    fn,
    ErrClass,
}: {
    fn: () => PromiseLike<Either<U, V>>;
    ErrClass: Constructor<E>;
}): Promise<Either<U, V | E>>;

/**
 * Overload for when fn() returns T (not Either)
 * @template T - Type of the success value
 * @template E - Type of the error (must extend Error)
 * @param args - Configuration object
 * @param args.fn - Function that returns a Promise-like value
 * @param args.ErrClass - Error constructor for caught exceptions
 * @returns Promise<Either<T, E>> - Promise of Either result
 */
export async function safeAsync<T, E extends Error>({
    fn,
    ErrClass,
}: SafeAsyncArgs<T, E>): Promise<Either<T, E>>;

/**
 * Wraps an asynchronous operation that may throw, converting exceptions to Either
 * @template T - Type of the success value
 * @template E - Type of the error (must extend Error)
 * @param args - Configuration object
 * @param args.fn - Async function to execute safely
 * @param args.ErrClass - Error constructor for caught exceptions
 * @returns Promise<Either<T, E>> - Promise of Either result
 * @example
 * ```typescript
 * const result = await safeAsync({
 *     fn: () => fetch('/api/data').then(r => r.json()),
 *     ErrClass: Error
 * });
 * 
 * result.fold({
 *     fnOk: (data) => console.log('Success:', data),
 *     fnError: (error) => console.log('Failed:', error.message)
 * });
 * ```
 */
export async function safeAsync<T, E extends Error>({
    fn,
    ErrClass,
}: SafeAsyncArgs<T, E>): Promise<Either<T, E>> {
    try {
        const value = await fn();

        if (value instanceof Either) {
            // Handle the overload case where fn returns Either<U, V>
            return value as Either<T, E>;
        }
        return Either.Ok(value);
    }
    catch (error) {
        const msg = extractErrorMessage(error);
        return Either.Error(new ErrClass(msg));
    }
}

/**
 * Wraps a synchronous operation that may throw, converting exceptions to Either
 * @template T - Type of the success value
 * @template E - Type of the error (must extend Error)
 * @param args - Configuration object
 * @param args.fn - Function to execute safely
 * @param args.ErrClass - Error constructor for caught exceptions
 * @returns Either<T, E> - Either containing success value or wrapped error
 * @example
 * ```typescript
 * const result = safeSync({
 *     fn: () => {
 *         const data = JSON.parse(jsonString);
 *         if (!data.id) throw new Error('Missing ID');
 *         return data;
 *     },
 *     ErrClass: Error
 * });
 * 
 * result.fold({
 *     fnOk: (data) => console.log('Parsed:', data),
 *     fnError: (error) => console.log('Parse failed:', error.message)
 * });
 * ```
 */
export function safeSync<T, E extends Error>({
    fn,
    ErrClass,
}: {
    fn: () => T;
    ErrClass: Constructor<E>;
}): Either<T, E> {
    try {
        return Either.Ok(fn());
    }
    catch (error) {
        const msg = extractErrorMessage(error);
        return Either.Error(new ErrClass(msg));
    }
}

/**
 * Converts a nullable value to Either
 * @template T - Type of the value
 * @param value - Value that might be null or undefined
 * @returns Either<T, Error> - Ok if value exists, Error if null/undefined
 * @example
 * ```typescript
 * const result = fromNullable(user?.email);
 * result.fold({
 *     fnOk: (email) => console.log('Email:', email),
 *     fnError: () => console.log('No email provided')
 * });
 * ```
 */
export function fromNullable<T>(value: T | null | undefined): Either<T, Error> {
    return value !== null && value !== undefined ? Either.Ok(value) : Either.Error(new Error('Value is null or undefined'));
}

/**
 * Creates Either based on predicate test
 * @template T - Type of the value
 * @param value - Value to test
 * @param predicate - Function to test the value
 * @param error - Error to return if predicate fails
 * @returns Either<T, Error> - Ok if predicate passes, Error otherwise
 * @example
 * ```typescript
 * const result = fromPredicate(
 *     age,
 *     age => age >= 18,
 *     new Error('Must be 18 or older')
 * );
 * ```
 */
export function fromPredicate<T>(
    value: T,
    predicate: (value: T) => boolean,
    error: Error
): Either<T, Error> {
    return predicate(value) ? Either.Ok(value) : Either.Error(error);
}

/**
 * Combines array of Either values into Either of array
 * @template T - Type of success values
 * @template E - Type of error values
 * @param eithers - Array of Either values to combine
 * @returns Either<T[], E> - Array of all success values or first error encountered
 * @example
 * ```typescript
 * const results = sequence([
 *     Either.Ok(1),
 *     Either.Ok(2),
 *     Either.Ok(3)
 * ]);
 * console.log(results.getValue()); // [1, 2, 3]
 * ```
 */
export function sequence<T, E>(eithers: Either<T, E>[]): Either<T[], E> {
    const results: T[] = [];
    
    for (const either of eithers) {
        if (either.isError()) {
            return Either.Error(either.getError());
        }
        results.push(either.getValue());
    }
    
    return Either.Ok(results);
}

/**
 * Separates Either array into success and error arrays
 * @template T - Type of success values
 * @template E - Type of error values
 * @param eithers - Array of Either values to partition
 * @returns [T[], E[]] - Tuple containing array of success values and array of errors
 * @example
 * ```typescript
 * const [successes, errors] = partition([
 *     Either.Ok(1),
 *     Either.Error('failed'),
 *     Either.Ok(2)
 * ]);
 * console.log(successes); // [1, 2]
 * console.log(errors); // ['failed']
 * ```
 */
export function partition<T, E>(eithers: Either<T, E>[]): [T[], E[]] {
    const oks: T[] = [];
    const errors: E[] = [];
    
    for (const either of eithers) {
        if (either.isOk()) {
            oks.push(either.getValue());
        } else {
            errors.push(either.getError());
        }
    }
    
    return [oks, errors];
}

/**
 * Maps array values to Either and sequences the results
 * @template T - Type of input values
 * @template U - Type of output success values
 * @template E - Type of error values
 * @param values - Array of input values to transform
 * @param fn - Function that converts each value to Either
 * @returns Either<U[], E> - Array of transformed values or first error encountered
 * @example
 * ```typescript
 * const result = traverse([1, 2, 3], x => 
 *     x > 0 ? Either.Ok(x * 2) : Either.Error('Negative number')
 * );
 * console.log(result.getValue()); // [2, 4, 6]
 * ```
 */
export function traverse<T, U, E>(values: T[], fn: (value: T) => Either<U, E>): Either<U[], E> {
    const results: U[] = [];
    
    for (const value of values) {
        const either = fn(value);
        if (either.isError()) {
            return Either.Error(either.getError());
        }
        results.push(either.getValue());
    }
    
    return Either.Ok(results);
}

/**
 * Sequences Either array, collecting all errors if any exist
 * @template T - Type of success values
 * @template E - Type of error values
 * @param eithers - Array of Either values to sequence
 * @returns Either<T[], E[]> - All success values if no errors, or all errors if any exist
 * @example
 * ```typescript
 * const result = sequenceAll([
 *     Either.Ok(1),
 *     Either.Error('error1'),
 *     Either.Error('error2')
 * ]);
 * // Returns Either.Error(['error1', 'error2'])
 * ```
 */
export function sequenceAll<T, E>(eithers: Either<T, E>[]): Either<T[], E[]> {
    const [oks, errors] = partition(eithers);
    return errors.length > 0 ? Either.Error(errors) : Either.Ok(oks);
}
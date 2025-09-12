export declare class Either<T, E> {
    private constructor();
    static Ok<T>(value: T): OK<T>;
    static Error<E>(error: E): ErrorType<E>;
    isOk(): this is OK<T>;
    isError(): this is ErrorType<E>;
    getValue(): T;
    getError(): E;
    fold<R>(expressions: { fnError: (error: E) => R; fnOk: (value: T) => R }): R;
    map<U>(fn: (value: T) => U): Either<U, E>;
    flatMap<U>(fn: (value: T) => Either<U, E>): Either<U, E>;
    mapError<F>(fn: (error: E) => F): Either<T, F>;
    getOrElse(defaultValue: T): T;
    
    // Combination methods
    zip<U>(other: Either<U, E>): Either<[T, U], E>;
    zipWith<U, R>(other: Either<U, E>, fn: (a: T, b: U) => R): Either<R, E>;
    
    // Filtering methods
    filter(predicate: (value: T) => boolean, error: E): Either<T, E>;
    find<U>(fn: (value: T) => Either<U, E>): Either<U, E>;
    
    // Conversion methods
    toPromise(): Promise<T>;
    toOptional(): T | undefined;
    swap(): Either<E, T>;
    
    // Recovery methods
    recover(fn: (error: E) => T): Either<T, never>;
    recoverWith(fn: (error: E) => Either<T, E>): Either<T, E>;
    
    // Side effect methods
    tap(fn: (value: T) => void): Either<T, E>;
    tapError(fn: (error: E) => void): Either<T, E>;
}

export type OK<T> = Either<T, never>;
export type ErrorType<E> = Either<never, E>;

export declare function safeAsync<U, V, E extends Error>(args: {
    fn: () => PromiseLike<Either<U, V>>;
    ErrClass: new (...args: any[]) => E;
}): Promise<Either<U, V | E>>;

export declare function safeAsync<T, E extends Error>(args: {
    fn: () => PromiseLike<T>;
    ErrClass: new (...args: any[]) => E;
}): Promise<Either<T, E>>;

export declare function safeSync<T, E extends Error>(args: {
    fn: () => T;
    ErrClass: new (...args: any[]) => E;
}): Either<T, E>;

export declare function fromNullable<T>(value: T | null | undefined): Either<T, Error>;

export declare function fromPredicate<T>(
    value: T,
    predicate: (value: T) => boolean,
    error: Error
): Either<T, Error>;

export declare function sequence<T, E>(eithers: Either<T, E>[]): Either<T[], E>;

export declare function partition<T, E>(eithers: Either<T, E>[]): [T[], E[]];

export declare function traverse<T, U, E>(values: T[], fn: (value: T) => Either<U, E>): Either<U[], E>;

export declare function sequenceAll<T, E>(eithers: Either<T, E>[]): Either<T[], E[]>;
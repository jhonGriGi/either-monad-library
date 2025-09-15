export { Either } from './either';
export {
    OK,
    ErrorType,
    Constructor,
    safeAsync,
    safeSync,
    fromNullable,
    fromPredicate,
    sequence,
    partition,
    traverse,
    collectAllErrors
} from './either-types';

// Legacy export for backward compatibility
export { collectAllErrors as sequenceAll } from './either-types';
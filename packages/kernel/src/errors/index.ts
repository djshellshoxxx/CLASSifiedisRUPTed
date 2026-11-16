// Pure error/result helpers for small domain libraries without validation or storage imports.
export { andThen, err, mapResult, ok, unwrap, type Err, type Ok, type Result } from './result.ts';
export { appError, AppErrorException, defineErrors, isAppError, messageKeyFor, type AppError, type AppErrorExtra, type ErrorRegistry, type FieldIssue } from './app-error.ts';
export { COMMON_ERRORS, PLATFORM_ERRORS, type CommonCode, type ErrorSpec, type PlatformCode } from './codes.ts';

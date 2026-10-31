### Highlights

### BREAKING CHANGES

### Deprecations

### New features

- [LokiJS] New `onPersistenceError` option: called when saving the database to IndexedDB fails (e.g. quota exceeded, aborted transaction), once per failure. Quota exceeded save errors are now also passed to `onQuotaExceededError`
- [LokiJS] New `allowInMemoryFallback` option (default: `true`). Pass `false` to make setup fail (and `onSetUpError` be called) instead of silently falling back to an in-memory database when IndexedDB is unavailable
- [LokiJS] New `onInMemoryFallback` option: called when the database falls back to being in-memory only
- New `Collection.observeRecord(id)`: a failsafe version of `findAndObserve(id)` that emits `null` while the record does not exist (instead of erroring), emits the record once it is created, and emits `null` (instead of completing) when it is deleted. `@experimentalFailsafe` relations now use it, so their `observe()` recovers when a missing related record is created later

### Fixes

- [LokiJS] Multitab sync issue fix
- [LokiJS] When IndexedDB database is deleted in another tab (`onversionchange`), the database is no longer re-created from this tab's memory on next autosave. Instead, the adapter stops saving, rejects further changes, and calls `onPersistenceError`
- [LokiJS] Failures to save the database to IndexedDB are now always logged
- [LokiJS] When accessing or opening IndexedDB throws synchronously (e.g. `SecurityError` when storage access is denied), the adapter now falls back to an in-memory database like for other IndexedDB open failures (or fails setup with `allowInMemoryFallback: false`), instead of always failing setup
- [Android] Added linker flag for building with 16kB page alignment
- [TS] make catchError visible to typescript
- [Observation] Fixed `canEncodeMatcher()` reporting queries containing `Q.unsafeSqlExpr`,
  `Q.unsafeLokiExpr`, or a `Q.on` nested inside `Q.and`/`Q.or` as encodable.
- [LokiJS] Fixed `unsafeResetDatabase()` failing with "another operation is already in progress" when it's called while an autosave is in progress
- [iOS] Fixed compilation on React Native 0.88, which removed `RCTCxxBridge`; JSI is installed through the bridge or the bridgeless proxy alike
- [Android] Generate `BuildConfig` explicitly (AGP 9 no longer does for libraries) and stop applying the unused Kotlin plugin, which collides with AGP 9's built-in Kotlin support
- [SQLite] [iOS] Database setup failures on the legacy (non-JSI) bridge (database cannot be opened, schema setup or migration fails) now reject the promise and reach `onSetUpError` instead of raising an `NSException` that crashes the app
- [SQLite] [iOS] [Android] After a failed schema setup or migration on the legacy (non-JSI) bridge, operations queued during setup are rejected with the setup error and the driver stays connected, so the app can recover with `database.unsafeResetDatabase()` instead of every call hanging (iOS) or being rejected with "No driver with tag N available" (Android). The Node.js SQLite bridge (`sqlite-node`) behaves the same way
- [SQLite] [JSI] Database setup failures on the JSI path (database file cannot be opened, schema setup or migration fails) now reject the setup promise and reach `onSetUpError` instead of crashing the app
- [SQLite] [JSI] A failed `unsafeResetDatabase()` now rejects instead of crashing the app, and leaves the (empty, consistent) database open so the reset can be retried. Other calls on a database whose setup or reset failed are rejected instead of failing an assertion
- `database.unsafeResetDatabase()` that fails now restores the adapter (and clears record caches, since data may already be erased), so the reset can be retried instead of every later call failing with "Cannot call database.adapter.X while the database is being reset"
- Adapters now clear their cached record IDs at the start of `unsafeResetDatabase()`, so a reset that fails early no longer leaves later fetches failing with "Record ID ... was sent over the bridge, but it's not cached"
- [SQLite] [JSI] Calling a native method with the wrong number of arguments now throws a JS error on Android too, instead of crashing the app
- [SQLite] [JSI] The prepared statement cache is now bounded (256 statements, least recently used are finalized first), so one-off queries no longer keep a prepared statement alive for the lifetime of the database

### Performance

### Changes

- Updated better-sqlite3 to 11.9.1

### Internal

- Updated internal dependencies
- Updated documentation scripts

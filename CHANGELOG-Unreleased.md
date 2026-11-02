### Highlights

### BREAKING CHANGES

- [Windows] The bundled SQLite 3.54.1 does not compile for the Windows (UWP) project: `CreateFileW` and `AreFileApisANSI` are unavailable to Windows Store apps. The Windows port was already unmaintained and is not built on CI

### Deprecations

### New features

- [LokiJS] New `onPersistenceError` option: called when saving the database to IndexedDB fails (e.g. quota exceeded, aborted transaction), once per failure. Quota exceeded save errors are now also passed to `onQuotaExceededError`
- [LokiJS] New `allowInMemoryFallback` option (default: `true`). Pass `false` to make setup fail (and `onSetUpError` be called) instead of silently falling back to an in-memory database when IndexedDB is unavailable
- [LokiJS] New `onInMemoryFallback` option: called when the database falls back to being in-memory only
- New `Collection.observeRecord(id)`: a failsafe version of `findAndObserve(id)` that emits `null` while the record does not exist (instead of erroring), emits the record once it is created, and emits `null` (instead of completing) when it is deleted. `@experimentalFailsafe` relations now use it, so their `observe()` recovers when a missing related record is created later

- New `destroyTable({ table })` migration step. On SQLite, it's `DROP TABLE IF EXISTS`. On LokiJS, the collection is removed and its data is deleted from IndexedDB, so it's no longer loaded and parsed on every launch (also if it was already removed from Loki)
- [LokiJS] New `unsafeExecuteLoki(loki => {})` migration step, the LokiJS counterpart of `unsafeExecuteSql()`. It's ignored on SQLite
- [LokiJS] `unsafeExecuteSql()` migration steps, which are ignored on LokiJS, now log a warning
- [LokiJS] New opt-in `exclusiveLock` option: only one browser tab at a time has the database open (using the Web Locks API), so tabs no longer overwrite each other's changes or undo a reset done in another tab. Other tabs wait until it's closed, and `onDatabaseLockedElsewhere` is called. Without the Web Locks API, the database is opened without a lock

### Fixes

- [Sync] A pulled changeset is now validated in full before any of it is applied (table and record shape, string ids, ids listed more than once in a table's created/updated/deleted). Before, an invalid record found halfway through left already-prepared records broken in memory, and updating them failed until the app restarted. Records with a non-string `id` are now rejected instead of being given a random id
- [LokiJS] Multitab sync issue fix
- [LokiJS] When IndexedDB database is deleted in another tab (`onversionchange`), the database is no longer re-created from this tab's memory on next autosave. Instead, the adapter stops saving, rejects further changes, and calls `onPersistenceError`
- [LokiJS] Failures to save the database to IndexedDB are now always logged
- [LokiJS] When a migration fails, changes made by the steps that ran before the failure are no longer autosaved under the old schema version
- [LokiJS] After the database stops being saved (e.g. it was deleted in another tab), callbacks waiting for a save that was in progress (from `close()` or `unsafeResetDatabase()`) are now called with an error instead of never being called
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
- [SQLite] [JSI] Empty or comment-only raw SQL queries, and record queries (`Q.unsafeSqlQuery`) whose first column is not `id`, now reject instead of failing a native assertion
- [SQLite] [JSI] The prepared statement cache is now bounded (256 statements, least recently used are finalized first), so one-off queries no longer keep a prepared statement alive for the lifetime of the database

### Performance

- [Sync] `markLocalChangesAsSynced` and applying pulled changes to locally deleted records now run in linear time (lookups use a Map/Set instead of scanning arrays), which speeds up syncs with many local changes or deletions

### Changes

- [Sync] Columns set while creating a record (`collection.create()` builder) are now recorded in its `_changed` field. When a pull contains a record with the same id as a locally created, not yet pushed one, conflicts are now resolved per column (locally set columns win) instead of the remote version winning. A custom `conflictResolver` receives this per-column result as `resolved`. `_changed` is also included in pushed `created` records; it's reset when the record is marked as synced
- Updated better-sqlite3 to 11.9.1
- [Android] [JSI] [Windows] Updated the bundled SQLite from 3.46.0 to 3.54.1. Its source is now part of the package (`native/sqlite`) instead of the `@nozbe/sqlite` dependency
- [Sync] With `_unsafeBatchPerCollection`, pulled changes are now committed in batches one after another (each prepared right before it is committed) instead of all at once, so a failed batch leaves the following ones untouched. Observers are notified once per pull instead of once per table and batch
- `database.experimentalBatchNotifications()` now merges all changes made within it into one notification (one call per `experimentalSubscribe` subscriber, one emission per changed collection) instead of replaying one notification per batch

### Internal

- Updated internal dependencies
- Updated documentation scripts

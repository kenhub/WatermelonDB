# SQLite

Unmodified [SQLite amalgamation](https://sqlite.org/amalgamation.html), compiled into the Android JSI library (`native/android-jsi/src/main/cpp/CMakeLists.txt`) and the Windows library (`native/windows/WatermelonDB/WatermelonDB.vcxproj`). iOS and the non-JSI Android bridge use the system SQLite.

The unmaintained Windows (UWP) project does not compile with this version: SQLite 3.54.1 calls `CreateFileW` and `AreFileApisANSI` even with `SQLITE_UWP` defined, and the Windows SDK does not declare them for Windows Store apps (checked with MSVC 14.44 and Windows SDK 10.0.26100). It compiles with 3.46.0, the version bundled before.

Version: 3.54.1, from `https://www.sqlite.org/2026/sqlite-amalgamation-3540100.zip` (SHA3-256 `92281c86e2957f9b9305890f9ac04204caa7b677cc868dc326d942689df28e30`, as listed on https://www.sqlite.org/download.html).

To update, download the new amalgamation zip, check its SHA3-256 against the download page, replace `sqlite3.c`, `sqlite3.h` and `sqlite3ext.h`, and update this file.

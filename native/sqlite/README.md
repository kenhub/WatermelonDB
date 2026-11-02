# SQLite

Unmodified [SQLite amalgamation](https://sqlite.org/amalgamation.html), compiled into the Android JSI library (`native/android-jsi/src/main/cpp/CMakeLists.txt`) and the Windows library (`native/windows/WatermelonDB/WatermelonDB.vcxproj`). iOS and the non-JSI Android bridge use the system SQLite.

SQLite 3.54 still calls the desktop-only `CreateFileW` and `AreFileApisANSI` in Windows Store builds ([forum thread](https://sqlite.org/forum/info/7a30926e9010465f2974247686959a59e9bd4728be4642fcd638adc909796e7b)). The Windows project force-includes `native/windows/WatermelonDB/sqlite3_uwp.h` into `sqlite3.c`, which replaces them the way SQLite 3.46 did, so the SQLite source stays unmodified. When updating, check whether it's still needed.

Version: 3.54.1, from `https://www.sqlite.org/2026/sqlite-amalgamation-3540100.zip` (SHA3-256 `92281c86e2957f9b9305890f9ac04204caa7b677cc868dc326d942689df28e30`, as listed on https://www.sqlite.org/download.html).

To update, download the new amalgamation zip, check its SHA3-256 against the download page, replace `sqlite3.c`, `sqlite3.h` and `sqlite3ext.h`, and update this file.

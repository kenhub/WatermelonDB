# SQLite

Unmodified [SQLite amalgamation](https://sqlite.org/amalgamation.html), compiled into the Android JSI library (`CMakeLists.txt`). iOS uses the system SQLite.

Version: 3.54.1, from `https://www.sqlite.org/2026/sqlite-amalgamation-3540100.zip` (SHA3-256 `92281c86e2957f9b9305890f9ac04204caa7b677cc868dc326d942689df28e30`, as listed on https://www.sqlite.org/download.html).

To update, download the new amalgamation zip, check its SHA3-256 against the download page, replace `sqlite3.c`, `sqlite3.h` and `sqlite3ext.h`, and update this file.

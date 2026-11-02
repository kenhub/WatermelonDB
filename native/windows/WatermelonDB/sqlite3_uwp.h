// Force-included before sqlite3.c. SQLite 3.53+ dropped its CreateFile2 path, and even with
// SQLITE_UWP it calls CreateFileW and AreFileApisANSI, which Windows Store apps can't use.
#ifndef WATERMELONDB_SQLITE3_UWP_H
#define WATERMELONDB_SQLITE3_UWP_H

#include <windows.h>

#if WINAPI_FAMILY_PARTITION(WINAPI_PARTITION_APP) && !WINAPI_FAMILY_PARTITION(WINAPI_PARTITION_DESKTOP)

// Same as SQLite 3.46 with SQLITE_OS_WINRT: the file APIs use the ANSI code page
static BOOL WINAPI watermelondbAreFileApisANSI(void) {
  return TRUE;
}

// Same mapping as SQLite 3.46's CreateFile2 call
static HANDLE WINAPI watermelondbCreateFileW(LPCWSTR lpFileName, DWORD dwDesiredAccess,
                                             DWORD dwShareMode,
                                             LPSECURITY_ATTRIBUTES lpSecurityAttributes,
                                             DWORD dwCreationDisposition,
                                             DWORD dwFlagsAndAttributes, HANDLE hTemplateFile) {
  CREATEFILE2_EXTENDED_PARAMETERS params;
  ZeroMemory(&params, sizeof(params));
  params.dwSize = sizeof(params);
  params.dwFileAttributes = dwFlagsAndAttributes & 0x0003FFF7;
  params.dwFileFlags = dwFlagsAndAttributes & 0xFF3C0000;
  params.dwSecurityQosFlags = SECURITY_ANONYMOUS;
  params.lpSecurityAttributes = lpSecurityAttributes;
  params.hTemplateFile = hTemplateFile;
  return CreateFile2(lpFileName, dwDesiredAccess, dwShareMode, dwCreationDisposition, &params);
}

#define AreFileApisANSI watermelondbAreFileApisANSI
#define CreateFileW watermelondbCreateFileW

#endif
#endif

//! Every file a per-machine SGI installer is known to have placed in its install folder - the only
//! files the elevated cleanup will delete there. Folders are then removed only if empty, never
//! recursively: some users installed into a folder of their own (e.g. `D:\Tools`), and anything
//! not on this list stays untouched (and keeps its folder alive).
//!
//! Why a long list: `libs/` holds SteamUtility's trimmed .NET runtime, whose file set changes
//! between releases, and NSIS never deletes a file a newer release stopped shipping - so an old
//! install holds every name any release it updated through ever shipped.
//!
//! How it was built (2026-11, from all 336 GitHub releases): `LIBS` is the union of every `libs/`
//! entry in every release's Windows portable zip, whose `libs/` is copied from the same build
//! output the installer bundles. Releases 1.7.23-2.1.6 (the first per-machine NSIS builds, March-
//! September 2025) shipped no portable zip, but built `libs/` with the same .NET Framework project
//! as 2.1.7-5.4.6, which are covered; a file only those releases had would just leave `libs/` in
//! place (logged). `ROOT` is every root-level resource `tauri.conf.json` ever bundled, plus the
//! main exe and NSIS's `uninstall.exe`.
//!
//! This is a closed set: no per-machine installer ships after the switch to `currentUser`, so it
//! never needs extending.
#![cfg_attr(not(windows), allow(dead_code))]

/// Root-level files. `steam-game-idler.exe` is the cargo-named binary from before
/// `mainBinaryName` was set (1.7.23); NSIS deletes it on upgrade, but a leftover would be ours.
pub(super) const ROOT: &[&str] = &[
    super::MAIN_EXE_NAME,
    "steam-game-idler.exe",
    "uninstall.exe",
    "LICENSE",
    "THIRD-PARTY-NOTICES.md",
    ".installed",
];

/// Files under `libs/`.
pub(super) const LIBS: &[&str] = &[
    "AchievementUnlocker.exe",
    "clrgc.dll",
    "clrjit.dll",
    "coreclr.dll",
    "hostfxr.dll",
    "hostpolicy.dll",
    "icon.ico",
    "Idler.exe",
    "Microsoft.Win32.Primitives.dll",
    "Microsoft.Win32.Registry.dll",
    "mscorlib.dll",
    "mscorrc.dll",
    "msquic.dll",
    "Newtonsoft.Json.dll",
    "protobuf-net.Core.dll",
    "protobuf-net.dll",
    "steam_api.dll",
    "steam_api64.dll",
    "SteamKit2.dll",
    "SteamUtility.deps.json",
    "SteamUtility.dll",
    "SteamUtility.exe",
    "SteamUtility.runtimeconfig.json",
    "Steamworks.NET.dll",
    "System.Collections.Concurrent.dll",
    "System.Collections.dll",
    "System.Collections.Immutable.dll",
    "System.Collections.NonGeneric.dll",
    "System.Collections.Specialized.dll",
    "System.ComponentModel.dll",
    "System.ComponentModel.Primitives.dll",
    "System.ComponentModel.TypeConverter.dll",
    "System.Console.dll",
    "System.Diagnostics.DiagnosticSource.dll",
    "System.Diagnostics.Process.dll",
    "System.Diagnostics.StackTrace.dll",
    "System.dll",
    "System.Formats.Asn1.dll",
    "System.IO.Compression.Brotli.dll",
    "System.IO.Compression.dll",
    "System.IO.Compression.Native.dll",
    "System.IO.FileSystem.AccessControl.dll",
    "System.IO.Hashing.dll",
    "System.IO.IsolatedStorage.dll",
    "System.IO.MemoryMappedFiles.dll",
    "System.Linq.dll",
    "System.Linq.Expressions.dll",
    "System.Memory.dll",
    "System.Net.Http.dll",
    "System.Net.NameResolution.dll",
    "System.Net.NetworkInformation.dll",
    "System.Net.Primitives.dll",
    "System.Net.Quic.dll",
    "System.Net.Security.dll",
    "System.Net.Sockets.dll",
    "System.Net.WebHeaderCollection.dll",
    "System.Net.WebSockets.Client.dll",
    "System.Net.WebSockets.dll",
    "System.ObjectModel.dll",
    "System.Private.CoreLib.dll",
    "System.Private.Uri.dll",
    "System.Private.Xml.dll",
    "System.Reflection.Emit.dll",
    "System.Reflection.Emit.ILGeneration.dll",
    "System.Reflection.Emit.Lightweight.dll",
    "System.Reflection.Metadata.dll",
    "System.Reflection.Primitives.dll",
    "System.Runtime.dll",
    "System.Runtime.InteropServices.dll",
    "System.Runtime.Intrinsics.dll",
    "System.Runtime.Numerics.dll",
    "System.Runtime.Serialization.Formatters.dll",
    "System.Security.AccessControl.dll",
    "System.Security.Claims.dll",
    "System.Security.Cryptography.dll",
    "System.Security.Principal.Windows.dll",
    "System.Text.Encoding.Extensions.dll",
    "System.Text.Encodings.Web.dll",
    "System.Text.Json.dll",
    "System.Text.RegularExpressions.dll",
    "System.Threading.Channels.dll",
    "System.Threading.dll",
    "System.Threading.Overlapped.dll",
    "System.Threading.Tasks.Dataflow.dll",
    "System.Threading.Tasks.Parallel.dll",
    "System.Threading.Thread.dll",
    "System.Web.HttpUtility.dll",
    "System.Xml.ReaderWriter.dll",
    "ZstdSharp.dll",
];

/// The one subfolder, removed (if empty) before the install folder itself.
pub(super) const LIBS_DIR: &str = "libs";

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    /// Every entry must be a plain file name - a separator or `..` would let an entry reach outside
    /// the folder it's joined onto.
    #[test]
    fn entries_are_plain_unique_file_names() {
        let mut seen = HashSet::new();
        for name in ROOT.iter().chain(LIBS) {
            assert!(!name.is_empty());
            assert!(!name.contains(['/', '\\', ':']), "{name} has a separator");
            assert!(*name != "." && *name != "..", "{name} is a relative dir");
            assert!(seen.insert(name.to_lowercase()), "{name} is duplicated");
        }
    }
}

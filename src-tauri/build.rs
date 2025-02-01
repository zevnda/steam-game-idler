use std::env;
use std::path::PathBuf;

fn main() {
    let sdk_loc = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("libs")
        .join("sdk")
        .join("redistributable_bin")
        .join("win64");

    let dll_path = sdk_loc.join("steam_api64.dll");
    if !dll_path.exists() {
        panic!("Steam API DLL not found at: {}", dll_path.display());
    }

    let lib = "steam_api64";
    println!("cargo:rustc-link-search={}", sdk_loc.display());
    println!("cargo:rustc-link-lib=dylib={}", lib);
    println!("cargo:rerun-if-changed=libs/sdk");

    tauri_build::build()
}

use std::env;
use std::fs;
use std::path::Path;

fn main() {
    // The release workflow and the build-it-yourself docs both put .env at the
    // repo root, so that's the only location checked.
    let env_path = Path::new("../.env");

    let mut found_key = false;

    if env_path.exists() {
        let env_content = fs::read_to_string(env_path).expect("Failed to read .env file");

        for line in env_content.lines() {
            let line = line.trim();
            if line.starts_with("KEY=") {
                let api_key = line.strip_prefix("KEY=").unwrap().trim_matches('"');
                println!("cargo:rustc-env=STEAM_API_KEY={}", api_key);
                found_key = true;
                break;
            }
        }
    }

    if !found_key {
        if let Ok(api_key) = env::var("STEAM_API_KEY") {
            println!("cargo:rustc-env=STEAM_API_KEY={}", api_key);
        } else {
            println!(
                "cargo:warning=No API key found in .env or STEAM_API_KEY environment variable"
            );
        }
    }

    // Only watch .env if it exists: Cargo treats a missing rerun-if-changed path
    // as permanently stale, which reran this script and rebuilt and relinked the
    // whole app crate on every no-change build.
    if env_path.exists() {
        println!("cargo:rerun-if-changed=../.env");
    }
    println!("cargo:rerun-if-env-changed=STEAM_API_KEY");

    tauri_build::build()
}

use std::env;
use std::fs;
use std::path::Path;

fn main() {
    let env_prod_paths = [Path::new(".env"), Path::new("../.env")];

    let mut found_key = false;

    for env_prod_path in &env_prod_paths {
        if env_prod_path.exists() {
            let env_content =
                fs::read_to_string(env_prod_path).expect("Failed to read .env file");

            for line in env_content.lines() {
                let line = line.trim();
                if line.starts_with("KEY=") {
                    let api_key = line.strip_prefix("KEY=").unwrap().trim_matches('"');
                    println!("cargo:rustc-env=STEAM_API_KEY={}", api_key);
                    found_key = true;
                    break;
                }
            }
            if found_key {
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
    println!("cargo:rerun-if-changed=.env");
    println!("cargo:rerun-if-changed=../.env");

    tauri_build::build()
}

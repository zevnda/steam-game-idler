use std::env;
use std::fs;
use std::path::Path;

fn main() {
    let env_prod_paths = [Path::new(".env.prod"), Path::new("../.env.prod")];

    let mut found_key = false;
    let mut found_pat = false;

    for env_prod_path in &env_prod_paths {
        if env_prod_path.exists() {
            let env_content =
                fs::read_to_string(env_prod_path).expect("Failed to read .env.prod file");

            for line in env_content.lines() {
                let line = line.trim();
                if line.starts_with("KEY=") {
                    let api_key = line.strip_prefix("KEY=").unwrap().trim_matches('"');
                    println!("cargo:rustc-env=STEAM_API_KEY={}", api_key);
                    found_key = true;
                } else if line.starts_with("GH_PAT=") {
                    let gh_pat = line.strip_prefix("GH_PAT=").unwrap().trim_matches('"');
                    println!("cargo:rustc-env=GH_PAT={}", gh_pat);
                    found_pat = true;
                }
            }
            if found_key && found_pat {
                break;
            }
        }
    }

    if !found_key {
        if let Ok(api_key) = env::var("STEAM_API_KEY") {
            println!("cargo:rustc-env=STEAM_API_KEY={}", api_key);
        } else {
            println!(
                "cargo:warning=No API key found in .env.prod or STEAM_API_KEY environment variable"
            );
        }
    }

    if !found_pat {
        if let Ok(gh_pat) = env::var("GH_PAT") {
            println!("cargo:rustc-env=GH_PAT={}", gh_pat);
        } else {
            println!(
                "cargo:warning=No GitHub PAT found in .env.prod or GH_PAT environment variable"
            );
        }
    }

    println!("cargo:rerun-if-changed=.env.prod");
    println!("cargo:rerun-if-changed=../.env.prod");

    tauri_build::build()
}

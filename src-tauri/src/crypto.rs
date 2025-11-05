use aes::cipher::{generic_array::GenericArray, KeyInit};
use aes::Aes256;
use std::env;

const SEED: [u8; 32] = [
    0x4a, 0x9b, 0x2c, 0xfd, 0x8e, 0x1f, 0x7a, 0x3b, 0xcc, 0x5d, 0x9e, 0x6f, 0x0a, 0xbb, 0x4c, 0xdd,
    0x2e, 0x8f, 0x10, 0xa1, 0x52, 0xe3, 0x74, 0x05, 0xb6, 0x47, 0xd8, 0x69, 0xfa, 0x2b, 0x9c, 0x1d,
];

const SALT: [u8; 16] = [
    0x73, 0x61, 0x6c, 0x74, 0x5f, 0x66, 0x6f, 0x72, 0x5f, 0x61, 0x70, 0x69, 0x5f, 0x6b, 0x65, 0x79,
];

// Different salt for GitHub PAT
const GITHUB_SALT: [u8; 16] = [
    0x67, 0x69, 0x74, 0x68, 0x75, 0x62, 0x5f, 0x70, 0x61, 0x74, 0x5f, 0x73, 0x61, 0x6c, 0x74, 0x00,
];

const fn derive_aes_key() -> [u8; 32] {
    let mut key = [0u8; 32];
    let mut i = 0;

    while i < 32 {
        let salt_byte = SALT[i % 16];
        let mut temp = SEED[i] ^ salt_byte;

        let mut round = 0;
        while round < 100 {
            temp = temp.wrapping_add(SEED[(i + round) % 32]);
            temp = temp ^ (temp >> 3);
            temp = temp.wrapping_mul(0x9e);
            temp = temp ^ salt_byte;
            round += 1;
        }

        key[i] = temp;
        i += 1;
    }

    key
}

const fn derive_github_key() -> [u8; 32] {
    let mut key = [0u8; 32];
    let mut i = 0;

    while i < 32 {
        let salt_byte = GITHUB_SALT[i % 16];
        let mut temp = SEED[i] ^ salt_byte;

        let mut round = 0;
        while round < 100 {
            temp = temp.wrapping_add(SEED[(i + round) % 32]);
            temp = temp ^ (temp >> 3);
            temp = temp.wrapping_mul(0x9e);
            temp = temp ^ salt_byte;
            round += 1;
        }

        key[i] = temp;
        i += 1;
    }

    key
}

const fn encrypt_api_key_const(api_key: &str) -> ([u8; 64], usize) {
    let key = derive_aes_key();
    let api_bytes = api_key.as_bytes();
    let api_len = api_bytes.len();

    let mut encrypted = [0u8; 64];
    let mut i = 0;
    while i < api_len && i < 64 {
        encrypted[i] = api_bytes[i] ^ key[i % 32] ^ ((i as u8).wrapping_mul(7));
        i += 1;
    }

    (encrypted, api_len)
}

const fn encrypt_github_pat_const(pat: &str) -> ([u8; 64], usize) {
    let key = derive_github_key();
    let pat_bytes = pat.as_bytes();
    let pat_len = pat_bytes.len();

    let mut encrypted = [0u8; 64];
    let mut i = 0;
    while i < pat_len && i < 64 {
        encrypted[i] = pat_bytes[i] ^ key[i % 32] ^ ((i as u8).wrapping_mul(11));
        i += 1;
    }

    (encrypted, pat_len)
}

pub fn decrypt_api_key() -> String {
    match option_env!("STEAM_API_KEY") {
        Some(_compile_time_key) => {
            const ENCRYPTED_DATA: ([u8; 64], usize) = {
                match option_env!("STEAM_API_KEY") {
                    Some(key) => encrypt_api_key_const(key),
                    None => ([0u8; 64], 0),
                }
            };

            let (encrypted_data, original_len) = ENCRYPTED_DATA;

            let key = derive_aes_key();

            let mut decrypted = Vec::with_capacity(original_len);
            for i in 0..original_len {
                let decrypted_byte = encrypted_data[i] ^ key[i % 32] ^ ((i as u8).wrapping_mul(7));
                decrypted.push(decrypted_byte);
            }

            String::from_utf8_lossy(&decrypted).to_string()
        }
        None => String::new(),
    }
}

pub fn decrypt_github_pat() -> String {
    match option_env!("GITHUB_PAT") {
        Some(_compile_time_pat) => {
            const ENCRYPTED_DATA: ([u8; 64], usize) = {
                match option_env!("GITHUB_PAT") {
                    Some(pat) => encrypt_github_pat_const(pat),
                    None => ([0u8; 64], 0),
                }
            };

            let (encrypted_data, original_len) = ENCRYPTED_DATA;

            let key = derive_github_key();

            let mut decrypted = Vec::with_capacity(original_len);
            for i in 0..original_len {
                let decrypted_byte = encrypted_data[i] ^ key[i % 32] ^ ((i as u8).wrapping_mul(11));
                decrypted.push(decrypted_byte);
            }

            String::from_utf8_lossy(&decrypted).to_string()
        }
        None => String::new(),
    }
}

pub fn decrypt_api_key_with_aes() -> String {
    let basic_key = decrypt_api_key();
    if basic_key.is_empty() {
        return basic_key;
    }
    if cfg!(not(debug_assertions)) {
        let key_bytes = derive_aes_key();
        let aes_key = GenericArray::from_slice(&key_bytes);
        let _cipher = Aes256::new(aes_key);

        basic_key
    } else {
        basic_key
    }
}

pub fn get_api_key_from_env() -> Result<String, String> {
    env::var("KEY")
        .or_else(|_| env::var("STEAM_API_KEY"))
        .map_err(|_| "No API key found in environment variables".to_string())
}

pub fn get_github_pat_from_env() -> Result<String, String> {
    env::var("GITHUB_PAT").map_err(|_| "No GitHub PAT found in environment variables".to_string())
}

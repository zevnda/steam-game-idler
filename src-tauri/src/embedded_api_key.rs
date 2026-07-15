//! Compile-time-obfuscated embedding of the Steam Web API key, so release builds work out of the
//! box without every user having to configure their own key. Consumed by
//! `steam_web_api::resolve_api_key` as the last fallback, after an explicitly caller-provided key.
//!
//! **This is not real security, and can't be.** This project's source - including this file's
//! algorithm - is public, and the shipped binary itself has to be able to decode the key to use
//! it. A sufficiently motivated reverse engineer can recover it either by extracting the encoded
//! bytes from the binary and running this same public algorithm against them, or simply by reading
//! the decoded key back out of the running process's memory. All this achieves is raising the bar
//! above casual extraction (`strings SteamUtility.exe`, a plaintext binary diff) - it is not a
//! substitute for the actually-secure alternative, which is never shipping the key to a client at
//! all (proxying Steam Web API calls through a server this project controls). That's a real
//! infrastructure commitment (hosting, uptime, rate limiting) nobody has taken on yet.

const SEED: [u8; 32] = [
    0x1c, 0x4e, 0x8a, 0x2d, 0x91, 0x63, 0xf7, 0x0b, 0x5a, 0xd2, 0x39, 0x76, 0xbe, 0x14, 0xc8, 0x5f,
    0xa3, 0x67, 0xe1, 0x0d, 0x92, 0x4b, 0x7c, 0x38, 0xd6, 0x29, 0xf4, 0x83, 0x1a, 0x6e, 0xc5, 0x50,
];

const SALT: [u8; 16] = [
    0x67, 0x61, 0x6d, 0x65, 0x5f, 0x69, 0x64, 0x6c, 0x65, 0x72, 0x5f, 0x6b, 0x65, 0x79, 0x21, 0x3f,
];

const fn derive_obfuscation_key() -> [u8; 32] {
    let mut key = [0u8; 32];
    let mut i = 0;

    while i < 32 {
        let salt_byte = SALT[i % 16];
        let mut temp = SEED[i] ^ salt_byte;

        let mut round = 0;
        while round < 100 {
            temp = temp.wrapping_add(SEED[(i + round) % 32]);
            temp ^= temp >> 3;
            temp = temp.wrapping_mul(0x9e);
            temp ^= salt_byte;
            round += 1;
        }

        key[i] = temp;
        i += 1;
    }

    key
}

// 64 bytes is comfortably larger than a real Steam Web API key (32 hex chars) - a key longer than
// that gets silently truncated, which can't happen with a genuine Steam-issued key.
const fn obfuscate(api_key: &str) -> ([u8; 64], usize) {
    let key = derive_obfuscation_key();
    let api_bytes = api_key.as_bytes();
    let len = if api_bytes.len() < 64 {
        api_bytes.len()
    } else {
        64
    };

    let mut obfuscated = [0u8; 64];
    let mut i = 0;
    while i < len {
        obfuscated[i] = api_bytes[i] ^ key[i % 32] ^ (i as u8).wrapping_mul(7);
        i += 1;
    }

    (obfuscated, len)
}

/// The build-time `STEAM_API_KEY` (if this build was compiled with one), obfuscated at compile
/// time and decoded here at call time - never present as a contiguous plaintext string anywhere in
/// the shipped binary. `None` if this build wasn't compiled with a key at all (e.g. a local dev
/// build with no `STEAM_API_KEY` set - `resolve_api_key` surfaces `MissingApiKey` in that case).
pub fn decode() -> Option<String> {
    const OBFUSCATED: ([u8; 64], usize) = match option_env!("STEAM_API_KEY") {
        Some(key) => obfuscate(key),
        None => ([0u8; 64], 0),
    };

    let (obfuscated, len) = OBFUSCATED;
    if len == 0 {
        return None;
    }

    let key = derive_obfuscation_key();
    let mut decoded = Vec::with_capacity(len);
    for (i, byte) in obfuscated.iter().enumerate().take(len) {
        decoded.push(byte ^ key[i % 32] ^ (i as u8).wrapping_mul(7));
    }

    Some(String::from_utf8_lossy(&decoded).to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Exercises the obfuscate/decode round trip directly against a synthetic key, independent of
    /// whether this test binary was actually compiled with a real `STEAM_API_KEY`.
    #[test]
    fn obfuscate_then_decode_round_trips_exactly() {
        let plaintext = "TEST1234ABCD5678EFGH9012IJKL34MN";
        let (obfuscated, len) = obfuscate(plaintext);

        let key = derive_obfuscation_key();
        let mut decoded = Vec::with_capacity(len);
        for (i, byte) in obfuscated.iter().enumerate().take(len) {
            decoded.push(byte ^ key[i % 32] ^ (i as u8).wrapping_mul(7));
        }

        assert_eq!(String::from_utf8(decoded).unwrap(), plaintext);
    }
}

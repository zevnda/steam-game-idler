//! Parsing/rewriting `<steam>/config/loginusers.vdf` - the local Steam client's own record of
//! every account that has ever signed into it on this machine. This is CLI mode's only source of
//! "who can sign in" - there is no network call involved, unlike agent mode's SteamKit2 login.

use std::path::Path;

use regex::Regex;
use serde::Serialize;

use crate::error::{AppError, AppResult};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalSteamUser {
    pub steam_id: String,
    pub persona_name: String,
    pub most_recent: bool,
}

/// Parses every account block out of `loginusers.vdf`. Ported from `main`'s `parse_login_users` -
/// the same single-pass regex walk over `"SteamID64" { ... "PersonaName" "..." ... }` blocks,
/// rather than a full VDF (Valve Data Format) parser, since `main`'s approach is already proven
/// against real-world `loginusers.vdf`
/// quirks - notably the case-insensitive key matching for `PersonaName`, since Steam has shipped
/// both cases in the wild. Returns accounts in the order they appear in the file (deterministic),
/// unlike `main`'s `HashMap`-backed version.
///
/// `most_recent` is true if *either* a legacy `MostRecent` key or a newer `AutoLogin` key is `1` -
/// a real Steam client update was found (live-tested by the user against their actual installed
/// client) to have dropped `MostRecent`/`AllowAutoLogin` entirely in favor of a single `AutoLogin`
/// key that serves the same role. Checking both, rather than switching over entirely, means this
/// still works against whichever schema a given user's Steam client happens to write - there's no
/// guarantee every install has migrated to the newer one.
pub fn parse_login_users(path: &Path) -> AppResult<Vec<LocalSteamUser>> {
    let content = std::fs::read_to_string(path).map_err(|e| AppError::LoginVdfIo(e.to_string()))?;

    let user_regex = Regex::new(
        r#""(\d{17})"\s*\{[^}]*"(?i)PersonaName"\s*"([^"]*)"|"(?i)MostRecent"\s*"(\d+)"|"(?i)AutoLogin"\s*"(\d+)""#,
    )
    .map_err(|e| AppError::LoginVdfParse(e.to_string()))?;

    let mut users = Vec::new();
    let mut current: Option<(String, String)> = None;
    let mut most_recent_flag = 0u32;
    let mut auto_login_flag = 0u32;

    for cap in user_regex.captures_iter(&content) {
        if let Some(steam_id) = cap.get(1) {
            if let Some((steam_id, persona_name)) = current.take() {
                users.push(LocalSteamUser {
                    steam_id,
                    persona_name,
                    most_recent: most_recent_flag != 0 || auto_login_flag != 0,
                });
            }
            current = Some((
                steam_id.as_str().to_string(),
                cap.get(2)
                    .map(|m| m.as_str().to_string())
                    .unwrap_or_default(),
            ));
            most_recent_flag = 0;
            auto_login_flag = 0;
        } else if let Some(value) = cap.get(3) {
            most_recent_flag = value.as_str().parse().unwrap_or(0);
        } else if let Some(value) = cap.get(4) {
            auto_login_flag = value.as_str().parse().unwrap_or(0);
        }
    }

    if let Some((steam_id, persona_name)) = current.take() {
        users.push(LocalSteamUser {
            steam_id,
            persona_name,
            most_recent: most_recent_flag != 0 || auto_login_flag != 0,
        });
    }

    Ok(users)
}

/// Rewrites `AllowAutoLogin`/`MostRecent`/`AutoLogin`/`Timestamp` for `target_steam_id`'s block
/// (set) and every other account's block (cleared), so the local Steam client auto-logs into that
/// account on next launch. A line-by-line rewriter that tracks brace depth manually and only
/// rewrites known keys at depth 2 (the per-account block level), leaving every other line
/// byte-for-byte unchanged. A full VDF parser would handle nested braces more generally, but this
/// only ever needs to touch one well-known block shape. Only rewrites whichever
/// of these keys are actually present in a given block (some real-world files only have `AutoLogin`
/// - see `parse_login_users`'s doc comment for why both schemas are handled), so this never inserts
/// a key that wasn't already there. Returns the target account's `AccountName` (not persona name) -
/// the caller needs it for the `HKCU\Software\Valve\Steam\AutoLoginUser` registry value.
pub fn update_login_users_vdf(
    content: &str,
    target_steam_id: &str,
    timestamp: u64,
) -> AppResult<(String, String)> {
    let mut output = String::new();
    let mut depth: i32 = 0;
    let mut current_user_id = String::new();
    let mut pending_block_key = String::new();
    let mut target_account_name = String::new();

    let block_key_re =
        Regex::new(r#"^\s*"([^"]*)"\s*$"#).map_err(|e| AppError::LoginVdfParse(e.to_string()))?;
    let kv_re = Regex::new(r#"^\s*"([^"]*)"\s+"([^"]*)"\s*$"#)
        .map_err(|e| AppError::LoginVdfParse(e.to_string()))?;

    for line in content.lines() {
        let trimmed = line.trim();

        if trimmed == "{" {
            depth += 1;
            if depth == 2 && !pending_block_key.is_empty() {
                current_user_id = pending_block_key.clone();
            }
            pending_block_key.clear();
            output.push_str(line);
            output.push('\n');
        } else if trimmed == "}" {
            if depth == 2 {
                current_user_id.clear();
            }
            depth -= 1;
            output.push_str(line);
            output.push('\n');
        } else if let Some(kv_cap) = kv_re.captures(line) {
            let key = &kv_cap[1];
            let value = &kv_cap[2];
            let is_target = current_user_id == target_steam_id;
            let leading = &line[..line.len() - line.trim_start().len()];

            if depth == 2 {
                match key {
                    "AccountName" => {
                        if is_target {
                            target_account_name = value.to_string();
                        }
                        output.push_str(line);
                        output.push('\n');
                    }
                    "AllowAutoLogin" => {
                        let v = if is_target { "1" } else { "0" };
                        output.push_str(&format!("{leading}\"AllowAutoLogin\"\t\t\"{v}\"\n"));
                    }
                    "MostRecent" => {
                        let v = if is_target { "1" } else { "0" };
                        output.push_str(&format!("{leading}\"MostRecent\"\t\t\"{v}\"\n"));
                    }
                    "AutoLogin" => {
                        let v = if is_target { "1" } else { "0" };
                        output.push_str(&format!("{leading}\"AutoLogin\"\t\t\"{v}\"\n"));
                    }
                    "Timestamp" => {
                        let v = if is_target {
                            timestamp.to_string()
                        } else {
                            value.to_string()
                        };
                        output.push_str(&format!("{leading}\"Timestamp\"\t\t\"{v}\"\n"));
                    }
                    _ => {
                        output.push_str(line);
                        output.push('\n');
                    }
                }
            } else {
                output.push_str(line);
                output.push('\n');
            }
        } else if let Some(bk_cap) = block_key_re.captures(line) {
            if depth == 1 {
                pending_block_key = bk_cap[1].to_string();
            }
            output.push_str(line);
            output.push('\n');
        } else {
            output.push_str(line);
            output.push('\n');
        }
    }

    if target_account_name.is_empty() {
        return Err(AppError::SteamIdNotFound(target_steam_id.to_string()));
    }

    Ok((output, target_account_name))
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE_VDF: &str = r#""users"
{
	"76561197960287930"
	{
		"AccountName"		"firstuser"
		"PersonaName"		"First User"
		"RememberPassword"		"1"
		"MostRecent"		"0"
		"Timestamp"		"1000000000"
		"AllowAutoLogin"		"0"
	}
	"76561197960287931"
	{
		"AccountName"		"seconduser"
		"personaname"		"Second User"
		"RememberPassword"		"1"
		"mostrecent"		"1"
		"Timestamp"		"1000000100"
		"AllowAutoLogin"		"1"
	}
}
"#;

    /// Separate from `SAMPLE_VDF`: `update_login_users_vdf` matches `AccountName`/
    /// `AllowAutoLogin`/`MostRecent`/`Timestamp` by exact key case (ported as-is from `main`'s
    /// `update_login_users_vdf`), unlike `parse_login_users`'s deliberately case-insensitive regex.
    /// That's fine in practice
    /// since Steam itself always writes these specific keys in canonical PascalCase - only
    /// `SAMPLE_VDF`'s mixed-case second account (used to prove the parser tolerates it) would be
    /// an unrealistic input for the *writer* path, so the update tests use this canonical fixture
    /// instead.
    const UPDATE_SAMPLE_VDF: &str = r#""users"
{
	"76561197960287930"
	{
		"AccountName"		"firstuser"
		"PersonaName"		"First User"
		"RememberPassword"		"1"
		"MostRecent"		"0"
		"Timestamp"		"1000000000"
		"AllowAutoLogin"		"0"
	}
	"76561197960287931"
	{
		"AccountName"		"seconduser"
		"PersonaName"		"Second User"
		"RememberPassword"		"1"
		"MostRecent"		"1"
		"Timestamp"		"1000000100"
		"AllowAutoLogin"		"1"
	}
}
"#;

    #[test]
    fn parses_every_account_in_order_with_case_insensitive_keys() {
        let dir = std::env::temp_dir().join(format!("sgi-vdf-test-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("loginusers.vdf");
        std::fs::write(&path, SAMPLE_VDF).unwrap();

        let users = parse_login_users(&path).expect("should parse sample vdf");

        assert_eq!(users.len(), 2);
        assert_eq!(users[0].steam_id, "76561197960287930");
        assert_eq!(users[0].persona_name, "First User");
        assert!(!users[0].most_recent);
        assert_eq!(users[1].steam_id, "76561197960287931");
        assert_eq!(users[1].persona_name, "Second User");
        assert!(users[1].most_recent);

        let _ = std::fs::remove_dir_all(&dir);
    }

    /// Matches the shape of a real `loginusers.vdf` from a current Steam client (reported by the
    /// user against their own install, not synthesized): no `MostRecent`/`AllowAutoLogin` keys at
    /// all, just `AutoLogin`. Locks in the fix for treating `AutoLogin` as equivalent to the legacy
    /// `MostRecent` flag - without it, `most_recent` would be `false` for every account (since
    /// neither legacy key exists to set it), which made CLI-mode sign-in think no account was ever
    /// the active one and unconditionally restart the local Steam client on every sign-in attempt,
    /// even when selecting the already-active account.
    const AUTO_LOGIN_ONLY_VDF: &str = r#""users"
{
	"76561198158912649"
	{
		"AccountName"		"probablyragiing"
		"PersonaName"		"zevnda"
		"RememberPassword"		"1"
		"WantsOfflineMode"		"0"
		"SkipOfflineModeWarning"		"0"
		"AutoLogin"		"0"
		"Timestamp"		"1783503462"
	}
	"76561198999797359"
	{
		"AccountName"		"xkefqjvfn"
		"PersonaName"		"Gogurt"
		"RememberPassword"		"1"
		"WantsOfflineMode"		"0"
		"SkipOfflineModeWarning"		"0"
		"AutoLogin"		"1"
		"Timestamp"		"1783503483"
	}
}
"#;

    #[test]
    fn treats_auto_login_as_most_recent_when_legacy_keys_are_absent() {
        let dir =
            std::env::temp_dir().join(format!("sgi-vdf-autologin-test-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("loginusers.vdf");
        std::fs::write(&path, AUTO_LOGIN_ONLY_VDF).unwrap();

        let users = parse_login_users(&path).expect("should parse auto-login-only vdf");
        let _ = std::fs::remove_dir_all(&dir);

        assert_eq!(users.len(), 2);
        let inactive = users
            .iter()
            .find(|u| u.steam_id == "76561198158912649")
            .unwrap();
        let active = users
            .iter()
            .find(|u| u.steam_id == "76561198999797359")
            .unwrap();
        assert!(!inactive.most_recent);
        assert!(active.most_recent);
    }

    #[test]
    fn update_flips_auto_login_when_legacy_keys_are_absent() {
        let (updated, account_name) =
            update_login_users_vdf(AUTO_LOGIN_ONLY_VDF, "76561198158912649", 1234567890).unwrap();

        assert_eq!(account_name, "probablyragiing");

        let dir =
            std::env::temp_dir().join(format!("sgi-vdf-autologin-update-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("loginusers.vdf");
        std::fs::write(&path, &updated).unwrap();
        let users = parse_login_users(&path).unwrap();
        let _ = std::fs::remove_dir_all(&dir);

        let target = users
            .iter()
            .find(|u| u.steam_id == "76561198158912649")
            .unwrap();
        let other = users
            .iter()
            .find(|u| u.steam_id == "76561198999797359")
            .unwrap();
        assert!(target.most_recent);
        assert!(!other.most_recent);
    }

    #[test]
    fn missing_file_is_a_typed_io_error() {
        let path = std::path::Path::new("K:/does/not/exist/loginusers.vdf");
        let err = parse_login_users(path).unwrap_err();
        assert!(matches!(err, AppError::LoginVdfIo(_)));
    }

    #[test]
    fn update_sets_target_account_and_clears_others() {
        let (updated, account_name) =
            update_login_users_vdf(UPDATE_SAMPLE_VDF, "76561197960287930", 1234567890).unwrap();

        assert_eq!(account_name, "firstuser");

        // Re-parse the rewritten content to confirm the flags actually flipped, rather than just
        // checking for substrings that could coincidentally match.
        let dir = std::env::temp_dir().join(format!("sgi-vdf-update-test-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("loginusers.vdf");
        std::fs::write(&path, &updated).unwrap();
        let users = parse_login_users(&path).unwrap();
        let _ = std::fs::remove_dir_all(&dir);

        let target = users
            .iter()
            .find(|u| u.steam_id == "76561197960287930")
            .unwrap();
        let other = users
            .iter()
            .find(|u| u.steam_id == "76561197960287931")
            .unwrap();
        assert!(target.most_recent);
        assert!(!other.most_recent);

        assert!(updated.contains("\"AllowAutoLogin\"\t\t\"1\""));
        assert!(updated.contains("\"Timestamp\"\t\t\"1234567890\""));
    }

    #[test]
    fn update_errors_when_steam_id_is_unknown() {
        let err = update_login_users_vdf(SAMPLE_VDF, "00000000000000000", 1).unwrap_err();
        assert!(matches!(err, AppError::SteamIdNotFound(id) if id == "00000000000000000"));
    }
}

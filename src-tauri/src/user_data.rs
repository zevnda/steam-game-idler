use reqwest::Client;
use serde_json::Value;

#[tauri::command]
pub async fn get_user_summary(steam_id: String, api_key: Option<String>) -> Result<Value, String> {
    // Get the API key from the environment or use the provided one
    let key = api_key.unwrap_or_else(|| std::env::var("KEY").unwrap());
    let url = format!(
        "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key={}&steamids={}",
        key, steam_id
    );

    let client = Client::new();

    // Send the request and handle the response
    match client.get(&url).send().await {
        Ok(response) => {
            let body: Value = response.json().await.map_err(|e| e.to_string())?;
            Ok(body)
        }
        Err(err) => Err(err.to_string()),
    }
}

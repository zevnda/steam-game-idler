use std::sync::Arc;
use steamworks::{AppId, Client};

pub fn init_api() -> Result<(Arc<Client>, steamworks::SingleClient), steamworks::SteamError> {
    let (client, single) =
        Client::init_app(AppId(480)).map_err(|_| steamworks::SteamError::Generic)?;
    Ok((Arc::new(client), single))
}

pub fn shutdown_api(client: Arc<Client>) {
    drop(client);
}

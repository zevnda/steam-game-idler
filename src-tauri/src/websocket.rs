use futures_util::{SinkExt, StreamExt};
use local_ip_address::local_ip;
use std::net::IpAddr;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio::net::TcpListener;
use tokio::sync::{broadcast, oneshot};
use tokio::time::sleep;
use tokio_tungstenite::accept_async;
use tokio_tungstenite::tungstenite::protocol::Message;
use uuid::Uuid;

// Store the handle to the running WebSocket server
lazy_static::lazy_static! {
    static ref WS_SERVER_HANDLE: Arc<Mutex<Option<oneshot::Sender<()>>>> = Arc::new(Mutex::new(None));
    // Broadcast channel for message passing between clients
    static ref MESSAGE_CHANNEL: (broadcast::Sender<(String, String)>, broadcast::Receiver<(String, String)>) = broadcast::channel(100);
}

pub async fn start_websocket_server(port: u16, server_type: &str) {
    let ip = if server_type == "public" {
        let ip = get_public_ip().expect("Failed to get public IP address");
        println!("Public IP address: {}", ip);
        ip
    } else {
        "127.0.0.1".to_string()
    };
    let addr = format!("{}:{}", ip, port);
    let listener = TcpListener::bind(&addr).await.expect("Failed to bind");
    println!("WebSocket server is online at ws://{}", addr);

    let (shutdown_tx, shutdown_rx) = oneshot::channel();
    {
        let mut handle = WS_SERVER_HANDLE.lock().unwrap();
        *handle = Some(shutdown_tx);
    }

    // Clone only the broadcast sender for use in the connection handler
    let tx = MESSAGE_CHANNEL.0.clone();

    tokio::select! {
        _ = async {
            while let Ok((stream, _)) = listener.accept().await {
                let tx = tx.clone();
                tokio::spawn(async move {
                    let ws_stream = accept_async(stream).await;
                    match ws_stream {
                        Ok(ws_stream) => {
                            let (mut write, mut read) = ws_stream.split();

                            // Generate a unique identifier for the client
                            let client_id = Uuid::new_v4().to_string();
                            let client_id_clone = client_id.clone();

                            // Subscribe to the broadcast channel to receive messages
                            let mut rx = MESSAGE_CHANNEL.1.resubscribe();

                            // Spawn a task to forward broadcast messages to the client
                            tokio::spawn(async move {
                                while let Ok((sender_id, msg)) = rx.recv().await {
                                    // Ensure the message is not sent back to the sender
                                    if sender_id != client_id_clone {
                                        if let Err(e) = write.send(Message::Text(msg)).await {
                                            println!("Failed to send message: {:?}", e);
                                            break;
                                        }
                                    }
                                }
                            });

                            // Read messages from the client and broadcast them
                            while let Some(msg) = read.next().await {
                                let msg = msg.expect("Failed to read message");
                                if msg.is_text() || msg.is_binary() {
                                    let text = msg.into_text().expect("Failed to parse text message");
                                    // Broadcast the message with the sender's identifier
                                    if let Err(e) = tx.send((client_id.clone(), text)) {
                                        println!("Failed to broadcast message: {:?}", e);
                                        break;
                                    }
                                }
                            }
                        }
                        Err(e) => {
                            println!("Error during the websocket handshake occurred: {:?}", e);
                        }
                    }
                });
            }
        } => {},
        _ = shutdown_rx => {
            println!("WebSocket server is shutting down");
        }
    }
}

fn get_public_ip() -> Option<String> {
    match local_ip() {
        Ok(IpAddr::V4(ipv4)) => Some(ipv4.to_string()),
        _ => None,
    }
}

#[tauri::command]
pub async fn start_ws_server(port: u16, server_type: String) -> Result<String, String> {
    // Stop the current WebSocket server if it is running
    if let Some(shutdown_tx) = WS_SERVER_HANDLE.lock().unwrap().take() {
        let _ = shutdown_tx.send(());
    }

    // Introduce a short delay to ensure the port is released
    sleep(Duration::from_secs(1)).await;

    let ip = if server_type == "public" {
        get_public_ip().unwrap_or_else(|| "127.0.0.1".to_string())
    } else {
        "127.0.0.1".to_string()
    };

    tauri::async_runtime::spawn(async move {
        println!("Starting WebSocket server on port {}...", port);
        start_websocket_server(port, &server_type).await;
    });

    // Wait for a short duration to check if the server is running
    sleep(Duration::from_secs(1)).await;

    // Check if the server is running by attempting to bind to the same port
    match TcpListener::bind(format!("{}:{}", ip, port)).await {
        // If failed to bind, the server is running
        Ok(_) => Ok("{\"error\": \"Failed to start ws server\"}".to_string()),
        Err(_) => Ok(format!("{{\"host\": \"{}\"}}", ip)),
    }
}

#[tauri::command]
pub async fn stop_ws_server() -> Result<String, String> {
    // Stop the current WebSocket server if it is running
    if let Some(shutdown_tx) = WS_SERVER_HANDLE.lock().unwrap().take() {
        let _ = shutdown_tx.send(());
        println!("WebSocket server is shutting down");
        Ok("{\"message\": \"WebSocket server stopped\"}".to_string())
    } else {
        Ok("{\"error\": \"No WebSocket server is running\"}".to_string())
    }
}

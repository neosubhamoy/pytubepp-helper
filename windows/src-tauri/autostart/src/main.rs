#![windows_subsystem = "windows"]

use std::process::Command;
use websocket::client::ClientBuilder;
use websocket::OwnedMessage;
use std::thread::sleep;
use std::time::Duration;

fn connect_with_retry(url: &str, max_attempts: u32) -> Result<websocket::sync::Client<std::net::TcpStream>, Box<dyn std::error::Error>> {
    let mut attempts = 0;
    loop {
        match ClientBuilder::new(url).unwrap().connect_insecure() {
            Ok(client) => {
                eprintln!("Successfully connected to Tauri app :)");
                return Ok(client);
            }
            Err(e) => {
                attempts += 1;
                if attempts >= max_attempts {
                    return Err(Box::new(e));
                }
                let wait_time = Duration::from_secs(2u64.pow(attempts));
                eprintln!("Connection attempt {} failed. Retrying in {:?}...", attempts, wait_time);
                sleep(wait_time);
            }
        }
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Launch the main application
    let _ = Command::new("pytubepp-helper.exe")
        .spawn();

    // Connect with the Tauri app
    let websocket_url = "ws://localhost:3030";
    eprintln!("Attempting to connect to {}", websocket_url);

    let mut client = match connect_with_retry(websocket_url, 2) {
        Ok(client) => client,
        Err(e) => {
            eprintln!("Failed to connect after multiple attempts: {:?}", e);
            return Err(e);
        }
    };

    // Send message to Tauri app
    client.send_message(&OwnedMessage::Text(serde_json::json!({
        "url": "",
        "command": "autostart",
        "argument": ""
    }).to_string()))?;

    Ok(())
}
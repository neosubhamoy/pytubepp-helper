use std::io::{self, Read, Write};
use websocket::client::ClientBuilder;
use websocket::OwnedMessage;
use std::thread::sleep;
use std::time::Duration;
use serde_json::Value;

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

fn read_stdin_message() -> Result<String, Box<dyn std::error::Error>> {
    let mut stdin = io::stdin();
    let mut length_bytes = [0u8; 4];
    stdin.read_exact(&mut length_bytes)?;
    let length = u32::from_ne_bytes(length_bytes) as usize;

    let mut buffer = vec![0u8; length];
    stdin.read_exact(&mut buffer)?;

    let message = String::from_utf8(buffer)?;
    Ok(message)
}

fn write_stdout_message(message: &str) -> Result<(), Box<dyn std::error::Error>> {
    let message_bytes = message.as_bytes();
    let message_size = message_bytes.len();
    io::stdout().write_all(&(message_size as u32).to_ne_bytes())?;
    io::stdout().write_all(message_bytes)?;
    io::stdout().flush()?;
    Ok(())
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    eprintln!("Waiting for message from extension...");
    
    let input = match read_stdin_message() {
        Ok(msg) => {
            eprintln!("Received message: {}", msg);
            msg
        },
        Err(e) => {
            eprintln!("Error reading message: {:?}", e);
            return Err(e);
        }
    };

    // Send immediate response to the extension
    write_stdout_message(&serde_json::json!({
        "status": "received",
        "message": "Message received by native host"
    }).to_string())?;

    let parsed: Value = serde_json::from_str(&input)?;

    let websocket_url = "ws://localhost:3030";
    eprintln!("Attempting to connect to {}", websocket_url);

    let mut client = match connect_with_retry(websocket_url, 2) {
        Ok(client) => client,
        Err(e) => {
            eprintln!("Failed to connect after multiple attempts: {:?}", e);
            write_stdout_message(&serde_json::json!({
                "status": "error",
                "message": "Failed to connect to Tauri app"
            }).to_string())?;
            return Err(e);
        }
    };

    // Send message to Tauri app
    client.send_message(&OwnedMessage::Text(parsed.to_string()))?;

    // Receive response from Tauri app
    let message = client.recv_message()?;
    
    // Send Tauri app's response back to browser extension
    if let OwnedMessage::Text(text) = message {
        write_stdout_message(&serde_json::json!({
            "status": "success",
            "response": text
        }).to_string())?;
    }

    Ok(())
}

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{process::Command, sync::Arc, env};
use serde_json::Value;
use tauri::{CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu};
use tokio::{net::{TcpListener, TcpStream}, sync::{Mutex, oneshot}};
use tokio_tungstenite::accept_async;
use futures_util::{SinkExt, StreamExt};

struct ResponseChannel {
    sender: Option<oneshot::Sender<String>>,
}

struct WebSocketState {
    sender: Option<futures_util::stream::SplitSink<tokio_tungstenite::WebSocketStream<TcpStream>, tokio_tungstenite::tungstenite::Message>>,
    response_channel: ResponseChannel,
}

// #[tauri::command]
// async fn handle_websocket_message(message: String) -> Result<String, String> {
//     Ok(format!("{}", message))
// }

#[tauri::command]
async fn send_to_extension(
    message: String,
    state: tauri::State<'_, Arc<Mutex<WebSocketState>>>,
) -> Result<(), String> {
    let mut state = state.lock().await;
    if let Some(sender) = &mut state.sender {
        sender.send(tokio_tungstenite::tungstenite::Message::Text(message)).await
            .map_err(|e| format!("Failed to send message: {}", e))?;
        Ok(())
    } else {
        Err("No active WebSocket connection".to_string())
    }
}

#[tauri::command]
async fn receive_frontend_response(
    response: String,
    state: tauri::State<'_, Arc<Mutex<WebSocketState>>>,
) -> Result<(), String> {
    let mut state = state.lock().await;
    if let Some(sender) = state.response_channel.sender.take() {
        sender.send(response).map_err(|e| format!("Failed to send response: {:?}", e))?;
    }
    Ok(())
}

#[tauri::command]
fn fetch_video_info(url: String) {
    #[cfg(target_os = "windows")]
    {
        let command = format!("pytubepp \"{}\" -i", &url);
        Command::new("cmd")
            .args(["/k", command.as_str()])
            .spawn()
            .unwrap();
    }

    #[cfg(target_os = "linux")]
    {
        let command = format!("pytubepp \"{}\" -i", &url);
        Command::new("gnome-terminal")
            .args(["--", command.as_str()])
            .spawn()
            .unwrap();
    }

    #[cfg(target_os = "macos")]
    {
        let command = format!("pytubepp \"{}\" -i", &url);
        Command::new("osascript")
            .arg("-e")
            .arg(format!(
                "tell app \"Terminal\" to activate do script \"{}\"",
                command
            ))
            .spawn()
            .unwrap();
    }
}

#[tauri::command]
fn download_stream(url: String, stream: String) {
    #[cfg(target_os = "windows")]
    {
        let command = format!("pytubepp \"{}\" -s {}", &url, &stream);
        Command::new("cmd")
            .args(["/k", command.as_str()])
            .spawn()
            .unwrap();
    }

    #[cfg(target_os = "linux")]
    {
        let command = format!("pytubepp \"{}\" -s {}", &url, &stream);
        Command::new("gnome-terminal")
            .args(["--", command.as_str()])
            .spawn()
            .unwrap();
    }

    #[cfg(target_os = "macos")]
    {
        let command = format!("pytubepp \"{}\" -s {}", &url, &stream);
        Command::new("osascript")
            .arg("-e")
            .arg(format!(
                "tell app \"Terminal\" to activate do script \"{}\"",
                command
            ))
            .spawn()
            .unwrap();
    }
}

#[tokio::main]
async fn main() {
    let websocket_state = Arc::new(Mutex::new(WebSocketState { 
        sender: None,
        response_channel: ResponseChannel { sender: None },
    }));
    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("show".to_string(), "Show"))
        .add_item(CustomMenuItem::new("quit".to_string(), "Quit"));

    let system_tray = SystemTray::new().with_menu(tray_menu).with_tooltip("PytubePP Helper");

    tauri::Builder::default()
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick {
                position: _,
                size: _,
                ..
            } => {
                let window = app.get_window("main").unwrap();
                window.show().unwrap();
                window.set_focus().unwrap();
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "show" => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            },
            _ => {}
        })
        .manage(websocket_state.clone())
        .setup(move |app| {
            let app_handle = app.handle();
            let ws_state = websocket_state.clone();
            tokio::spawn(async move {
                let listener = TcpListener::bind("127.0.0.1:3030").await.unwrap();
                println!("WebSocket server listening on ws://127.0.0.1:3030");
                while let Ok((stream, _)) = listener.accept().await {
                    let app_handle = app_handle.clone();
                    let ws_state = ws_state.clone();
                    tokio::spawn(handle_connection(stream, app_handle, ws_state));
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // handle_websocket_message,
            send_to_extension,
            fetch_video_info,
            download_stream,
            receive_frontend_response
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn handle_connection(stream: TcpStream, app_handle: tauri::AppHandle, ws_state: Arc<Mutex<WebSocketState>>) {
    let ws_stream = accept_async(stream).await.unwrap();
    let (ws_sender, mut ws_receiver) = ws_stream.split();

    // Store the sender in the shared state
    {
        let mut state = ws_state.lock().await;
        state.sender = Some(ws_sender);
    }

    println!("New WebSocket connection established");

    while let Some(msg) = ws_receiver.next().await {
        if let Ok(msg) = msg {
            if let Ok(text) = msg.to_text() {
                println!("Received message: {}", text);
                
                // Parse the JSON message
                if let Ok(json_value) = serde_json::from_str::<Value>(text) {
                    // Create a new channel for this request
                    let (response_sender, response_receiver) = oneshot::channel();
                    {
                        let mut state = ws_state.lock().await;
                        state.response_channel.sender = Some(response_sender);
                    }

                    // Emit an event to the frontend
                    app_handle.emit_all("websocket-message", json_value).unwrap();
                    
                    // Wait for the response from the frontend
                    let response = response_receiver.await
                        .unwrap_or_else(|e| format!("Error receiving response: {:?}", e));

                    // Send the response back through WebSocket
                    let mut state = ws_state.lock().await;
                    if let Some(sender) = &mut state.sender {
                        let _ = sender.send(tokio_tungstenite::tungstenite::Message::Text(response)).await;
                    }
                }
            }
        }
    }

    println!("WebSocket connection closed");
    
    // Remove the sender from the shared state when the connection closes
    let mut state = ws_state.lock().await;
    state.sender = None;
}
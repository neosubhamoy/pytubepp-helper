// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod config;
use config::{Config, load_config, save_config, get_config_path};
use std::{process::Command, sync::Arc, env, time::Duration};
use serde_json::Value;
use tauri::{CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu};
use tokio::{net::{TcpListener, TcpStream}, sync::{Mutex, oneshot}, time::sleep};
use tokio_tungstenite::{accept_async, connect_async};
use futures_util::{SinkExt, StreamExt};

struct ResponseChannel {
    sender: Option<oneshot::Sender<String>>,
}

struct WebSocketState {
    sender: Option<futures_util::stream::SplitSink<tokio_tungstenite::WebSocketStream<TcpStream>, tokio_tungstenite::tungstenite::Message>>,
    response_channel: ResponseChannel,
    server_abort: Option<tokio::sync::oneshot::Sender<()>>,
    config: Config,
}

async fn is_another_instance_running(port: u16) -> bool {
    match connect_async(format!("ws://127.0.0.1:{}", port)).await {
        Ok(_) => true,
        Err(_) => false
    }
}

async fn try_bind_ws_port(port: u16) -> Option<TcpListener> {
    match TcpListener::bind(format!("127.0.0.1:{}", port)).await {
        Ok(listener) => Some(listener),
        Err(_) => None
    }
}

async fn start_websocket_server(app_handle: tauri::AppHandle, port: u16) -> Result<(), String> {
    let addr = format!("127.0.0.1:{}", port);
    
    // First ensure any existing server is stopped
    {
        let state = app_handle.state::<Arc<Mutex<WebSocketState>>>();
        let mut state = state.lock().await;
        if let Some(old_abort) = state.server_abort.take() {
            let _ = old_abort.send(());
            // Give it a moment to shut down
            sleep(Duration::from_millis(200)).await;
        }
    }
    
    // Now try to bind to the port
    let listener = TcpListener::bind(&addr).await
        .map_err(|e| format!("Failed to bind to port {}: {}", port, e))?;
    
    let (abort_sender, mut abort_receiver) = tokio::sync::oneshot::channel();
    
    // Store the new abort sender
    {
        let state = app_handle.state::<Arc<Mutex<WebSocketState>>>();
        let mut state = state.lock().await;
        state.server_abort = Some(abort_sender);
    }
    
    // Spawn the server task
    tokio::spawn(async move {
        println!("Starting WebSocket server on port {}", port);
        loop {
            tokio::select! {
                accept_result = listener.accept() => {
                    match accept_result {
                        Ok((stream, _)) => {
                            let app_handle = app_handle.clone();
                            tokio::spawn(handle_connection(stream, app_handle));
                        }
                        Err(e) => {
                            println!("Error accepting connection: {}", e);
                            break;
                        }
                    }
                }
                _ = &mut abort_receiver => {
                    println!("WebSocket server shutting down on port {}...", port);
                    break;
                }
            }
        }
    });
    
    // Wait a moment to ensure the server has started
    sleep(Duration::from_millis(100)).await;
    Ok(())
}

#[tauri::command]
async fn get_config(state: tauri::State<'_, Arc<Mutex<WebSocketState>>>) -> Result<Config, String> {
    let state = state.lock().await;
    Ok(state.config.clone())
}

#[tauri::command]
fn get_config_file_path() -> Result<String, String> {
    match get_config_path() {
        Some(path) => Ok(path.to_string_lossy().into_owned()),
        None => Err("Could not determine config path".to_string()),
    }
}

#[tauri::command]
async fn update_config(
    new_config: Config,
    state: tauri::State<'_, Arc<Mutex<WebSocketState>>>,
    app_handle: tauri::AppHandle,
) -> Result<Config, String> {
    // Save the new config first
    save_config(&new_config)?;
    
    // Update the state with new config
    {
        let mut state = state.lock().await;
        state.config = new_config.clone();
    }
    
    // Start the new server (this will also handle stopping the old one)
    start_websocket_server(app_handle, new_config.port).await?;
    
    Ok(new_config)
}

#[tauri::command]
async fn reset_config(
    state: tauri::State<'_, Arc<Mutex<WebSocketState>>>,
    app_handle: tauri::AppHandle,
) -> Result<Config, String> {
    let config = Config::default();
    save_config(&config)?;
    
    {
        let mut state = state.lock().await;
        state.config = config.clone();
    }
    
    start_websocket_server(app_handle, config.port).await?;
    
    Ok(config)
}

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
            .args(["--", "bash", "-c", command.as_str()])
            .spawn()
            .unwrap();
    }

    #[cfg(target_os = "macos")]
    {
        let command = format!("pytubepp \"{}\" -i", &url);
        let escaped_command = command.replace("\"", "\\\"");

        let applescript = format!(
            "tell application \"Terminal\"\n\
            do script \"{}\"\n\
            activate\n\
            end tell",
            escaped_command
        );

        Command::new("osascript")
            .arg("-e")
            .arg(applescript)
            .spawn()
            .unwrap();
    }
}

#[tauri::command]
fn install_program(icommand: String) {
    #[cfg(target_os = "windows")]
    {
        let command = format!("{}", &icommand);
        Command::new("cmd")
            .args(["/k", command.as_str()])
            .spawn()
            .unwrap();
    }

    #[cfg(target_os = "linux")]
    {
        let command = format!("{}", &icommand);
        Command::new("gnome-terminal")
            .args(["--", "bash", "-c", command.as_str()])
            .spawn()
            .unwrap();
    }

    #[cfg(target_os = "macos")]
    {
        let command = format!("{}", &icommand);
        let escaped_command = command.replace("\"", "\\\"");

        let applescript = format!(
            "tell application \"Terminal\"\n\
            do script \"{}\"\n\
            activate\n\
            end tell",
            escaped_command
        );

        Command::new("osascript")
            .arg("-e")
            .arg(applescript)
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
            .args(["--", "bash", "-c", command.as_str()])
            .spawn()
            .unwrap();
    }

    #[cfg(target_os = "macos")]
    {
        let command = format!("pytubepp \"{}\" -s {}", &url, &stream);
        let escaped_command = command.replace("\"", "\\\"");

        let applescript = format!(
            "tell application \"Terminal\"\n\
            do script \"{}\"\n\
            activate\n\
            end tell",
            escaped_command
        );

        Command::new("osascript")
            .arg("-e")
            .arg(applescript)
            .spawn()
            .unwrap();
    }
}

#[tokio::main]
async fn main() {
    let _ = fix_path_env::fix();

    let config = load_config();
    let port = config.port;

    let websocket_state = Arc::new(Mutex::new(WebSocketState { 
        sender: None,
        response_channel: ResponseChannel { sender: None },
        server_abort: None,
        config,
    }));
    
    // Check if another instance is running
    if is_another_instance_running(port).await {
        println!("Another instance is already running. Exiting...");
        std::process::exit(0);
    }

    // Try to bind to the WebSocket port with a few retries
    let mut port_available = false;
    for _ in 0..3 {
        if let Some(_) = try_bind_ws_port(port).await {
            port_available = true;
            break;
        }
        sleep(Duration::from_millis(100)).await;
    }

    // If we couldn't bind to the port after retries, assume another instance is running
    if !port_available {
        println!("Could not bind to WebSocket port. Another instance might be running. Exiting...");
        std::process::exit(0);
    }
    
    let args: Vec<String> = env::args().collect();
    let start_hidden = args.contains(&"--hidden".to_string());
    
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
            let window = app.get_window("main").unwrap();
            
            if start_hidden {
                window.hide().unwrap();
            }

            // Start the initial WebSocket server
            let app_handle = app.handle();
            tokio::spawn(async move {
                if let Err(e) = start_websocket_server(app_handle, port).await {
                    println!("Failed to start initial WebSocket server: {}", e);
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            send_to_extension,
            fetch_video_info,
            install_program,
            download_stream,
            receive_frontend_response,
            get_config,
            update_config,
            reset_config,
            get_config_file_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn handle_connection(stream: TcpStream, app_handle: tauri::AppHandle) {
    let ws_stream = accept_async(stream).await.unwrap();
    let (ws_sender, mut ws_receiver) = ws_stream.split();

    // Store the sender in the shared state
    {
        let state = app_handle.state::<Arc<Mutex<WebSocketState>>>();
        let mut state = state.lock().await;
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
                        let state = app_handle.state::<Arc<Mutex<WebSocketState>>>();
                        let mut state = state.lock().await;
                        state.response_channel.sender = Some(response_sender);
                    }

                    // Emit an event to the frontend
                    app_handle.emit_all("websocket-message", json_value).unwrap();
                    
                    // Wait for the response from the frontend
                    let response = response_receiver.await
                        .unwrap_or_else(|e| format!("Error receiving response: {:?}", e));

                    // Send the response back through WebSocket
                    let state = app_handle.state::<Arc<Mutex<WebSocketState>>>();
                    let mut state = state.lock().await;
                    if let Some(sender) = &mut state.sender {
                        let _ = sender.send(tokio_tungstenite::tungstenite::Message::Text(response)).await;
                    }
                }
            }
        }
    }

    println!("WebSocket connection closed");
    
    // Remove the sender from the shared state when the connection closes
    let state = app_handle.state::<Arc<Mutex<WebSocketState>>>();
    let mut state = state.lock().await;
    state.sender = None;
}
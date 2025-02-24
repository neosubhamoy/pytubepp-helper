// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod config;
use config::{get_config_path, load_config, save_config, Config};
use futures_util::{SinkExt, StreamExt};
use serde_json::Value;
use std::{env, process::Command, sync::Arc, time::Duration};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};
use tokio::{
    net::{TcpListener, TcpStream},
    sync::{oneshot, Mutex},
    time::sleep,
};
use tokio_tungstenite::accept_async;

struct ResponseChannel {
    sender: Option<oneshot::Sender<String>>,
}

struct WebSocketState {
    sender: Option<
        futures_util::stream::SplitSink<
            tokio_tungstenite::WebSocketStream<TcpStream>,
            tokio_tungstenite::tungstenite::Message,
        >,
    >,
    response_channel: ResponseChannel,
    server_abort: Option<tokio::sync::oneshot::Sender<()>>,
    config: Config,
}

async fn is_port_available(port: u16) -> bool {
    match TcpListener::bind(format!("127.0.0.1:{}", port)).await {
        Ok(_) => true,
        Err(_) => false,
    }
}

async fn wait_for_port_availability(port: u16, max_attempts: u32) -> Result<(), String> {
    let mut attempts = 0;
    while attempts < max_attempts {
        if is_port_available(port).await {
            return Ok(());
        }
        sleep(Duration::from_millis(500)).await;
        attempts += 1;
    }
    Err(format!("Port {} did not become available after {} attempts", port, max_attempts))
}

async fn start_websocket_server(app_handle: tauri::AppHandle, port: u16) -> Result<(), String> {
    let addr = format!("127.0.0.1:{}", port);

    // First ensure any existing server is stopped
    {
        let state = app_handle.state::<Arc<Mutex<WebSocketState>>>();
        let mut state = state.lock().await;
        if let Some(old_abort) = state.server_abort.take() {
            let _ = old_abort.send(());
            // Wait for the port to become available
            wait_for_port_availability(port, 6).await?; // Try for 3 seconds (6 attempts * 500ms)
        }
    }

    // Now try to bind to the port
    let listener = match TcpListener::bind(&addr).await {
        Ok(l) => l,
        Err(_e) => {
            // One final attempt to wait and retry
            sleep(Duration::from_secs(1)).await;
            TcpListener::bind(&addr)
                .await
                .map_err(|e| format!("Failed to bind to port {}: {}", port, e))?
        }
    };

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
        sender
            .send(tokio_tungstenite::tungstenite::Message::Text(message))
            .await
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
        sender
            .send(response)
            .map_err(|e| format!("Failed to send response: {:?}", e))?;
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
fn download_stream(url: String, stream: String, caption: Option<String>) {
    let caption = caption.unwrap_or("none".to_string());
    #[cfg(target_os = "windows")]
    {
        let command = format!("pytubepp \"{}\" -s {} -c {}", &url, &stream, &caption);
        Command::new("cmd")
            .args(["/k", command.as_str()])
            .spawn()
            .unwrap();
    }

    #[cfg(target_os = "linux")]
    {
        let command = format!("pytubepp \"{}\" -s {} -c {}", &url, &stream, &caption);
        Command::new("gnome-terminal")
            .args(["--", "bash", "-c", command.as_str()])
            .spawn()
            .unwrap();
    }

    #[cfg(target_os = "macos")]
    {
        let command = format!("pytubepp \"{}\" -s {} -c {}", &url, &stream, &caption);
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() {
    let _ = fix_path_env::fix();

    let config = load_config();
    let port = config.port;

    let websocket_state = Arc::new(Mutex::new(WebSocketState {
        sender: None,
        response_channel: ResponseChannel { sender: None },
        server_abort: None,
        config,
    }));

    let args: Vec<String> = env::args().collect();
    let start_hidden = args.contains(&"--hidden".to_string());

    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // Focus the main window when attempting to launch another instance
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_notification::init())
        .manage(websocket_state.clone())
        .setup(move |app| {
            // Create menu items
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)
                .map_err(|e| format!("Failed to create quit menu item: {}", e))?;
            let show = MenuItem::with_id(app, "show", "Show", true, None::<&str>)
                .map_err(|e| format!("Failed to create show menu item: {}", e))?;

            // Create the menu
            let menu = Menu::with_items(app, &[&show, &quit])
                .map_err(|e| format!("Failed to create menu: {}", e))?;

            // Create and store the tray icon
            let tray = TrayIconBuilder::with_id("main")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("PytubePP Helper")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)
                .map_err(|e| format!("Failed to create tray: {}", e))?;

            // Store the tray handle in the app state
            app.manage(tray);

            let window = app.get_webview_window("main").unwrap();
            if start_hidden {
                window.hide().unwrap();
            }

            // Start the initial WebSocket server
            let app_handle = app.handle().clone();
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
                    app_handle
                        .emit_to("main", "websocket-message", json_value)
                        .unwrap();

                    // Wait for the response from the frontend
                    let response = response_receiver
                        .await
                        .unwrap_or_else(|e| format!("Error receiving response: {:?}", e));

                    // Send the response back through WebSocket
                    let state = app_handle.state::<Arc<Mutex<WebSocketState>>>();
                    let mut state = state.lock().await;
                    if let Some(sender) = &mut state.sender {
                        let _ = sender
                            .send(tokio_tungstenite::tungstenite::Message::Text(response))
                            .await;
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

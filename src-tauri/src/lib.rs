use portable_pty::{CommandBuilder, NativePtySystem, PtySize, PtySystem, MasterPty};
use std::sync::{Arc, Mutex};
use std::thread;
use std::io::{Read, Write};
use tauri::{Emitter, Manager};

struct AppState {
    master: Arc<Mutex<Option<Box<dyn MasterPty + Send>>>>,
    writer: Arc<Mutex<Option<Box<dyn Write + Send>>>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            master: Arc::new(Mutex::new(None)),
            writer: Arc::new(Mutex::new(None)),
        }
    }
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn create_terminal(window: tauri::Window, state: tauri::State<'_, AppState>) -> Result<(), String> {
    let pty_system = NativePtySystem::default();
    let pair = pty_system.openpty(PtySize {
        rows: 24,
        cols: 80,
        pixel_width: 0,
        pixel_height: 0,
    }).map_err(|e| e.to_string())?;

    let cmd = if cfg!(target_os = "windows") {
        CommandBuilder::new("powershell")
    } else {
        CommandBuilder::new("bash")
    };
    
    let _child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
    
    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;

    {
        let mut m = state.master.lock().unwrap();
        // portable_pty's MasterPty usually is Send, but let's box it to be safe and type-erasured if needed.
        // On Windows it might be different type than Unix.
        *m = Some(pair.master);
        let mut w = state.writer.lock().unwrap();
        *w = Some(writer);
    }

    // Spawn read thread
    thread::spawn(move || {
        let mut buf = [0u8; 1024];
        loop {
            match reader.read(&mut buf) {
                Ok(n) if n > 0 => {
                    let data = String::from_utf8_lossy(&buf[..n]).to_string();
                    window.emit("term-data", data).unwrap_or(());
                }
                Ok(_) => break, // EOF
                Err(_) => break,
            }
        }
    });

    Ok(())
}

#[tauri::command]
fn write_to_pty(data: String, state: tauri::State<'_, AppState>) -> Result<(), String> {
    let mut w_guard = state.writer.lock().unwrap();
    if let Some(w) = w_guard.as_mut() {
        write!(w, "{}", data).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn resize_pty(rows: u16, cols: u16, state: tauri::State<'_, AppState>) -> Result<(), String> {
    let mut m_guard = state.master.lock().unwrap();
    if let Some(m) = m_guard.as_mut() {
        m.resize(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 }).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![greet, create_terminal, write_to_pty, resize_pty])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

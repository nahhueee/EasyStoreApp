// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use serde_json::{Value};
use std::env;
use std::fs;
use tauri::{Manager, WindowBuilder, WindowUrl};
use std::net::{UdpSocket};
use std::time::Duration;
use std::process::Command;


//Funcion para abrir en una nueva ventana el detalle de caja
#[tauri::command]
async fn open_detail(app: tauri::AppHandle, url: String) {
  // Extraer el ID desde la URL para crear un label único
  let label = format!("detalle-{}", extract_id(&url));

  if let Some(window) = app.get_window(&label) {
    if window.is_minimized().unwrap_or(false) {
      let _ = window.unminimize(); // Restaurar si está minimizada
    }
    let _ = window.maximize(); // Asegurarse de que esté maximizada
    let _ = window.show();     // Mostrar por si estaba oculta
    let _ = window.set_focus(); // Darle foco
  } else {
    // Crear una nueva ventana con el label único
    match WindowBuilder::new(
      &app,
      &label,
      WindowUrl::App(url.into()),
    )
    .title("Detalles de Caja")
    .maximized(true)
    .resizable(true)
    .build() {
      Ok(_) => (),
      Err(e) => eprintln!("Error al crear la ventana: {}", e),
    }
  }
}

// Función auxiliar para obtener el ID del detalle desde la URL
fn extract_id(url: &str) -> &str {
  url.rsplit('/').next().unwrap_or("default")
}

//Funcion para obtener la ip de un servidor por upd
#[tauri::command]
fn discover_server() -> Option<String> {
    let socket = UdpSocket::bind("0.0.0.0:0").expect("No se pudo crear el socket");
    socket.set_broadcast(true).ok()?;
    socket.set_read_timeout(Some(Duration::from_secs(2))).ok()?; // Espera 2 segundos

    let msg = b"DISCOVER_SERVER";
    let broadcast_address = "255.255.255.255:41234";

    socket.send_to(msg, broadcast_address).ok()?;

    let mut buf = [0; 1024];
    if let Ok((amt, src)) = socket.recv_from(&mut buf) {
        let response = String::from_utf8_lossy(&buf[..amt]);
        if response.starts_with("DISCOVERY_RESPONSE|") {
            println!("✅ Servidor encontrado en {}", src);
            return Some(response.to_string());
        }
    }

    println!("❌ No se encontró servidor");
    None
}

//Funcion para cambiar el modo del servidor y reiniciar
#[tauri::command]
async fn change_config_reset(valor:bool) -> Result<(), String> {
    // Obtener el path del ejecutable
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;

    // Subir un nivel y entrar a server/config.json
    let config_path = exe_path
        .parent()                             // carpeta del ejecutable
        .and_then(|p| p.parent())             // subir un nivel
        .map(|p| p.join("server/config.pc.json")) // apuntar al config
        .ok_or("No se pudo construir el path")?;

    // Leer archivo JSON
    let config_data = fs::read_to_string(&config_path)
        .map_err(|e| format!("Error leyendo el archivo: {}", e))?;
    
    let mut json: Value = serde_json::from_str(&config_data)
        .map_err(|e| format!("Error parseando JSON: {}", e))?;

    // Cambiar la propiedad esServer
    json["esServer"] = Value::Bool(valor); 

    // Escribir de nuevo el archivo
    fs::write(&config_path, serde_json::to_string_pretty(&json).unwrap())
        .map_err(|e| format!("Error escribiendo archivo: {}", e))?;


    let home_dir = env::var("USERPROFILE").unwrap_or_default();
    let pm2_path = format!(r"{}\AppData\Roaming\npm\pm2.cmd", home_dir);
    //reinicia PM2
    Command::new(pm2_path)
    .arg("restart")
    .arg("easysales")
    .output()
    .map_err(|e| format!("Error ejecutando PM2: {}", e))?;


    Ok(())
}


fn main() {
  tauri::Builder::default()
     .invoke_handler(tauri::generate_handler![
        change_config_reset,
        open_detail,
        discover_server
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
use std::sync::Arc;
use std::path::PathBuf;
use std::net::SocketAddr;
use std::time::Duration;

use tokio::signal;
use tonic::transport::Server;
use parking_lot::RwLock;
use tracing::{info, error};
use tracing_subscriber::{EnvFilter, fmt};

use postdevai::core::memory::{
    HybridMemory, HybridConfig,
    RamLakeConfig, StoreAllocation,
    PersistentConfig
};
use postdevai::core::network::dragon_node_service::{DragonNodeServiceImpl, DragonNodeServiceServer};
use postdevai::mlx::models::MLXModelManager;
use postdevai::utils::config::{load_config, ModelConfig};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();
    
    info!("Starting Dragon Node server...");
    
    // Load configuration
    let config_path = std::env::var("CONFIG_PATH")
        .unwrap_or_else(|_| "./config/dragon_node.toml".to_string());
    
    let config = load_config(&config_path)?;
    
    // Setup Hybrid Memory System (RAM-Lake + Persistent Storage)
    info!("Initializing Hybrid Memory System...");
    let ramdisk_path = PathBuf::from(&config.ramlake.path);
    let persistent_path = PathBuf::from("/var/lib/postdevai/persistent");
    
    // Create persistent storage directory if it doesn't exist
    std::fs::create_dir_all(&persistent_path)?;
    
    let hybrid_config = HybridConfig {
        ramlake_config: RamLakeConfig {
            max_size: config.ramlake.max_size,
            backup_interval: config.ramlake.backup_interval,
            backup_path: PathBuf::from(&config.ramlake.backup_path),
            allocation: StoreAllocation {
                vector_store: config.ramlake.allocation.vector_store,
                code_store: config.ramlake.allocation.code_store,
                history_store: config.ramlake.allocation.history_store,
                metadata_store: config.ramlake.allocation.metadata_store,
            },
        },
        persistent_config: PersistentConfig {
            max_size: 1024 * 1024 * 1024 * 1024, // 1TB
            compression: "zstd".to_string(),
            cache_size_mb: 2048, // 2GB cache for Dragon Node
            write_buffer_size_mb: 512,
            enable_wal: true,
        },
        hot_retention_secs: 86400, // 24 hours
        sync_interval_secs: 300, // 5 minutes
        max_ram_entries: 10_000_000, // 10M entries max in RAM
    };
    
    let hybrid_memory = HybridMemory::new(ramdisk_path, persistent_path, hybrid_config).await
        .map_err(|e| format!("Failed to initialize Hybrid Memory: {}", e))?;
    
    // Restore hot data from persistent storage
    info!("Restoring hot data from persistent storage...");
    let restored_count = hybrid_memory.restore_hot_data(Some(100_000)).await
        .map_err(|e| format!("Failed to restore hot data: {}", e))?;
    info!("Restored {} entries to RAM-Lake", restored_count);
    
    let hybrid_memory = Arc::new(RwLock::new(hybrid_memory));
    
    // Setup MLX Model Manager
    info!("Initializing MLX Model Manager...");
    
    // Convert ModelConfig to format required by MLXModelManager
    let models_config: std::collections::HashMap<String, ModelConfig> = config.models.models
        .into_iter()
        .map(|m| (m.name.clone(), m))
        .collect();
    
    let model_manager = MLXModelManager::new(
        models_config,
        config.models.memory_limit,
        &config.models.device,
    )?;
    
    let model_manager = Arc::new(RwLock::new(model_manager));
    
    // Create Dragon Node service
    let dragon_service = DragonNodeServiceImpl::new(ram_lake.clone(), model_manager.clone());
    
    // Start gRPC server
    let addr: SocketAddr = format!("{}:{}", config.server.host, config.server.port).parse()?;
    info!("Starting gRPC server on {}", addr);
    
    Server::builder()
        .add_service(DragonNodeServiceServer::new(dragon_service))
        .serve_with_shutdown(addr, shutdown_signal())
        .await?;
    
    info!("Dragon Node server shutting down...");
    
    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("Failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("Failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {
            info!("Received Ctrl+C, shutting down...");
        },
        _ = terminate => {
            info!("Received terminate signal, shutting down...");
        },
    }
}
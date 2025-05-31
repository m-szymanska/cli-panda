use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;
use parking_lot::RwLock;
use uuid::Uuid;
use tokio::task;
use tokio::time::interval;

use super::{
    RamLake, RamLakeConfig, RamLakeMetrics,
    PersistentStore, PersistentConfig, PersistentMetrics, EntryType,
};

/// Hybrid memory system combining RAM-Lake and persistent storage
/// Provides hot/cold tiering and automatic synchronization
pub struct HybridMemory {
    /// RAM-Lake for hot data
    ramlake: Arc<RamLake>,
    
    /// Persistent store for cold data
    persistent: Arc<PersistentStore>,
    
    /// Configuration
    config: HybridConfig,
    
    /// Metrics
    metrics: Arc<RwLock<HybridMetrics>>,
}

#[derive(Debug, Clone)]
pub struct HybridConfig {
    /// RAM-Lake configuration
    pub ramlake_config: RamLakeConfig,
    
    /// Persistent store configuration
    pub persistent_config: PersistentConfig,
    
    /// Hot data retention period in seconds
    pub hot_retention_secs: u64,
    
    /// Sync interval in seconds
    pub sync_interval_secs: u64,
    
    /// Maximum entries to keep in RAM
    pub max_ram_entries: usize,
}

#[derive(Debug, Clone)]
pub struct HybridMetrics {
    /// Total entries in system
    pub total_entries: u64,
    
    /// Entries in RAM-Lake
    pub ram_entries: u64,
    
    /// Entries in persistent storage
    pub persistent_entries: u64,
    
    /// Cache hit rate
    pub cache_hit_rate: f64,
    
    /// Last sync time
    pub last_sync: Option<chrono::DateTime<chrono::Local>>,
}

impl HybridMemory {
    /// Create a new hybrid memory system
    pub async fn new(
        ramdisk_path: PathBuf,
        persistent_path: PathBuf,
        config: HybridConfig,
    ) -> Result<Self, String> {
        // Create RAM-Lake
        let ramlake = Arc::new(RamLake::new(ramdisk_path, config.ramlake_config.clone())?);
        ramlake.start()?;
        
        // Create persistent store
        let persistent = Arc::new(PersistentStore::new(persistent_path, config.persistent_config.clone())?);
        
        // Initialize metrics
        let metrics = Arc::new(RwLock::new(HybridMetrics {
            total_entries: 0,
            ram_entries: 0,
            persistent_entries: 0,
            cache_hit_rate: 0.0,
            last_sync: None,
        }));
        
        let hybrid = Self {
            ramlake,
            persistent,
            config,
            metrics,
        };
        
        // Start background tasks
        hybrid.start_background_tasks().await;
        
        Ok(hybrid)
    }
    
    /// Start background synchronization tasks
    async fn start_background_tasks(&self) {
        let ramlake = self.ramlake.clone();
        let persistent = self.persistent.clone();
        let metrics = self.metrics.clone();
        let sync_interval_secs = self.config.sync_interval_secs;
        
        // Sync task
        task::spawn(async move {
            let mut interval = interval(Duration::from_secs(sync_interval_secs));
            
            loop {
                interval.tick().await;
                
                // Perform sync
                if let Err(e) = Self::sync_to_persistent(&ramlake, &persistent).await {
                    eprintln!("Failed to sync to persistent storage: {}", e);
                }
                
                // Update metrics
                let mut m = metrics.write();
                m.last_sync = Some(chrono::Local::now());
            }
        });
        
        // Metrics collection task
        let ramlake = self.ramlake.clone();
        let persistent = self.persistent.clone();
        let metrics = self.metrics.clone();
        
        task::spawn(async move {
            let mut interval = interval(Duration::from_secs(1));
            
            loop {
                interval.tick().await;
                
                // Update metrics
                let ram_metrics = ramlake.get_metrics();
                let persistent_metrics = persistent.get_metrics();
                
                let mut m = metrics.write();
                m.ram_entries = ram_metrics.vector_entries as u64 
                    + ram_metrics.indexed_files as u64 
                    + ram_metrics.history_events as u64;
                m.persistent_entries = persistent_metrics.entry_count;
                m.total_entries = m.ram_entries + m.persistent_entries;
            }
        });
    }
    
    /// Store code with automatic tiering
    pub async fn store_code(
        &self,
        path: &str,
        content: &str,
        language: &str,
    ) -> Result<Uuid, String> {
        // Store in RAM-Lake first (hot data)
        let id = self.ramlake.store_code(path, content, language)?;
        
        // Also store in persistent for durability
        let entry = EntryType::Code {
            path: path.to_string(),
            content: content.to_string(),
            language: language.to_string(),
            timestamp: chrono::Local::now(),
        };
        
        self.persistent.store(id, entry)?;
        
        Ok(id)
    }
    
    /// Store and index code with embeddings
    pub async fn store_and_index_code(
        &self,
        path: &str,
        content: &str,
        language: &str,
        embeddings: Vec<f32>,
    ) -> Result<Uuid, String> {
        // Store code
        let id = self.store_code(path, content, language).await?;
        
        // Index in RAM-Lake
        self.ramlake.index_code(id, embeddings.clone())?;
        
        // Store embedding in persistent
        let entry = EntryType::Embedding {
            vector: embeddings,
            metadata: format!("code:{}", path),
            timestamp: chrono::Local::now(),
        };
        
        self.persistent.store(Uuid::new_v4(), entry)?;
        
        Ok(id)
    }
    
    /// Store event
    pub async fn store_event(&self, event_type: &str, content: &str) -> Result<Uuid, String> {
        // Store in RAM-Lake
        let id = self.ramlake.store_event(event_type, content)?;
        
        // Store in persistent
        let entry = EntryType::Event {
            event_type: event_type.to_string(),
            content: content.to_string(),
            timestamp: chrono::Local::now(),
        };
        
        self.persistent.store(id, entry)?;
        
        Ok(id)
    }
    
    /// Get code with fallback to persistent storage
    pub async fn get_code(&self, id: Uuid) -> Result<Option<(String, String, String)>, String> {
        // Try RAM-Lake first (hot data)
        match self.ramlake.get_code(id) {
            Ok(result) => {
                // Update cache hit rate
                self.update_cache_hit(true);
                Ok(Some(result))
            }
            Err(_) => {
                // Fall back to persistent storage
                self.update_cache_hit(false);
                
                match self.persistent.get(id)? {
                    Some(EntryType::Code { path, content, language, .. }) => {
                        // Promote to RAM-Lake for future access
                        let _ = self.ramlake.store_code(&path, &content, &language);
                        
                        Ok(Some((path, content, language)))
                    }
                    _ => Ok(None),
                }
            }
        }
    }
    
    /// Search for similar code
    pub async fn search_similar(
        &self,
        embedding: Vec<f32>,
        limit: usize,
    ) -> Result<Vec<(Uuid, f32)>, String> {
        // Search in RAM-Lake first
        let mut results = self.ramlake.search_similar(embedding.clone(), limit)?;
        
        // If not enough results, search persistent storage
        if results.len() < limit {
            // This would require implementing vector search in persistent storage
            // For now, we'll just return RAM-Lake results
        }
        
        Ok(results)
    }
    
    /// Store session context
    pub async fn store_context(&self, session_id: Uuid, context: Vec<String>) -> Result<(), String> {
        // Store in persistent storage for durability
        self.persistent.store_context(session_id, context)
    }
    
    /// Get session context
    pub async fn get_context(&self, session_id: Uuid) -> Result<Option<Vec<String>>, String> {
        self.persistent.get_context(session_id)
    }
    
    /// Sync RAM-Lake to persistent storage
    async fn sync_to_persistent(
        ramlake: &Arc<RamLake>,
        persistent: &Arc<PersistentStore>,
    ) -> Result<(), String> {
        // This is a simplified sync - in production, you'd track what needs syncing
        // For now, we'll just ensure persistent storage is up to date
        
        // Compact persistent storage periodically
        persistent.compact()?;
        
        Ok(())
    }
    
    /// Update cache hit rate
    fn update_cache_hit(&self, hit: bool) {
        let mut metrics = self.metrics.write();
        
        // Simple moving average for hit rate
        let alpha = 0.1; // Smoothing factor
        let hit_value = if hit { 1.0 } else { 0.0 };
        
        metrics.cache_hit_rate = alpha * hit_value + (1.0 - alpha) * metrics.cache_hit_rate;
    }
    
    /// Get hybrid memory metrics
    pub fn get_metrics(&self) -> HybridMetrics {
        self.metrics.read().clone()
    }
    
    /// Restore data from persistent storage to RAM-Lake
    pub async fn restore_hot_data(&self, limit: Option<usize>) -> Result<u64, String> {
        let entries = self.persistent.restore_to_ramlake(limit)?;
        let mut count = 0;
        
        for (id, entry) in entries {
            match entry {
                EntryType::Code { path, content, language, .. } => {
                    self.ramlake.store_code(&path, &content, &language)?;
                    count += 1;
                }
                EntryType::Event { event_type, content, .. } => {
                    self.ramlake.store_event(&event_type, &content)?;
                    count += 1;
                }
                _ => {} // Handle other types as needed
            }
        }
        
        Ok(count)
    }
    
    /// Evict cold data from RAM-Lake
    pub async fn evict_cold_data(&self) -> Result<u64, String> {
        // This would implement LRU or time-based eviction
        // For now, just return 0
        Ok(0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempdir::TempDir;
    
    #[tokio::test]
    async fn test_hybrid_memory() {
        let ramdisk_dir = TempDir::new("postdevai_ramdisk").unwrap();
        let persistent_dir = TempDir::new("postdevai_persistent").unwrap();
        
        let config = HybridConfig {
            ramlake_config: RamLakeConfig {
                max_size: 100 * 1024 * 1024, // 100MB
                backup_interval: 3600,
                backup_path: ramdisk_dir.path().join("backup"),
                allocation: super::super::StoreAllocation {
                    vector_store: 0.3,
                    code_store: 0.4,
                    history_store: 0.2,
                    metadata_store: 0.1,
                },
            },
            persistent_config: PersistentConfig {
                max_size: 1024 * 1024 * 1024, // 1GB
                compression: "snappy".to_string(),
                cache_size_mb: 64,
                write_buffer_size_mb: 16,
                enable_wal: true,
            },
            hot_retention_secs: 3600,
            sync_interval_secs: 60,
            max_ram_entries: 10000,
        };
        
        let hybrid = HybridMemory::new(
            ramdisk_dir.path().to_path_buf(),
            persistent_dir.path().to_path_buf(),
            config,
        ).await.unwrap();
        
        // Test storing and retrieving code
        let id = hybrid.store_code("test.rs", "fn main() {}", "rust").await.unwrap();
        
        let code = hybrid.get_code(id).await.unwrap();
        assert!(code.is_some());
        
        let (path, content, language) = code.unwrap();
        assert_eq!(path, "test.rs");
        assert_eq!(content, "fn main() {}");
        assert_eq!(language, "rust");
    }
}
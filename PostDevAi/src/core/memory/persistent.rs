use std::path::{Path, PathBuf};
use std::sync::Arc;
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use chrono::{DateTime, Local};
use rocksdb::{DB, Options, IteratorMode};
use bincode;
use parking_lot::RwLock;

/// Persistent storage layer for PostDevAI
/// Uses RocksDB for fast key-value storage with durability
pub struct PersistentStore {
    /// RocksDB instance for persistent storage
    db: Arc<DB>,
    
    /// Base path for persistent storage
    base_path: PathBuf,
    
    /// Configuration
    config: PersistentConfig,
    
    /// Metrics
    metrics: Arc<RwLock<PersistentMetrics>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersistentConfig {
    /// Maximum size of persistent storage in bytes
    pub max_size: u64,
    
    /// Compression type (none, snappy, zstd)
    pub compression: String,
    
    /// Cache size in MB
    pub cache_size_mb: u64,
    
    /// Write buffer size in MB
    pub write_buffer_size_mb: u64,
    
    /// Enable write-ahead log
    pub enable_wal: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersistentMetrics {
    /// Total storage size
    pub total_size: u64,
    
    /// Number of entries
    pub entry_count: u64,
    
    /// Last compaction time
    pub last_compaction: Option<DateTime<Local>>,
    
    /// Write operations per second
    pub writes_per_sec: f64,
    
    /// Read operations per second
    pub reads_per_sec: f64,
}

/// Entry types for the persistent store
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EntryType {
    Code {
        path: String,
        content: String,
        language: String,
        timestamp: DateTime<Local>,
    },
    Event {
        event_type: String,
        content: String,
        timestamp: DateTime<Local>,
    },
    Embedding {
        vector: Vec<f32>,
        metadata: String,
        timestamp: DateTime<Local>,
    },
    Metadata {
        source_id: Uuid,
        relation: String,
        target_id: Uuid,
        timestamp: DateTime<Local>,
    },
    Context {
        session_id: Uuid,
        context: Vec<String>,
        timestamp: DateTime<Local>,
    },
}

impl PersistentStore {
    /// Create a new persistent store
    pub fn new(base_path: PathBuf, config: PersistentConfig) -> Result<Self, String> {
        // Create base directory if it doesn't exist
        std::fs::create_dir_all(&base_path)
            .map_err(|e| format!("Failed to create persistent store directory: {}", e))?;
        
        // Configure RocksDB
        let mut opts = Options::default();
        opts.create_if_missing(true);
        
        // Set compression
        match config.compression.as_str() {
            "snappy" => opts.set_compression_type(rocksdb::DBCompressionType::Snappy),
            "zstd" => opts.set_compression_type(rocksdb::DBCompressionType::Zstd),
            _ => opts.set_compression_type(rocksdb::DBCompressionType::None),
        }
        
        // Set cache size
        let cache = rocksdb::Cache::new_lru_cache(config.cache_size_mb * 1024 * 1024)
            .map_err(|e| format!("Failed to create cache: {}", e))?;
        opts.set_row_cache(&cache);
        
        // Set write buffer size
        opts.set_write_buffer_size((config.write_buffer_size_mb * 1024 * 1024) as usize);
        
        // Enable write-ahead log
        if !config.enable_wal {
            opts.set_manual_wal_flush(true);
        }
        
        // Open database
        let db_path = base_path.join("postdevai.db");
        let db = DB::open(&opts, db_path)
            .map_err(|e| format!("Failed to open RocksDB: {}", e))?;
        
        let metrics = Arc::new(RwLock::new(PersistentMetrics {
            total_size: 0,
            entry_count: 0,
            last_compaction: None,
            writes_per_sec: 0.0,
            reads_per_sec: 0.0,
        }));
        
        Ok(Self {
            db: Arc::new(db),
            base_path,
            config,
            metrics,
        })
    }
    
    /// Store an entry in persistent storage
    pub fn store(&self, id: Uuid, entry: EntryType) -> Result<(), String> {
        // Serialize entry
        let data = bincode::serialize(&entry)
            .map_err(|e| format!("Failed to serialize entry: {}", e))?;
        
        // Create key
        let key = format!("entry:{}", id);
        
        // Store in RocksDB
        self.db.put(key.as_bytes(), &data)
            .map_err(|e| format!("Failed to store entry: {}", e))?;
        
        // Update metrics
        let mut metrics = self.metrics.write();
        metrics.entry_count += 1;
        
        Ok(())
    }
    
    /// Retrieve an entry from persistent storage
    pub fn get(&self, id: Uuid) -> Result<Option<EntryType>, String> {
        // Create key
        let key = format!("entry:{}", id);
        
        // Get from RocksDB
        match self.db.get(key.as_bytes()) {
            Ok(Some(data)) => {
                let entry = bincode::deserialize(&data)
                    .map_err(|e| format!("Failed to deserialize entry: {}", e))?;
                Ok(Some(entry))
            }
            Ok(None) => Ok(None),
            Err(e) => Err(format!("Failed to get entry: {}", e)),
        }
    }
    
    /// Delete an entry from persistent storage
    pub fn delete(&self, id: Uuid) -> Result<(), String> {
        // Create key
        let key = format!("entry:{}", id);
        
        // Delete from RocksDB
        self.db.delete(key.as_bytes())
            .map_err(|e| format!("Failed to delete entry: {}", e))?;
        
        // Update metrics
        let mut metrics = self.metrics.write();
        if metrics.entry_count > 0 {
            metrics.entry_count -= 1;
        }
        
        Ok(())
    }
    
    /// Store a session context
    pub fn store_context(&self, session_id: Uuid, context: Vec<String>) -> Result<(), String> {
        let entry = EntryType::Context {
            session_id,
            context,
            timestamp: Local::now(),
        };
        
        self.store(session_id, entry)
    }
    
    /// Get session context
    pub fn get_context(&self, session_id: Uuid) -> Result<Option<Vec<String>>, String> {
        match self.get(session_id)? {
            Some(EntryType::Context { context, .. }) => Ok(Some(context)),
            _ => Ok(None),
        }
    }
    
    /// Backup RAM-Lake to persistent storage
    pub fn backup_from_ramlake(&self, entries: Vec<(Uuid, EntryType)>) -> Result<u64, String> {
        let mut count = 0;
        
        for (id, entry) in entries {
            self.store(id, entry)?;
            count += 1;
        }
        
        // Force flush to disk
        self.db.flush()
            .map_err(|e| format!("Failed to flush to disk: {}", e))?;
        
        Ok(count)
    }
    
    /// Restore entries to RAM-Lake
    pub fn restore_to_ramlake(&self, limit: Option<usize>) -> Result<Vec<(Uuid, EntryType)>, String> {
        let mut entries = Vec::new();
        let iter = self.db.iterator(IteratorMode::Start);
        
        for (key, value) in iter {
            // Parse key
            let key_str = String::from_utf8_lossy(&key);
            if !key_str.starts_with("entry:") {
                continue;
            }
            
            // Extract UUID
            let id_str = &key_str[6..];
            let id = Uuid::parse_str(id_str)
                .map_err(|e| format!("Failed to parse UUID: {}", e))?;
            
            // Deserialize entry
            let entry: EntryType = bincode::deserialize(&value)
                .map_err(|e| format!("Failed to deserialize entry: {}", e))?;
            
            entries.push((id, entry));
            
            // Check limit
            if let Some(limit) = limit {
                if entries.len() >= limit {
                    break;
                }
            }
        }
        
        Ok(entries)
    }
    
    /// Compact the database
    pub fn compact(&self) -> Result<(), String> {
        self.db.compact_range(None::<&[u8]>, None::<&[u8]>);
        
        // Update metrics
        let mut metrics = self.metrics.write();
        metrics.last_compaction = Some(Local::now());
        
        Ok(())
    }
    
    /// Get storage metrics
    pub fn get_metrics(&self) -> PersistentMetrics {
        self.metrics.read().clone()
    }
    
    /// Search entries by type
    pub fn search_by_type(&self, entry_type: &str, limit: Option<usize>) -> Result<Vec<(Uuid, EntryType)>, String> {
        let mut results = Vec::new();
        let iter = self.db.iterator(IteratorMode::Start);
        
        for (key, value) in iter {
            // Parse key
            let key_str = String::from_utf8_lossy(&key);
            if !key_str.starts_with("entry:") {
                continue;
            }
            
            // Deserialize entry
            let entry: EntryType = match bincode::deserialize(&value) {
                Ok(e) => e,
                Err(_) => continue,
            };
            
            // Check type
            let matches = match (&entry, entry_type) {
                (EntryType::Code { .. }, "code") => true,
                (EntryType::Event { .. }, "event") => true,
                (EntryType::Embedding { .. }, "embedding") => true,
                (EntryType::Metadata { .. }, "metadata") => true,
                (EntryType::Context { .. }, "context") => true,
                _ => false,
            };
            
            if matches {
                // Extract UUID
                let id_str = &key_str[6..];
                if let Ok(id) = Uuid::parse_str(id_str) {
                    results.push((id, entry));
                    
                    // Check limit
                    if let Some(limit) = limit {
                        if results.len() >= limit {
                            break;
                        }
                    }
                }
            }
        }
        
        Ok(results)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempdir::TempDir;
    
    #[test]
    fn test_persistent_store() {
        let temp_dir = TempDir::new("postdevai_test").unwrap();
        let config = PersistentConfig {
            max_size: 1024 * 1024 * 1024, // 1GB
            compression: "snappy".to_string(),
            cache_size_mb: 64,
            write_buffer_size_mb: 16,
            enable_wal: true,
        };
        
        let store = PersistentStore::new(temp_dir.path().to_path_buf(), config).unwrap();
        
        // Test storing and retrieving
        let id = Uuid::new_v4();
        let entry = EntryType::Code {
            path: "/test/file.rs".to_string(),
            content: "fn main() {}".to_string(),
            language: "rust".to_string(),
            timestamp: Local::now(),
        };
        
        store.store(id, entry.clone()).unwrap();
        
        let retrieved = store.get(id).unwrap();
        assert!(retrieved.is_some());
        
        // Test deletion
        store.delete(id).unwrap();
        let deleted = store.get(id).unwrap();
        assert!(deleted.is_none());
    }
}
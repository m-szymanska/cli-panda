// Export RAM-Lake implementation
pub mod ramlake;

// Export persistent storage
pub mod persistent;

// Export hybrid memory system
pub mod hybrid_memory;

// Re-export main types
pub use ramlake::{
    RamLake,
    RamLakeConfig,
    StoreAllocation,
    RamLakeMetrics,
};

pub use persistent::{
    PersistentStore,
    PersistentConfig,
    PersistentMetrics,
    EntryType,
};

pub use hybrid_memory::{
    HybridMemory,
    HybridConfig,
    HybridMetrics,
};
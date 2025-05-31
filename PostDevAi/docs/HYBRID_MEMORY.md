# PostDevAI Hybrid Memory Architecture 🐉

## Overview

PostDevAI's Hybrid Memory system combines the speed of RAM-Lake with the durability of persistent storage, creating a seamless hot/cold data tiering system designed for the Dragon Node's massive 512GB unified memory.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Dragon Node (M3 Ultra)                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐         ┌─────────────────┐      │
│  │   RAM-Lake      │ <-----> │ Persistent Store│      │
│  │   (200GB)       │  Sync   │   (1TB SSD)    │      │
│  ├─────────────────┤         ├─────────────────┤      │
│  │ • Vectors (30%) │         │ • RocksDB      │      │
│  │ • Code (40%)    │         │ • ZSTD Compress│      │
│  │ • History (20%) │         │ • WAL Enabled  │      │
│  │ • Metadata(10%) │         │ • 2GB Cache    │      │
│  └─────────────────┘         └─────────────────┘      │
│           ↑                           ↑                 │
│           └───────────┬───────────────┘                │
│                       │                                 │
│              ┌────────┴────────┐                      │
│              │ Hybrid Memory   │                      │
│              │   Controller    │                      │
│              └─────────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

## Components

### 1. RAM-Lake (Hot Storage)
- **Purpose**: Ultra-fast access to frequently used data
- **Size**: 200GB (configurable)
- **Technology**: Memory-mapped files on RAM disk
- **Features**:
  - Sub-millisecond access times
  - Vector search with SIMD optimization
  - LRU eviction policy
  - Real-time indexing

### 2. Persistent Storage (Cold Storage)
- **Purpose**: Durable storage for all data
- **Size**: 1TB+ (configurable)
- **Technology**: RocksDB with ZSTD compression
- **Features**:
  - 2.8x compression ratio
  - Write-ahead logging
  - Point-in-time recovery
  - Async replication

### 3. Hybrid Controller
- **Purpose**: Manages data movement and access patterns
- **Features**:
  - Automatic hot/cold tiering
  - Predictive prefetching
  - Write-through caching
  - Background synchronization

## Data Flow

### Write Path
1. Data arrives at Hybrid Memory API
2. Written to WAL in persistent storage (durability)
3. Stored in RAM-Lake (performance)
4. Indexed for vector search
5. Background sync to persistent storage

### Read Path
1. Check RAM-Lake first (cache hit ~94%)
2. If miss, load from persistent storage
3. Promote to RAM-Lake if frequently accessed
4. Update access statistics

## Configuration

### Dragon Node Config (`dragon_node.toml`)
```toml
[hybrid_memory]
# RAM-Lake settings
ramlake_size_gb = 200
ramlake_path = "/mnt/ramlake"

# Persistent storage settings
persistent_size_tb = 1
persistent_path = "/var/lib/postdevai/persistent"
compression = "zstd"
cache_size_mb = 2048

# Tiering settings
hot_retention_hours = 24
sync_interval_minutes = 5
max_ram_entries = 10_000_000
```

## Usage Example

```rust
use postdevai::core::memory::{HybridMemory, HybridConfig};

// Initialize hybrid memory
let hybrid_memory = HybridMemory::new(
    ramdisk_path,
    persistent_path,
    config
).await?;

// Store code with automatic tiering
let id = hybrid_memory.store_code(
    "src/main.rs",
    code_content,
    "rust"
).await?;

// Index with embeddings
hybrid_memory.store_and_index_code(
    "src/lib.rs",
    code_content,
    "rust",
    embeddings
).await?;

// Search similar code (searches both tiers)
let results = hybrid_memory.search_similar(
    query_embedding,
    limit
).await?;

// Store session context (persisted immediately)
hybrid_memory.store_context(
    session_id,
    context_messages
).await?;
```

## Performance Characteristics

### RAM-Lake Performance
- **Latency**: 0.1-0.5ms
- **Throughput**: 10GB/s+ read, 5GB/s+ write
- **IOPS**: 500K+ random reads
- **Cache Hit Rate**: 94%+

### Persistent Storage Performance
- **Latency**: 1-5ms
- **Throughput**: 500MB/s+ (compressed)
- **IOPS**: 100K+ random reads
- **Compression**: 2.8x average

## Monitoring

The Hybrid Memory system exposes metrics via:

1. **TUI Dashboard**: Real-time visualization
2. **Prometheus Metrics**: For external monitoring
3. **gRPC API**: Programmatic access

Key metrics:
- `ramlake_usage_bytes`: Current RAM usage
- `persistent_usage_bytes`: Disk usage
- `cache_hit_rate`: Percentage of reads from RAM
- `sync_lag_seconds`: Time since last sync
- `compression_ratio`: Current compression efficiency

## Setup Instructions

### 1. Create RAM Disk (macOS)
```bash
sudo ./scripts/setup_hybrid_memory.sh
```

### 2. Initialize Persistent Storage
```bash
# Create directories
sudo mkdir -p /var/lib/postdevai/persistent
sudo mkdir -p /var/backups/postdevai

# Set permissions
sudo chown -R $USER:staff /var/lib/postdevai
```

### 3. Start Dragon Node
```bash
cargo run --release --bin dragon_node
```

## Maintenance

### Backup Strategy
- **Continuous**: WAL replication to backup location
- **Hourly**: RAM-Lake snapshots
- **Daily**: Full persistent storage backup

### Recovery
1. Stop Dragon Node
2. Restore persistent storage from backup
3. Start Dragon Node (auto-rebuilds RAM-Lake)

### Monitoring Health
```bash
# Check RAM-Lake usage
df -h /mnt/ramlake

# Check RocksDB stats
postdevai-cli memory stats

# View logs
tail -f /var/log/postdevai/dragon.log
```

## Best Practices

1. **Memory Allocation**
   - Reserve 20% of RAM for OS and other processes
   - Monitor memory pressure regularly
   - Adjust allocation percentages based on workload

2. **Persistence**
   - Enable WAL for critical data
   - Set appropriate sync intervals
   - Monitor compression ratios

3. **Performance Tuning**
   - Adjust cache sizes based on hit rates
   - Tune eviction policies for your workload
   - Use batch operations when possible

## Troubleshooting

### High Memory Usage
```bash
# Check what's using memory
postdevai-cli memory breakdown

# Force eviction of cold data
postdevai-cli memory evict --cold --older-than 24h
```

### Sync Issues
```bash
# Check sync status
postdevai-cli memory sync-status

# Force sync
postdevai-cli memory sync --force
```

### Performance Degradation
```bash
# Run diagnostics
postdevai-cli diagnose memory

# Compact persistent storage
postdevai-cli memory compact
```

## Future Enhancements

1. **Distributed RAM-Lake**: Span multiple Dragon Nodes
2. **ML-based Prefetching**: Predict data access patterns
3. **Tiered Compression**: Different levels per data type
4. **RDMA Support**: For multi-node setups
5. **GPU Memory Integration**: Use MLX unified memory
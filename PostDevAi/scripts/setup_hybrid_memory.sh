#!/bin/bash
#
# Setup Hybrid Memory for PostDevAI Dragon Node
# Creates RAM disk and persistent storage directories
#

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
RAMDISK_SIZE_GB=200
RAMDISK_PATH="/mnt/ramlake"
PERSISTENT_PATH="/var/lib/postdevai/persistent"
BACKUP_PATH="/var/backups/postdevai"

echo -e "${BLUE}🐉 Setting up PostDevAI Hybrid Memory System${NC}"
echo

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Check OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${GREEN}Detected macOS${NC}"
    OS="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo -e "${GREEN}Detected Linux${NC}"
    OS="linux"
else
    echo -e "${RED}Unsupported OS: $OSTYPE${NC}"
    exit 1
fi

# Create directories
echo -e "${BLUE}Creating directories...${NC}"
mkdir -p "$PERSISTENT_PATH"
mkdir -p "$BACKUP_PATH"
echo -e "${GREEN}✓ Directories created${NC}"

# Setup RAM disk
echo -e "${BLUE}Setting up RAM disk (${RAMDISK_SIZE_GB}GB)...${NC}"

if [ "$OS" == "macos" ]; then
    # macOS RAM disk setup
    RAMDISK_SECTORS=$((RAMDISK_SIZE_GB * 1024 * 1024 * 2)) # 512-byte sectors
    
    # Check if RAM disk already exists
    if mount | grep -q "$RAMDISK_PATH"; then
        echo -e "${YELLOW}RAM disk already mounted at $RAMDISK_PATH${NC}"
    else
        # Create RAM disk
        DISK_ID=$(hdiutil attach -nomount ram://$RAMDISK_SECTORS)
        
        # Format as APFS (faster than HFS+ for our use case)
        diskutil erasevolume APFS "PostDevAI_RAMLake" $DISK_ID
        
        # Create mount point if it doesn't exist
        mkdir -p "$RAMDISK_PATH"
        
        # Mount the RAM disk
        mount -t apfs $DISK_ID "$RAMDISK_PATH"
        
        echo -e "${GREEN}✓ RAM disk created and mounted at $RAMDISK_PATH${NC}"
    fi
elif [ "$OS" == "linux" ]; then
    # Linux RAM disk setup
    if mount | grep -q "$RAMDISK_PATH"; then
        echo -e "${YELLOW}RAM disk already mounted at $RAMDISK_PATH${NC}"
    else
        # Create mount point
        mkdir -p "$RAMDISK_PATH"
        
        # Mount tmpfs
        mount -t tmpfs -o size=${RAMDISK_SIZE_GB}G tmpfs "$RAMDISK_PATH"
        
        echo -e "${GREEN}✓ RAM disk created and mounted at $RAMDISK_PATH${NC}"
    fi
fi

# Set permissions
echo -e "${BLUE}Setting permissions...${NC}"
chmod 755 "$RAMDISK_PATH"
chmod 755 "$PERSISTENT_PATH"
chmod 755 "$BACKUP_PATH"

# Create RAM disk subdirectories
mkdir -p "$RAMDISK_PATH/vectors"
mkdir -p "$RAMDISK_PATH/code"
mkdir -p "$RAMDISK_PATH/history"
mkdir -p "$RAMDISK_PATH/metadata"

echo -e "${GREEN}✓ Permissions set${NC}"

# Display memory info
echo
echo -e "${BLUE}System Memory Information:${NC}"
if [ "$OS" == "macos" ]; then
    # Get total memory in GB
    TOTAL_MEM_KB=$(sysctl -n hw.memsize)
    TOTAL_MEM_GB=$((TOTAL_MEM_KB / 1024 / 1024 / 1024))
    echo "Total RAM: ${TOTAL_MEM_GB}GB"
    
    # Get memory pressure
    vm_stat | grep -E "(free|active|inactive|speculative|wired down)"
elif [ "$OS" == "linux" ]; then
    free -h
fi

echo
echo -e "${GREEN}✅ Hybrid Memory System Setup Complete!${NC}"
echo
echo -e "${BLUE}Summary:${NC}"
echo "  RAM Disk: $RAMDISK_PATH (${RAMDISK_SIZE_GB}GB)"
echo "  Persistent Storage: $PERSISTENT_PATH"
echo "  Backup Location: $BACKUP_PATH"
echo
echo -e "${YELLOW}Note: RAM disk will be cleared on reboot!${NC}"
echo -e "${YELLOW}Make sure PostDevAI is configured to use these paths.${NC}"

# Optional: Add to system startup
echo
echo -e "${BLUE}To make RAM disk persistent across reboots:${NC}"
if [ "$OS" == "macos" ]; then
    echo "1. Create a LaunchDaemon plist in /Library/LaunchDaemons/"
    echo "2. Or add this script to your startup items"
elif [ "$OS" == "linux" ]; then
    echo "1. Add to /etc/fstab:"
    echo "   tmpfs $RAMDISK_PATH tmpfs size=${RAMDISK_SIZE_GB}G,mode=755 0 0"
    echo "2. Or create a systemd service"
fi
use ratatui::Frame;
use ratatui::layout::{Layout, Direction, Constraint, Rect, Alignment};
use ratatui::widgets::{Block, Borders, Paragraph, Wrap, Gauge, List, ListItem, Sparkline};
use ratatui::style::{Style, Color, Modifier};
use ratatui::text::{Text, Span, Line};

use crate::tui::state::app_state::AppState;

const GB: u64 = 1024 * 1024 * 1024;
const MB: u64 = 1024 * 1024;

/// Render the Hybrid Memory view (RAM-Lake + Persistent Storage)
pub fn render_hybrid_memory<B: ratatui::backend::Backend>(frame: &mut Frame<B>, state: &AppState) {
    // Create main layout
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .margin(1)
        .constraints([
            Constraint::Length(3),   // Header
            Constraint::Percentage(50), // RAM-Lake section
            Constraint::Percentage(50), // Persistent Storage section
        ].as_ref())
        .split(frame.size());
    
    // Render header
    render_header(frame, chunks[0]);
    
    // Render RAM-Lake section
    render_ramlake_section(frame, state, chunks[1]);
    
    // Render Persistent Storage section
    render_persistent_section(frame, state, chunks[2]);
}

fn render_header<B: ratatui::backend::Backend>(frame: &mut Frame<B>, area: Rect) {
    let header = Paragraph::new(vec![
        Line::from(vec![
            Span::styled("🐉 ", Style::default().fg(Color::Yellow)),
            Span::styled("PostDevAI Hybrid Memory System", Style::default().fg(Color::Blue).add_modifier(Modifier::BOLD)),
            Span::styled(" - ", Style::default().fg(Color::Gray)),
            Span::styled("RAM-Lake + Persistent Storage", Style::default().fg(Color::Cyan)),
        ]),
    ])
    .block(Block::default().borders(Borders::ALL))
    .alignment(Alignment::Center);
    
    frame.render_widget(header, area);
}

fn render_ramlake_section<B: ratatui::backend::Backend>(frame: &mut Frame<B>, state: &AppState, area: Rect) {
    let block = Block::default()
        .title(" 🏎️  RAM-Lake (Hot Storage) ")
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::Green));
    
    let inner = block.inner(area);
    frame.render_widget(block, area);
    
    // Split into metrics and details
    let chunks = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([
            Constraint::Percentage(60), // Metrics
            Constraint::Percentage(40), // Details
        ].as_ref())
        .split(inner);
    
    // Render metrics
    render_ramlake_metrics(frame, state, chunks[0]);
    
    // Render details
    render_ramlake_details(frame, state, chunks[1]);
}

fn render_ramlake_metrics<B: ratatui::backend::Backend>(frame: &mut Frame<B>, state: &AppState, area: Rect) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .margin(1)
        .constraints([
            Constraint::Length(3), // Total usage gauge
            Constraint::Length(3), // Vector store
            Constraint::Length(3), // Code store
            Constraint::Length(3), // History store
            Constraint::Length(3), // Metadata store
            Constraint::Min(0),    // Cache hit rate
        ].as_ref())
        .split(area);
    
    // Mock data - in real implementation, get from state.hybrid_memory_metrics
    let total_size = 200 * GB;
    let used_size = 85 * GB;
    let usage_percent = ((used_size as f64 / total_size as f64) * 100.0) as u16;
    
    // Total usage gauge
    let gauge = Gauge::default()
        .block(Block::default().title("Total RAM Usage").borders(Borders::ALL))
        .gauge_style(Style::default().fg(Color::Green).bg(Color::Black))
        .percent(usage_percent)
        .label(format!("{:.1}GB / {:.0}GB", used_size as f64 / GB as f64, total_size as f64 / GB as f64));
    frame.render_widget(gauge, chunks[0]);
    
    // Store-specific gauges
    let stores = [
        ("Vectors", 30 * GB, 60 * GB, Color::Cyan),
        ("Code", 35 * GB, 80 * GB, Color::Yellow),
        ("History", 15 * GB, 40 * GB, Color::Magenta),
        ("Metadata", 5 * GB, 20 * GB, Color::Blue),
    ];
    
    for (i, (name, used, total, color)) in stores.iter().enumerate() {
        let percent = ((*used as f64 / *total as f64) * 100.0) as u16;
        let gauge = Gauge::default()
            .block(Block::default().title(*name).borders(Borders::LEFT | Borders::RIGHT))
            .gauge_style(Style::default().fg(*color))
            .percent(percent)
            .label(format!("{:.1}GB", *used as f64 / GB as f64));
        frame.render_widget(gauge, chunks[i + 1]);
    }
    
    // Cache hit rate sparkline
    if chunks.len() > 5 {
        let hit_rates: Vec<u64> = vec![85, 88, 90, 87, 92, 94, 91, 93, 95, 92, 94, 96];
        let sparkline = Sparkline::default()
            .block(Block::default().title("Cache Hit Rate (%)").borders(Borders::ALL))
            .data(&hit_rates)
            .style(Style::default().fg(Color::Green));
        frame.render_widget(sparkline, chunks[5]);
    }
}

fn render_ramlake_details<B: ratatui::backend::Backend>(frame: &mut Frame<B>, state: &AppState, area: Rect) {
    let details = vec![
        ListItem::new(Line::from(vec![
            Span::styled("Entries: ", Style::default().fg(Color::Gray)),
            Span::styled("1,245,678", Style::default().fg(Color::Green).add_modifier(Modifier::BOLD)),
        ])),
        ListItem::new(Line::from(vec![
            Span::styled("Files: ", Style::default().fg(Color::Gray)),
            Span::styled("45,234", Style::default().fg(Color::Yellow)),
        ])),
        ListItem::new(Line::from(vec![
            Span::styled("Events: ", Style::default().fg(Color::Gray)),
            Span::styled("892,345", Style::default().fg(Color::Magenta)),
        ])),
        ListItem::new(Line::from(vec![
            Span::styled("Relations: ", Style::default().fg(Color::Gray)),
            Span::styled("308,099", Style::default().fg(Color::Blue)),
        ])),
        ListItem::new("─────────────────"),
        ListItem::new(Line::from(vec![
            Span::styled("Hit Rate: ", Style::default().fg(Color::Gray)),
            Span::styled("94.3%", Style::default().fg(Color::Green).add_modifier(Modifier::BOLD)),
        ])),
        ListItem::new(Line::from(vec![
            Span::styled("Avg Latency: ", Style::default().fg(Color::Gray)),
            Span::styled("0.2ms", Style::default().fg(Color::Cyan)),
        ])),
        ListItem::new(Line::from(vec![
            Span::styled("Ops/sec: ", Style::default().fg(Color::Gray)),
            Span::styled("125,430", Style::default().fg(Color::Yellow)),
        ])),
    ];
    
    let list = List::new(details)
        .block(Block::default().title("Statistics").borders(Borders::ALL))
        .style(Style::default().fg(Color::White));
    
    frame.render_widget(list, area);
}

fn render_persistent_section<B: ratatui::backend::Backend>(frame: &mut Frame<B>, state: &AppState, area: Rect) {
    let block = Block::default()
        .title(" 💾 Persistent Storage (Cold Storage) ")
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::Blue));
    
    let inner = block.inner(area);
    frame.render_widget(block, area);
    
    // Split into metrics and operations
    let chunks = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([
            Constraint::Percentage(60), // Metrics
            Constraint::Percentage(40), // Operations
        ].as_ref())
        .split(inner);
    
    // Render metrics
    render_persistent_metrics(frame, state, chunks[0]);
    
    // Render operations
    render_persistent_operations(frame, state, chunks[1]);
}

fn render_persistent_metrics<B: ratatui::backend::Backend>(frame: &mut Frame<B>, state: &AppState, area: Rect) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .margin(1)
        .constraints([
            Constraint::Length(3), // Total usage
            Constraint::Length(3), // Compression ratio
            Constraint::Min(0),    // Write throughput
        ].as_ref())
        .split(area);
    
    // Total disk usage
    let total_size = 1024 * GB; // 1TB
    let used_size = 342 * GB;
    let usage_percent = ((used_size as f64 / total_size as f64) * 100.0) as u16;
    
    let gauge = Gauge::default()
        .block(Block::default().title("Disk Usage").borders(Borders::ALL))
        .gauge_style(Style::default().fg(Color::Blue).bg(Color::Black))
        .percent(usage_percent)
        .label(format!("{:.1}GB / {:.0}TB", used_size as f64 / GB as f64, total_size as f64 / GB as f64 / 1024.0));
    frame.render_widget(gauge, chunks[0]);
    
    // Compression ratio
    let compression_ratio = 2.8;
    let saved_space = (used_size as f64 * (compression_ratio - 1.0)) / GB as f64;
    
    let compression = Paragraph::new(vec![
        Line::from(vec![
            Span::raw("Compression: "),
            Span::styled(format!("{:.1}x", compression_ratio), Style::default().fg(Color::Green).add_modifier(Modifier::BOLD)),
            Span::raw(format!(" (saved {:.1}GB)", saved_space)),
        ]),
    ])
    .block(Block::default().title("Compression").borders(Borders::LEFT | Borders::RIGHT));
    frame.render_widget(compression, chunks[1]);
    
    // Write throughput sparkline
    if chunks.len() > 2 {
        let throughput: Vec<u64> = vec![120, 135, 128, 142, 138, 145, 150, 148, 155, 160, 158, 165];
        let sparkline = Sparkline::default()
            .block(Block::default().title("Write Throughput (MB/s)").borders(Borders::ALL))
            .data(&throughput)
            .style(Style::default().fg(Color::Blue));
        frame.render_widget(sparkline, chunks[2]);
    }
}

fn render_persistent_operations<B: ratatui::backend::Backend>(frame: &mut Frame<B>, state: &AppState, area: Rect) {
    let operations = vec![
        ListItem::new(Line::from(vec![
            Span::styled("Total Entries: ", Style::default().fg(Color::Gray)),
            Span::styled("12,456,789", Style::default().fg(Color::Blue).add_modifier(Modifier::BOLD)),
        ])),
        ListItem::new("─────────────────"),
        ListItem::new(Line::from(vec![
            Span::styled("Last Sync: ", Style::default().fg(Color::Gray)),
            Span::styled("2 min ago", Style::default().fg(Color::Green)),
        ])),
        ListItem::new(Line::from(vec![
            Span::styled("Last Backup: ", Style::default().fg(Color::Gray)),
            Span::styled("45 min ago", Style::default().fg(Color::Yellow)),
        ])),
        ListItem::new(Line::from(vec![
            Span::styled("Compaction: ", Style::default().fg(Color::Gray)),
            Span::styled("3 hours ago", Style::default().fg(Color::Cyan)),
        ])),
        ListItem::new("─────────────────"),
        ListItem::new(Line::from(vec![
            Span::styled("Write Ops: ", Style::default().fg(Color::Gray)),
            Span::styled("1,234/s", Style::default().fg(Color::Green)),
        ])),
        ListItem::new(Line::from(vec![
            Span::styled("Read Ops: ", Style::default().fg(Color::Gray)),
            Span::styled("456/s", Style::default().fg(Color::Blue)),
        ])),
        ListItem::new(Line::from(vec![
            Span::styled("Sync Queue: ", Style::default().fg(Color::Gray)),
            Span::styled("234 items", Style::default().fg(Color::Yellow)),
        ])),
    ];
    
    let list = List::new(operations)
        .block(Block::default().title("Operations").borders(Borders::ALL))
        .style(Style::default().fg(Color::White));
    
    frame.render_widget(list, area);
}
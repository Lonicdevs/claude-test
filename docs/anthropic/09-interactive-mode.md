# Claude Code Interactive Mode

## Keyboard Shortcuts

### General Navigation
```bash
Ctrl+C          # Cancel current input
Ctrl+D          # Exit session
Ctrl+L          # Clear screen
Up/Down arrows  # Navigate command history
```

## Multiline Input Methods

### Standard Methods
```bash
\               # Quick escape (backslash + Enter)
Option+Enter    # macOS default for multiline
Shift+Enter     # Terminal setup option
```

### Configuration
Different terminals may require different multiline input configurations.

## Vim Mode Support

### Navigation Commands
```bash
h/j/k/l         # Movement (left/down/up/right)
```

### Mode Switching
- **INSERT mode**: Normal text input
- **NORMAL mode**: Vim-style navigation and editing

### Editing Commands
```bash
dd              # Delete current line
```

### Full Vim Feature Set
Interactive mode supports comprehensive Vim editing capabilities for users familiar with Vim workflows.

## Command History

### History Navigation
- **Up arrow**: Previous commands
- **Down arrow**: Next commands  
- **Searchable**: Find previous commands quickly

### Session Persistence
Command history persists across sessions for improved productivity.

## Session Features

### Context Maintenance
- Conversation history maintained throughout session
- Context preserved for follow-up questions
- Ability to reference previous interactions

### Session Management
- **Start new sessions** with `claude`
- **Continue sessions** with `claude -c` or `--continue`
- **Clear sessions** with `/clear` slash command

## Input Modes

### Single-line Input
- Default mode for quick commands and queries
- Press Enter to submit

### Multi-line Input  
- Use escape sequences for complex input
- Useful for code blocks and detailed explanations
- Multiple methods available depending on terminal

## Best Practices

### Efficient Navigation
- Use command history for repeated commands
- Learn keyboard shortcuts for faster interaction
- Use multiline input for complex requests

### Session Management
- Use `/clear` to start fresh when context gets cluttered
- Use `--continue` to resume important conversations
- Break complex tasks across multiple focused sessions

### Vim Users
- Enable Vim mode for familiar editing experience
- Leverage Vim commands for efficient text manipulation
- Switch between modes as needed for different tasks
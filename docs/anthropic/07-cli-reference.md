# Claude Code CLI Reference

## Core Commands

### Interactive Mode
```bash
claude                    # Start interactive REPL
claude "query"           # Start REPL with initial prompt
claude -c               # Continue most recent conversation
claude --continue       # Load most recent conversation
```

### Non-Interactive Mode
```bash
claude -p "query"       # Query via SDK and exit (print mode)
claude --print "query"  # Same as -p
```

### System Commands
```bash
claude update           # Update to latest version
claude --version       # Show current version
claude --help          # Show help information
```

## Key CLI Flags

### Model Selection
```bash
claude --model MODEL_NAME    # Set model for current session
```

### Output Control
```bash
claude --output-format json  # JSON output for scripting/automation
claude --verbose            # Enable detailed logging
```

### Session Management
```bash
claude --max-turns N        # Limit agentic turns in non-interactive mode
claude --continue          # Continue most recent conversation
```

### Automation Features
- **`--output-format json`** - Particularly useful for scripting and automation
- Allows programmatic parsing of Claude's responses
- Enables integration with other tools and workflows

## Usage Patterns

### Scripting Integration
```bash
# Pipe output to other tools
claude -p "analyze this code" --output-format json | jq '.response'

# Use in shell scripts
RESULT=$(claude -p "check syntax" --output-format json)
```

### Session Continuity
```bash
# Start session, work, exit, then continue later
claude "start working on feature X"
# ... work happens, exit session
claude -c  # Continue where you left off
```

### Quick Queries
```bash
# Quick answers without entering interactive mode
claude -p "what does this error mean: [error message]"
claude -p "how to implement [specific feature]"
```

## Best Practices
- Use **non-interactive mode** (`-p`) for automation and scripting
- Use **JSON output** for programmatic processing
- Use **--continue** to maintain context across sessions
- Use **--verbose** for debugging and understanding Claude's behavior
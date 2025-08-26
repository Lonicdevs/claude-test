# Claude Code Slash Commands

## What are Slash Commands?
Slash commands are **special instructions** that control Claude's behavior during an interactive session.

## Built-in Slash Commands

### Session Management
```bash
/clear          # Clears conversation history
/help           # Provides usage help
/cost           # Shows token usage statistics
```

### Model Control
```bash
/model          # Allows selecting or changing the AI model
```

### Code Review
```bash
/review         # Requests a code review of current changes
```

## Custom Slash Commands

### File Locations
- **Project-level**: `.claude/commands/` directory
- **Personal-level**: `~/.claude/commands/` directory

### Creating Custom Commands
1. Create Markdown file in appropriate directory
2. Add frontmatter configuration
3. Define command behavior with bash commands or instructions

### Command Features
- **Pass arguments** with `$ARGUMENTS` variable
- **Execute bash commands** directly
- **Reference files** and project resources
- **Add frontmatter** for configuration metadata

### Command Structure
```markdown
---
description: "Command description"
tools: ["tool1", "tool2"]
---

Command content here.
Use $ARGUMENTS for passed parameters.
```

## Organization

### Namespaces
Commands can be organized into **namespaces** for better structure:
- `namespace/command-name`
- Helps organize large sets of custom commands
- Provides logical grouping

### Metadata Support
- **Descriptions** for command documentation
- **Tool permissions** for security control
- **Configuration options** for behavior control

## Use Cases

### Project-Specific Workflows
- Custom build commands
- Testing procedures
- Deployment scripts
- Code generation patterns

### Personal Productivity
- Favorite code patterns
- Common debugging steps
- Personal workflow shortcuts
- Reusable templates

### Team Standardization
- Shared coding standards
- Common review procedures
- Standardized workflows
- Team-specific patterns

## Best Practices
- **Clear descriptions** for all custom commands
- **Appropriate tool permissions** for security
- **Logical organization** with namespaces
- **Team coordination** for shared commands
- **Version control** custom commands with project
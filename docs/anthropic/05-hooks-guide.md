# Claude Code Hooks Guide

## What are Hooks?
Hooks are **shell commands** that execute at different points in Claude Code's workflow, providing **deterministic control** over its behaviors.

## Available Hook Events

### PreToolUse
- **When**: Runs before tool calls
- **Use cases**: Validation, preparation, logging

### PostToolUse  
- **When**: Runs after tool calls
- **Use cases**: Cleanup, verification, notifications

### UserpromptSubmit
- **When**: Runs when user submits a prompt
- **Use cases**: Input validation, logging, preprocessing

### Notification
- **When**: Runs when Claude sends notifications
- **Use cases**: Custom alerts, logging, integrations

### SessionStart
- **When**: Runs at session beginning
- **Use cases**: Environment setup, logging, initialization

### SessionEnd
- **When**: Runs at session conclusion
- **Use cases**: Cleanup, reporting, archiving

## Common Use Cases

### Automatic Code Formatting
- Run formatters after code changes
- Ensure consistent code style
- Integrate with project linting tools

### Logging and Monitoring
- Log all executed commands
- Track tool usage patterns
- Monitor system interactions

### Security Controls
- **Block modifications** to sensitive files
- Validate changes against security policies
- Audit all file modifications

### Notifications
- Send alerts on specific events
- Integrate with team communication tools
- Trigger external workflows

### Custom Feedback
- Provide project-specific guidance
- Enforce coding standards
- Give contextual warnings

## Configuration
Hooks are configured through **JSON settings** with precise control over:
- **When** commands execute
- **What** commands run
- **How** they integrate with workflow

## Security Considerations
⚠️ **Critical Security Warning**:
"You must consider the security implication of hooks as you add them, because hooks run automatically during the agent loop with your current environment's credentials."

### Security Best Practices
- **Review all hook commands** carefully
- **Limit permissions** of hook scripts
- **Validate inputs** in hook commands
- **Avoid sensitive operations** in automated hooks
- **Test thoroughly** in safe environments

## Implementation
- Hooks integrate directly into Claude Code's execution flow
- Commands have access to current environment credentials
- Can modify, block, or enhance Claude Code behaviors
- Provide deterministic control over AI actions
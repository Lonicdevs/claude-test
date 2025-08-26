# Claude Code Troubleshooting Guide

## First Step: Health Check
```bash
/doctor  # Check installation health
```

## Installation Issues

### Windows/WSL Problems
- **Common issues**: Node.js and PATH configuration problems
- **Solution**: Use native installer for smoother setup
- **Migration**: Use `claude migrate-installer` for local installation

### General Installation
- Ensure Node.js 18+ is installed
- Check PATH configuration
- Verify permissions for global npm packages

## Authentication Issues

### Login Failures
If authentication fails, try these steps in order:

1. **Logout and retry**:
   ```bash
   /logout
   ```

2. **Restart Claude Code**:
   - Close current session completely
   - Start new session

3. **Clear auth cache**:
   - Remove `~/.config/claude-code/auth.json`
   - Re-authenticate from scratch

## Performance Issues

### Memory and Context Management
- **Use `/compact`** to reduce context size
- **Close and restart** between major tasks
- **Add large directories** to `.gitignore` (build folders, node_modules)

### Resource Usage
- Monitor system resources during long sessions
- Break large tasks into smaller chunks
- Use sub-agents for specialized tasks to manage context

## IDE Integration Issues

### JetBrains IDE Detection on WSL2
Common networking issues:

1. **Configure Windows Firewall**:
   - Allow WSL2 network connections
   - Configure firewall rules for IDE communication

2. **Adjust WSL networking modes**:
   - Check WSL2 networking configuration
   - Verify bridged/NAT settings

3. **Network Settings**:
   - Check firewall blocking IDE detection
   - Verify port accessibility

## Markdown Formatting Issues

### Code Block Problems
- **Missing language tags** in code blocks
- **Solutions**:
  - Use hooks for automatic formatting
  - Manual verification of output
  - Be explicit in formatting requests

### Formatting Best Practices
- Always specify language in code blocks
- Use consistent markdown formatting
- Verify output before committing

## General Debugging

### Information Gathering
- Use `/doctor` for system diagnostics
- Check error logs and messages
- Verify environment configuration

### Common Solutions
1. **Restart Claude Code** - solves many temporary issues
2. **Check permissions** - ensure proper file/directory access  
3. **Verify installation** - confirm all components installed correctly
4. **Update dependencies** - ensure latest versions

### Getting Help
- Check error messages carefully
- Use diagnostic commands
- Document reproduction steps
- Consider environment differences
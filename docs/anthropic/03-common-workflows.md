# Claude Code Common Workflows

## Codebase Understanding
- **Get quick overviews** of project structure
- **Ask about architecture patterns** and design decisions
- **Understand data models** and database schemas
- **Review authentication mechanisms** and security patterns

## Development Workflows

### Bug Fixing
- Share error details and stack traces
- Let Claude diagnose the issue
- Apply suggested fixes efficiently
- Test and verify solutions

### Code Refactoring
- Modernize code using current best practices
- Improve code structure and organization
- Update deprecated patterns and libraries
- Optimize performance bottlenecks

### Testing
- Generate comprehensive test cases
- Create test suites for new features
- Add missing test coverage
- Update tests after refactoring

### Documentation
- Create and update README files
- Generate API documentation
- Document complex algorithms and processes
- Maintain inline code comments

### Pull Requests
- Create well-structured PRs with descriptions
- Generate commit messages
- Review and improve PR content
- Handle merge conflicts

## Advanced Features

### File Referencing
- Use **"@" notation** to reference specific files/directories
- `@src/components/Button.jsx` - reference specific files
- `@tests/` - reference entire directories

### Extended Thinking
- Use for **complex problem-solving**
- Claude works through problems step-by-step
- Provides detailed analysis and reasoning

### Session Management
```bash
claude --continue    # Resume previous conversation
claude --resume      # Resume previous conversation  
```

### Parallel Sessions
- Use **Git worktrees** for multiple Claude Code sessions
- Work on different features simultaneously
- Maintain separate contexts for different tasks

## Specialized Subagents
- **Targeted tasks** with specialized agents
- Focused expertise for specific domains
- More efficient for specialized workflows

## Utility Usage

### Unix-style Utility
- Use Claude for **code verification**
- Pipe input/output with other tools
- Integrate into shell scripts and automation

### Output Control
- **Text format** for human reading
- **JSON format** for programmatic processing
- Structured data for integration

### Custom Workflows
- Create **custom slash commands**
- Project-specific automation
- Tailored development processes

## Best Practices
- Start with codebase exploration
- Break complex tasks into steps
- Use appropriate tools for each workflow
- Leverage Claude's understanding of your project context
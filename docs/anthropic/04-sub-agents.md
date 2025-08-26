# Claude Code Sub-Agents

## What are Sub-Agents?
Sub-agents are **specialized AI assistants** within Claude Code that handle specific tasks with focused expertise.

## Key Characteristics
- **Specific purpose and expertise area** - each sub-agent has a defined role
- **Separate context window** from main conversation
- **Configurable with specific tools** and system prompts
- **Automatically or explicitly invoked** based on task requirements

## Benefits
- **Context preservation** - maintains focus on specific tasks
- **Specialized expertise** - deeper knowledge in specific domains
- **Reusability** across projects and team members
- **Flexible tool permissions** - access only what's needed

## Creating Sub-Agents

### Using the /agents Command
```bash
/agents  # Interactive sub-agent management interface
```

### Configuration Steps
1. Choose **project or user-level scope**
2. Define **name and description**
3. Select **available tools**
4. Write **detailed system prompt**

### Scope Options
- **Project-level**: Available only in current project
- **User-level**: Available across all projects

## Management
- **Interactive interface** through `/agents` command
- **Direct editing** of Markdown files in specific directories
- **Version control** for team collaboration

## Best Practices
- **Create focused sub-agents** with clear, single responsibilities
- **Write detailed, specific prompts** that define exact behavior
- **Limit tool access** to only what's necessary for the task
- **Consider version control** for team environments
- **Test sub-agents thoroughly** before deployment

## File Structure
Sub-agents are stored as Markdown files with:
- System prompt definition
- Tool permissions
- Configuration metadata

## Use Cases
- **Code review specialists**
- **Security auditing agents**
- **Testing and QA agents**
- **Documentation generators**
- **Deployment specialists**
- **Database migration agents**
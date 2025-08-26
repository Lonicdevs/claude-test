# Company Navigation Commands

## Quick Access Commands

### Company Overview
- **View Company Status**: Read `company/company-context.md`
- **Company Memory**: Read `company/company-memory.md`
- **Master Log**: Read `company/master-company-log.csv`

### Team Navigation
- **Scraping Team**: Navigate to `company/teams/scraping-team/`
  - Context: `company/teams/scraping-team/team-context.md`
  - Memory: `company/teams/scraping-team/team-memory.md`
  - Tools: `company/teams/scraping-team/team-tools.md`
  - Log: `company/teams/scraping-team/team-log.csv`

### Logs and Monitoring
- **All Company Logs**: `company/logs/`
- **Team Logs**: `company/logs/team-logs/`
- **Master Activity Log**: `company/master-company-log.csv`

### Templates and Resources
- **Team Templates**: `company/tools/team-templates/`
- **Company Tools**: `company/tools/`

## Command Shortcuts for Terminal

### Company Status Check
```bash
# Quick company overview
cat company/company-context.md | head -20

# Recent company activity
tail -10 company/master-company-log.csv
```

### Team Status Check
```bash
# Scraping team status
cat company/teams/scraping-team/team-context.md | grep -A 5 "Current Active Projects"

# Recent team activity
tail -5 company/teams/scraping-team/team-log.csv
```

### Full Company Navigation
```bash
# Company structure overview
tree company/ -L 3

# All team status
for team in company/teams/*/; do
  echo "=== $(basename "$team") ==="
  cat "$team/team-context.md" | grep -A 3 "Team Status"
done
```

## Company Information Hierarchy

### Level 1: Company Leadership (You)
- Access: All company files and team information
- Primary Interface: `CLAUDE.md` (Senior Manager)
- Command: Direct file access to any company resource

### Level 2: Senior Manager (Claude)
- Access: Full company context and team coordination
- Files: `company-context.md`, `company-memory.md`, `master-company-log.csv`
- Command: Company-wide coordination and team management

### Level 3: Team Level
- Access: Team-specific context, memory, tools, and logs
- Files: `team-context.md`, `team-memory.md`, `team-tools.md`, `team-log.csv`
- Command: Team operations and specialized work

## Navigation Workflow

### Daily Company Check (Levi)
1. **Company Status**: Check `company/company-context.md` for current priorities
2. **Recent Activity**: Review `company/master-company-log.csv` for all team activity
3. **Team Status**: Check specific team contexts for active projects
4. **Issues/Blockers**: Review team contexts for dependencies and blockers

### Team Work Session
1. **Team Context**: Load team-specific context and current projects
2. **Team Memory**: Reference team knowledge and successful patterns
3. **Team Tools**: Use team-specific workflows and commands
4. **Team Logging**: Log all activities to team log, escalate to company log as needed

### Cross-Team Coordination
1. **Company Context**: Update company-level context with cross-team information
2. **Team Dependencies**: Update team contexts with dependency information
3. **Company Logging**: Log cross-team activities in master company log
4. **Memory Sharing**: Share learnings between teams through company memory

## File Update Protocols

### When to Update Company Files
- **company-context.md**: New projects, priority changes, team status updates
- **company-memory.md**: Major learnings, successful patterns, failed approaches
- **master-company-log.csv**: All significant company and team activities

### When to Update Team Files
- **team-context.md**: Project status changes, capacity updates, new goals
- **team-memory.md**: New patterns discovered, lessons learned, tool preferences
- **team-log.csv**: All team activities, decisions, and outcomes

### Update Frequency
- **Real-time**: Activity logging as events happen
- **Daily**: Context updates with status changes
- **Weekly**: Memory updates with lessons learned
- **Monthly**: Comprehensive review and cleanup

## Emergency Procedures

### Company-Wide Issues
1. **Immediate**: Log in master-company-log.csv with "CRITICAL" priority
2. **Context**: Update company-context.md with issue status
3. **Coordination**: Alert all relevant teams through context updates
4. **Resolution**: Track resolution progress in company logs

### Team Escalation
1. **Team Level**: Log issue in team-log.csv
2. **Company Level**: Escalate to master-company-log.csv if impact beyond team
3. **Context Update**: Update both team and company contexts as needed
4. **Memory**: Document resolution approach in appropriate memory files

---
**Commands Updated**: 2024-08-26
**Usage**: Reference this file for all company navigation and file access patterns
**Maintained By**: Senior Manager
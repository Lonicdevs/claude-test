# Company Memory

## Lessons Learned

### Infrastructure Decisions
- **File-based approach**: Chosen for transparency, auditability, and simplicity
- **Sequential operations**: More predictable than parallel execution for our use case
- **Hierarchical logging**: Essential for compliance and debugging - each level aggregates from below

### Development Approach
- **Plan-heavy workflow**: Critical for AI teams to avoid second-best solutions
- **Zero blindspots policy**: Senior manager must have complete tool access and knowledge
- **Context preservation**: Each team/agent must maintain persistent memory for learning

### Technical Patterns
- **Prefer existing tools**: Use Grep over bash grep, Read before Edit, proper tool selection
- **Audit-first design**: Every operation must be logged and traceable
- **Security-focused**: All operations designed with compliance and security in mind

## Successful Patterns

### Project Structure
```
Master Terminal → CLAUDE.md (Senior Manager) → company/ → teams/ → specific work
```
This hierarchy provides clear navigation and responsibility boundaries.

### Documentation Standards
- Context files: Current state, active projects, goals
- Memory files: Lessons learned, patterns, decisions
- Log files: All activities and operations
- Tool files: Team-specific workflows and commands

### Communication Flow
- Bottom-up: Individual → Team → Company
- Top-down: Company priorities → Team goals → Individual tasks
- Lateral: Teams coordinate through company-level context

## Failed Approaches
- **Over-engineering**: Initially considered complex database and API systems - file-based approach proved better
- **Parallel execution focus**: Sequential approach provides better control and debugging
- **Generic agent creation**: Decided to wait for specific project requirements before creating agents

## Key Insights
- **Audit trails are competitive advantage**: Market needs this for AI compliance
- **Simplicity scales better**: Complex systems become maintenance burdens
- **Context persistence**: Teams need memory to improve over time
- **Tool access hierarchy**: Senior manager needs zero blindspots, teams need focused tool access
- **Live context evolution**: Memory and context files must be updated during operations, not after
- **Production-ready trumps perfect**: SQLite deployment beats PostgreSQL development delay
- **Architecture flexibility pays off**: Office-first design enables efficient rescanning at scale

## Company Culture
- **No compromise on tool access**: If best tool isn't available, escalate and get access
- **Plan before execute**: Always plan, check plan, then execute
- **Document everything**: Every decision, every pattern, every lesson learned
- **Security-first mindset**: Design for compliance and audit requirements

## Evolution Notes
- Company framework designed to be template for multiple businesses
- Structure should support rapid team addition and specialization
- Memory system allows company to improve operations over time
- **First major project success**: Flexible office scraper operational with 40 operators loaded
- **Context evolution pattern**: Memory files updated continuously during active operations
- **Scalability proven**: System architecture handles real production deployment requirements

---
**Memory Updated**: 2024-08-26T17:15:00Z (During Live Operations)
**Next Memory Review**: After domain discovery pipeline completion
**Contributors**: Senior Manager, Scraping Team Lead
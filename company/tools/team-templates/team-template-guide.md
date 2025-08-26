# Team Template Guide

## Standard Team Structure

Every team in the company should follow this standard structure for consistency and navigability.

### Required Files for Each Team

#### team-context.md
**Purpose**: Current state, active projects, goals, and priorities
**Contents**:
- Team mission and objectives
- Current active projects
- Team status and capacity
- Goals and milestones
- Resource requirements
- Dependencies and blockers

#### team-memory.md
**Purpose**: Lessons learned, patterns discovered, and knowledge retention
**Contents**:
- Successful approaches and patterns
- Failed approaches to avoid
- Tool usage patterns and preferences
- Domain-specific knowledge
- Team culture and communication patterns

#### team-log.csv
**Purpose**: All team activities and decisions for audit trail
**Format**: `timestamp,activity,details,status,updated_by`
**Contents**:
- All team activities
- Decision rationale
- Project milestones
- Issues and resolutions

#### team-tools.md
**Purpose**: Team-specific tools, workflows, and command references
**Contents**:
- Specialized tools for this team's domain
- Workflow documentation
- Command references and shortcuts
- Integration points with other teams
- Standard operating procedures

### Directory Structure Template
```
teams/[team-name]/
├── team-context.md
├── team-memory.md
├── team-log.csv
└── team-tools.md
```

### Communication Standards

#### Reporting Up to Company Level
- Teams update company-context.md with status changes
- Critical decisions logged in master-company-log.csv
- Dependencies and blockers escalated through proper channels

#### Data Flow
- Individual activities → Team logs
- Team patterns → Team memory
- Team status → Company context
- Company decisions → Team context

### Team Creation Checklist
- [ ] Create team directory under `company/teams/`
- [ ] Copy and customize team-context.md template
- [ ] Initialize team-memory.md with domain knowledge
- [ ] Create team-log.csv with header row
- [ ] Document team-specific tools and workflows
- [ ] Update company-context.md with new team information
- [ ] Log team creation in master-company-log.csv

### Integration Points
- Teams share relevant context through company-level files
- Cross-team dependencies documented in team-context files
- Shared tools and patterns documented in company/tools/
- Escalations follow hierarchy: Team → Company → Senior Manager
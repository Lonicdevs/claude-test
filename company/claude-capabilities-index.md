# Claude Code Capabilities Reference

## Core AI Capabilities

### 1. Programming & Development
- **Languages**: Node.js, TypeScript, Python, JavaScript, Bash scripting, SQL, JSON
- **Frameworks**: Prisma, Express, React, Next.js, Playwright, Puppeteer, Cheerio
- **Databases**: SQLite, PostgreSQL, MongoDB, Redis integration
- **APIs**: REST API design, GraphQL, webhook integration
- **Testing**: Unit tests, integration tests, E2E testing

### 2. File & Data Management
- **File Operations**: Read, write, edit, multi-edit, glob pattern matching, directory traversal
- **Data Processing**: CSV, JSON, XML parsing, data transformation, validation
- **Text Processing**: Regular expressions, content extraction, string manipulation
- **Image Analysis**: Can read and analyze PNG, JPG, PDF files, screenshots

### 3. Web Technologies
- **Scraping**: Multi-strategy web scraping (axios + Cheerio, Playwright for complex sites)
- **HTML/CSS**: Content extraction, DOM manipulation, selector analysis
- **HTTP**: Request handling, response analysis, redirect management, error handling
- **SEO**: Meta tag analysis, structured data extraction

### 4. System Administration
- **Process Management**: Background task execution, queue systems, job scheduling
- **Docker**: Container orchestration, docker-compose management
- **CLI Tools**: Command-line interface design, argument parsing, interactive prompts
- **Logging**: Structured logging, error tracking, performance monitoring

### 5. Search & Discovery
- **Web Search**: Google, Bing API integration for automated discovery
- **Domain Analysis**: Domain parsing, validation, canonical URL resolution
- **Content Analysis**: Brand matching, business signal detection, relevance scoring

## Specialized Agent Types

### 1. Domain Discovery Agent
- Multi-strategy domain discovery (search engines + domain guessing)
- Brand token matching and confidence scoring
- Duplicate detection and canonical domain resolution

### 2. Domain Verification Agent  
- Comprehensive website analysis for business validation
- Brand matching across title, content, meta data, domain
- Business signals: contact info, location data, hours, about sections
- Office space signals: coworking mentions, flexible office terms, pricing

### 3. Unified Scraper System
- Adaptive scraping strategy (lightweight first, Playwright fallback)
- Rate limiting, error handling, content deduplication
- Mobile-first responsive design detection

## Development Workflow

### 1. Planning & Architecture
- Requirements analysis and technical specification
- Database schema design with relationship modeling
- Multi-agent system coordination and task distribution
- Performance optimization and scalability planning

### 2. Implementation Patterns
- **Office-First Architecture**: Entity-centric data modeling for efficient rescanning
- **Queue-Based Processing**: Asynchronous job processing with retry logic
- **Configuration-Driven**: JSON-based configuration for easy maintenance
- **Context Evolution**: Continuous documentation updates during development

### 3. Quality Assurance
- Real-time error monitoring and alerting
- Comprehensive logging at all system levels
- Performance metrics and operational dashboards
- Change detection and version control

## Data Processing Capabilities

### 1. Entity Recognition
- Business name extraction and normalization
- Address parsing and geocoding
- Contact information extraction (phone, email)
- Brand asset detection (logos, colors)

### 2. Content Classification
- Page type detection (location index, detail pages, etc.)
- Product categorization (hot desk, private office, meeting rooms)
- Amenity standardization and mapping
- Pricing structure analysis

### 3. Change Detection
- Content hash comparison for update detection
- Field-level diff tracking with audit trails
- Scheduled rescanning based on content volatility
- Automated validation of extracted data

## System Integration

### 1. External Services
- Search engine APIs (Google, Bing)
- Geocoding services for address resolution
- Social media platform integration
- Email and communication APIs

### 2. Storage & Persistence
- SQLite for rapid development and testing
- PostgreSQL for production scalability
- Redis for queue management and caching
- S3-compatible storage for raw content archival

### 3. Monitoring & Observability
- Structured logging with correlation IDs
- Performance metrics collection
- Error aggregation and alerting
- Business KPI tracking and reporting

## Limitations & Considerations

### 1. Rate Limiting
- Respects robots.txt and crawl-delay directives
- Implements exponential backoff for failed requests
- Manages concurrent request limits per domain

### 2. Legal & Ethical
- Public data only, respects terms of service
- User-agent identification and contact information
- Opt-out mechanisms and respect for do-not-track

### 3. Technical Constraints
- JavaScript-heavy sites require Playwright (resource intensive)
- Some sites implement bot detection (requires rotation strategies)
- Large-scale operations require infrastructure scaling considerations

## Documentation Standards

All capabilities are continuously documented with:
- Real-world usage examples and success metrics
- Error patterns and troubleshooting guides
- Performance benchmarks and optimization recommendations
- Integration patterns for extending functionality

---
**Last Updated**: 2025-08-27
**Version**: 1.0
**Maintenance**: Auto-updated during active development sessions
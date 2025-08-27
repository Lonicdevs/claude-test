# Scraping Team Memory

## Successful Patterns and Approaches

### Technical Patterns
#### Pattern 1: Respectful Scraping Protocol
- **Description**: Always check robots.txt, implement rate limiting, and respect site terms
- **When to Use**: Every scraping project, no exceptions
- **Implementation**: Use robots-parser library, implement delays between requests, monitor for rate limiting responses
- **Benefits**: Avoids IP blocking, maintains legal compliance, builds sustainable scraping relationships
- **Examples**: Standard practice for all web scraping operations

#### Pattern 2: Multi-Engine Approach
- **Description**: Use appropriate scraping tool based on site complexity
- **When to Use**: Puppeteer for JavaScript-heavy sites, Cheerio+Axios for static HTML
- **Implementation**: Assess site dynamically, select optimal tool, fallback strategies
- **Benefits**: Optimal performance, reliability, resource efficiency
- **Examples**: Simple static sites → Cheerio, SPAs → Puppeteer

#### Pattern 3: Office-First Database Architecture
- **Description**: Design database schema around offices/locations rather than companies for efficient rescanning
- **When to Use**: Multi-location business data collection projects (coworking, retail, hospitality)
- **Implementation**: Use deterministic office_id generation, separate office rescan jobs from company discovery
- **Benefits**: Enables targeted rescanning without full company reprocessing, scales efficiently
- **Examples**: Flexible office scraper with 15-model schema, office_id-based rescan triggers

#### Pattern 4: Multi-Strategy Domain Discovery
- **Description**: Combine search engine scraping with intelligent domain guessing for comprehensive coverage
- **When to Use**: When operators may have websites not easily findable through basic searches
- **Implementation**: Google/Bing search scraping + brand name variations + common TLD patterns
- **Benefits**: Higher domain discovery success rate, covers edge cases
- **Examples**: "WeWork" → search results + wework.com/co/io guessing

### Workflow Patterns
#### Workflow 1: Site Assessment and Planning
- **Process**: 
  1. Analyze target site structure and technology
  2. Review robots.txt and terms of service
  3. Identify data extraction points
  4. Plan rate limiting and request patterns
  5. Design data validation and cleaning procedures
- **Tools Used**: Browser dev tools, robots-parser, site analysis tools
- **Success Criteria**: Comprehensive understanding of site before scraping begins
- **Time Investment**: 2-4 hours per new site

#### Workflow 2: Data Quality Validation
- **Process**:
  1. Define expected data schemas and formats
  2. Implement real-time validation during extraction
  3. Log data quality issues for review
  4. Implement data cleaning and normalization
  5. Generate quality reports for each scraping run
- **Tools Used**: JSON schema validation, CSV validation, custom quality checkers
- **Success Criteria**: Consistent, clean data output meeting specifications
- **Time Investment**: 30 minutes setup per data type, ongoing monitoring

## Failed Approaches (Learn From These)

### Failed Approach 1: Aggressive Scraping Without Rate Limiting
- **What Was Tried**: High-speed parallel requests to maximize data collection speed
- **Why It Failed**: Caused IP blocking, server overload, violated terms of service
- **Lessons Learned**: Speed must be balanced with respect and compliance
- **Better Alternative**: Implement intelligent rate limiting based on site response times

### Failed Approach 2: Single-Tool Approach
- **What Was Tried**: Using only one scraping tool (either Puppeteer or Cheerio) for all sites
- **Why It Failed**: Puppeteer overkill for simple sites, Cheerio insufficient for dynamic content
- **Lessons Learned**: Tool selection must match site complexity and requirements
- **Better Alternative**: Multi-engine approach with appropriate tool selection

### Failed Approach 3: Mixed Import Syntax in ES Modules
- **What Was Tried**: Using require() statements mixed with ES module imports in TypeScript
- **Why It Failed**: Node.js ES modules don't support CommonJS require syntax
- **Lessons Learned**: Modern Node.js projects must use consistent ES module syntax
- **Better Alternative**: Use `await import()` for dynamic imports, proper type imports

### Failed Approach 4: PostgreSQL Arrays in SQLite Migration
- **What Was Tried**: Direct schema migration from PostgreSQL arrays to SQLite
- **Why It Failed**: SQLite doesn't support array column types natively
- **Lessons Learned**: Database migration requires column type compatibility analysis
- **Better Alternative**: Use JSON columns for array data in SQLite

## Tool Usage and Preferences

### Preferred Tools
- **Puppeteer**: Preferred for JavaScript-heavy sites, SPAs, sites requiring user interaction
- **Cheerio + Axios**: Preferred for static HTML parsing, lightweight scraping, high-volume operations
- **robots-parser**: Essential for compliance checking on every site

### Tools to Avoid
- **Selenium**: Too heavy and slow compared to Puppeteer for most use cases
- **Direct HTTP without user-agent**: Easily detected and blocked

### Tool Combinations That Work Well
- **Axios + Cheerio + csv-writer**: Perfect for static site scraping with structured output
- **Puppeteer + data validation + CSV export**: Comprehensive solution for complex sites

## Domain-Specific Knowledge

### Web Scraping Best Practices
- **Rate Limiting**: 1-3 second delays between requests as starting point
- **User Agents**: Always use realistic user agent strings
- **Session Management**: Maintain sessions appropriately for authenticated scraping
- **Error Handling**: Graceful handling of network failures, timeouts, blocked requests

### Legal and Compliance Insights
- **robots.txt**: Always check and respect, even if not legally binding
- **Terms of Service**: Review carefully for scraping restrictions
- **Data Privacy**: Be mindful of personal data, implement appropriate safeguards
- **Fair Use**: Ensure scraping serves legitimate business purposes

### Technical Implementation Details
- **DOM Parsing**: CSS selectors more reliable than XPath for most scenarios
- **Dynamic Content**: Wait for content loading, use appropriate selectors
- **Data Extraction**: Extract structured data when possible, clean unstructured data
- **Storage**: Use appropriate formats (CSV for structured, JSON for complex data)

## Team Culture and Communication

### Communication Patterns That Work
- **Detailed Logging**: Every scraping run logged with results, issues, timing
- **Proactive Problem Reporting**: Issues reported immediately with proposed solutions
- **Compliance First**: When in doubt about legality/ethics, escalate immediately

### Decision-Making Approaches
- **Data-Driven Decisions**: Base tool and approach selection on site analysis
- **Compliance Override**: Legal and ethical considerations override efficiency

### Collaboration Insights
- **With Legal/Compliance**: Early consultation on new scraping targets
- **With Data Users**: Clear understanding of data requirements and formats
- **With Infrastructure**: Coordination on server resources and scheduling

## Performance Insights

### What Drives Success
- **Thorough Planning**: Understanding site and requirements before starting
- **Compliance Focus**: Respecting site policies prevents blocking and legal issues
- **Quality Focus**: Clean, validated data is more valuable than large volumes

### Common Pitfalls
- **Rushing Setup**: Inadequate site analysis leads to failed scraping attempts
- **Ignoring Robots.txt**: Can result in IP blocking and legal complications
- **Poor Error Handling**: Unhandled errors cause data loss and failed operations

## Knowledge Evolution

### Areas of Growing Expertise
- **Site Analysis**: Developing better techniques for assessing scrapability
- **Compliance Automation**: Building automated compliance checking tools
- **Data Quality**: Improving automated validation and cleaning procedures
- **Office-First Architecture**: Successfully implemented rescanning-friendly database design
- **ES Module Integration**: Mastered modern TypeScript/Node.js import patterns for production systems
- **Multi-Strategy Domain Discovery**: Proven search engine scraping + domain guessing approach

### Knowledge Gaps to Address
- **Advanced Anti-Bot Detection**: Techniques for handling sophisticated blocking
- **Large-Scale Scraping**: Distributed scraping for high-volume operations
- **API Integration**: Transitioning from scraping to API usage where available

### Learning Priorities
- **Priority 1**: Advanced compliance and ethical scraping techniques
- **Priority 2**: Performance optimization for large-scale operations
- **Priority 3**: Integration with broader data pipeline and analytics systems

## Real Project Insights (Flexible Office Scraper - 2024-08-26)

### Production Architecture Decisions That Worked
- **SQLite over PostgreSQL for Development**: Enabled immediate deployment without Docker dependency
- **JSON Columns for Arrays**: Maintained data structure flexibility while ensuring SQLite compatibility
- **CLI-First Interface**: Provided granular control and debugging capabilities for operations
- **Office-Centric Data Model**: 15-model schema designed for efficient location-based rescanning

### Operational Patterns Discovered
- **Import Statement Consistency**: Modern ES modules require careful import syntax - use type imports for types
- **Database Schema Evolution**: Always plan for database portability early in project design
- **Multi-Agent Architecture**: Domain discovery + verification pattern scales well for business data collection
- **Context File Evolution**: Team memory must be updated continuously during builds, not just at completion

### Success Metrics from First Deployment
- **40 operators loaded successfully** in initial test
- **Multi-strategy domain discovery** implemented and functional
- **Complete audit trail** maintained across team and company logs
- **Real-time operational monitoring** via CLI stats and database queries

---
**Memory Last Updated**: 2024-08-26T17:15:00Z (During Live Operations)
**Major Memory Review**: After first major scraping project completion
**Knowledge Contributors**: 
- Senior Manager (Initial Setup)
- Scraping Team Lead (Production Insights)
**Next Memory Update**: After domain discovery pipeline completion
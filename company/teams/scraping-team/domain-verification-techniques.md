# Domain Verification Technique Stack
**Priority**: Accuracy > Coverage | **Philosophy**: Multi-layered validation with human-like intelligence

## Technique Categories & Priority Order

### Tier 1: Authoritative Sources (Highest Accuracy - Try First)
**Success Rate**: 95%+ | **Coverage**: 60-70% of operators

#### 1.1 Business Registry Verification
- **Companies House API** (UK operators)
- **SEC EDGAR** (US public companies)
- **D&B Hoovers** (Global business directory)
- **Technique**: Match legal entity name → registered website
- **Agent**: Business Registry Specialist

#### 1.2 Property/Real Estate Verification
- **Commercial Real Estate Platforms**: LoopNet, CRE, Rightmove Commercial
- **Property Management APIs**: WeWork competitor listings
- **Technique**: Search for operator's office locations → verify domain matches
- **Agent**: Property Intelligence Specialist

#### 1.3 Financial/Investment Verification
- **Crunchbase API**: Startup funding data
- **PitchBook**: Private equity portfolio companies
- **LinkedIn Company Pages**: Official company verification
- **Technique**: Investor relations → official website confirmation
- **Agent**: Financial Intelligence Specialist

### Tier 2: Social Proof Validation (High Accuracy - Secondary)
**Success Rate**: 85%+ | **Coverage**: 80-90% of operators

#### 2.1 Social Media Cross-Reference
- **LinkedIn Company Pages**: Official company domains
- **Twitter/X Verified Business Profiles**: Bio links
- **Facebook Business Pages**: Website field verification
- **Instagram Business Profiles**: Bio link validation
- **Technique**: Multiple social platforms confirming same domain
- **Agent**: Social Media Intelligence Specialist

#### 2.2 News & Media Validation
- **Google News API**: Press mentions with domain links
- **PR Newswire/Business Wire**: Official press releases
- **Industry Publications**: Commercial real estate news
- **Technique**: Media mentions confirming official domain
- **Agent**: Media Intelligence Specialist

#### 2.3 Partnership/Integration Verification
- **Salesforce AppExchange**: Partner listings
- **Microsoft Partner Network**: Technology integrations
- **Zapier Integrations**: API partner confirmations
- **Technique**: Third-party platform partnerships confirming domains
- **Agent**: Partnership Intelligence Specialist

### Tier 3: Technical Verification (Medium Accuracy - Confirmation)
**Success Rate**: 75%+ | **Coverage**: 95%+ of operators

#### 3.1 DNS & Infrastructure Analysis
- **WHOIS Registration**: Domain ownership patterns
- **DNS TXT Records**: Domain verification records (Google, Microsoft)
- **SSL Certificate Analysis**: Organization validation
- **CDN Analysis**: Enterprise infrastructure patterns
- **Technique**: Technical fingerprinting of legitimate business domains
- **Agent**: Technical Infrastructure Specialist

#### 3.2 Email Domain Verification
- **MX Record Analysis**: Professional email infrastructure
- **SPF/DKIM Records**: Business email authentication
- **Employee Email Pattern Mining**: LinkedIn profiles → domain confirmation
- **Technique**: Email infrastructure indicating legitimate business
- **Agent**: Email Intelligence Specialist

### Tier 4: Human-Like Intelligence (Variable Accuracy - Complex Cases)
**Success Rate**: 60-90%+ | **Coverage**: 100% of operators

#### 4.1 Agentic Web Browsing Agent
- **Human-like Navigation**: Multi-step research workflows
- **Context Understanding**: Industry knowledge application
- **Cross-Reference Validation**: Multiple source confirmation
- **Reasoning Capability**: Logical deduction about domain authenticity
- **Technique**: AI agent mimicking human research methodologist
- **Agent**: Human Intelligence Simulation Specialist

#### 4.2 Industry-Specific Research
- **Trade Association Directories**: Coworking association member lists
- **Conference/Event Listings**: Industry event participant verification
- **Industry Report Citations**: Market research mentions
- **Technique**: Deep industry knowledge application
- **Agent**: Industry Research Specialist

## Flexible Office Space Industry Intelligence

### Positive Indicators (What They ARE)
- **Business Models**: Coworking, flexible office, serviced office, hot desking, private offices
- **Target Keywords**: "workspace", "coworking", "flexible office", "business center", "meeting rooms"
- **Service Indicators**: "membership", "day passes", "virtual office", "mail handling"
- **Amenity Patterns**: "WiFi", "coffee", "printer access", "reception services"
- **Location Patterns**: Central business districts, shared buildings, multiple locations

### Negative Indicators (What They ARE NOT)
- **Restaurants/Cafés**: Food service as primary business
- **Hotels**: Temporary accommodation focus
- **Traditional Offices**: Single-tenant, long-term lease only
- **Retail Spaces**: Product sales focus
- **Residential**: Living accommodation
- **Social Media Profiles**: Personal Instagram/TikTok accounts
- **Domain Parkers**: "This domain for sale" pages
- **Redirects to Unrelated Sites**: News sites, social platforms, etc.

## Reverse Domain Validation System

### Traditional Approach (Current - Flawed)
```
Domain → Scrape Content → Brand Match Analysis → Confidence Score
```

### Reverse Validation Approach (Proposed - Human-like)
```
Operator Info → Property Research → Business Registry → Social Verification → Domain Confirmation
```

### Reverse Validation Workflow
1. **Property Location Research**: Find actual office locations
2. **Business Entity Verification**: Confirm legal business status  
3. **Contact Information Cross-Reference**: Phone numbers, addresses match
4. **Social Proof Confirmation**: Multiple independent sources
5. **Domain Ownership Verification**: Technical confirmation of control
6. **Content Consistency Check**: Website matches confirmed business details

## Domain Accuracy Metrics System

### Multi-Dimensional Accuracy Score
```typescript
interface DomainAccuracyMetrics {
  authoritativeConfirmation: number    // 0-40 points
  socialProofScore: number            // 0-25 points  
  technicalValidationScore: number    // 0-20 points
  contentConsistencyScore: number     // 0-10 points
  negativeIndicatorPenalty: number    // 0 to -50 points
  humanValidationOverride: boolean    // Manual expert review
  finalAccuracyScore: number          // 0-100 scale
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW'
}
```

### Accuracy Thresholds
- **HIGH Confidence**: 85+ points (Authoritative + Social + Technical confirmation)
- **MEDIUM Confidence**: 70-84 points (2+ verification sources)
- **LOW Confidence**: 50-69 points (Single source or conflicting signals)
- **REJECTED**: <50 points or negative indicators present

### Success Rate Measurement
- **Precision**: Verified domains that are actually correct / Total verified domains
- **Recall**: Correct domains found / Total correct domains that exist
- **F1 Score**: Harmonic mean of precision and recall
- **Human Validation Sample**: 10% manual review for accuracy calibration

---
**Next**: Implement Tier 1 techniques first, build specialized agents for each category
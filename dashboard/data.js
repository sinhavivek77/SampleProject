// ─── Enums ───────────────────────────────────────────────────────────────────

const STATUS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS:  'In Progress',
  AT_RISK:      'At Risk',
  ON_HOLD:      'On Hold',
  COMPLETED:    'Completed',
  CANCELLED:    'Cancelled'
};

const PRIORITY = {
  LOW:      'Low',
  MEDIUM:   'Medium',
  HIGH:     'High',
  CRITICAL: 'Critical'
};

const SEVERITY = {
  LOW:      'Low',
  MEDIUM:   'Medium',
  HIGH:     'High',
  CRITICAL: 'Critical'
};

const STATUS_LIST   = Object.values(STATUS);
const PRIORITY_LIST = Object.values(PRIORITY);
const SEVERITY_LIST = Object.values(SEVERITY);

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_DATA = [
  {
    id: 'seed-001',
    name: 'Customer Portal Redesign',
    description: 'Full UX overhaul of the customer-facing portal to improve engagement and reduce support tickets.',
    ae: 'Sarah Mitchell',
    architect: 'James Cho',
    leadDeveloper: 'Priya Nair',
    businessSponsor: 'David Hartley',
    startDate: '2025-11-01',
    endDate: '2026-03-28',
    status: STATUS.AT_RISK,
    priority: PRIORITY.CRITICAL,
    risks: [
      { id: 'r-s001-1', description: 'Third-party design agency delivery delay', severity: SEVERITY.HIGH, mitigation: 'Identified in-house fallback team; weekly check-ins scheduled.' },
      { id: 'r-s001-2', description: 'Legacy API incompatibility with new UI framework', severity: SEVERITY.MEDIUM, mitigation: 'Spike underway to assess adapter layer effort.' }
    ],
    lastUpdated: '2026-04-05T09:14:00Z'
  },
  {
    id: 'seed-002',
    name: 'Data Platform Migration (v2)',
    description: 'Migrate on-prem data warehouse to cloud-native lakehouse architecture on Azure.',
    ae: 'Tom Reynolds',
    architect: 'Lin Wei',
    leadDeveloper: 'Ahmed Osei',
    businessSponsor: 'Karen Bloom',
    startDate: '2025-09-15',
    endDate: '2026-06-30',
    status: STATUS.IN_PROGRESS,
    priority: PRIORITY.HIGH,
    risks: [
      { id: 'r-s002-1', description: 'Data governance policy approval pending', severity: SEVERITY.HIGH, mitigation: 'Escalated to CIO; decision expected by end of month.' },
      { id: 'r-s002-2', description: 'Budget overrun risk due to egress costs', severity: SEVERITY.MEDIUM, mitigation: 'Cost model being revised with FinOps team.' }
    ],
    lastUpdated: '2026-04-04T16:45:00Z'
  },
  {
    id: 'seed-003',
    name: 'Mobile App – iOS & Android',
    description: 'Launch native mobile app for field sales team with offline-first capability and CRM sync.',
    ae: 'Olivia Barnes',
    architect: 'Marcus Patel',
    leadDeveloper: 'Yuki Tanaka',
    businessSponsor: 'Steve Donovan',
    startDate: '2026-01-10',
    endDate: '2026-07-31',
    status: STATUS.IN_PROGRESS,
    priority: PRIORITY.HIGH,
    risks: [
      { id: 'r-s003-1', description: 'App Store review timeline uncertainty', severity: SEVERITY.LOW, mitigation: 'Submit 3 weeks before target launch date.' }
    ],
    lastUpdated: '2026-04-03T11:00:00Z'
  },
  {
    id: 'seed-004',
    name: 'ERP Integration – Phase 1',
    description: 'Integrate SAP S/4HANA with internal order management system via middleware layer.',
    ae: 'Chris Fontaine',
    architect: 'James Cho',
    leadDeveloper: 'Ravi Sharma',
    businessSponsor: 'Nancy Wu',
    startDate: '2025-07-01',
    endDate: '2025-12-31',
    status: STATUS.COMPLETED,
    priority: PRIORITY.MEDIUM,
    risks: [],
    lastUpdated: '2026-01-08T08:30:00Z'
  },
  {
    id: 'seed-005',
    name: 'AI-Powered Support Chatbot',
    description: 'Deploy LLM-backed chatbot on support portal to deflect tier-1 tickets by 40%.',
    ae: 'Sarah Mitchell',
    architect: 'Lin Wei',
    leadDeveloper: 'Fatima Al-Hassan',
    businessSponsor: 'David Hartley',
    startDate: '2026-02-01',
    endDate: '2026-05-15',
    status: STATUS.IN_PROGRESS,
    priority: PRIORITY.CRITICAL,
    risks: [
      { id: 'r-s005-1', description: 'Hallucination rate above acceptable threshold in UAT', severity: SEVERITY.CRITICAL, mitigation: 'Implementing RAG with knowledge base; guardrails layer in review.' },
      { id: 'r-s005-2', description: 'PII handling compliance review not scheduled', severity: SEVERITY.HIGH, mitigation: 'Legal engaged; DPA amendment in draft.' }
    ],
    lastUpdated: '2026-04-06T07:50:00Z'
  },
  {
    id: 'seed-006',
    name: 'DevSecOps Pipeline Upgrade',
    description: 'Implement SAST, DAST, and SCA tooling across all CI/CD pipelines; enforce policy gates.',
    ae: 'Tom Reynolds',
    architect: 'Marcus Patel',
    leadDeveloper: 'Ben Carter',
    businessSponsor: 'Karen Bloom',
    startDate: '2026-03-01',
    endDate: '2026-08-31',
    status: STATUS.NOT_STARTED,
    priority: PRIORITY.MEDIUM,
    risks: [
      { id: 'r-s006-1', description: 'Developer adoption resistance to mandatory scan gates', severity: SEVERITY.MEDIUM, mitigation: 'Change management plan in progress; training sessions planned.' }
    ],
    lastUpdated: '2026-03-28T14:20:00Z'
  },
  {
    id: 'seed-007',
    name: 'Legacy Billing System Decommission',
    description: 'Sunset the 2009-era billing platform after full feature parity confirmed in new system.',
    ae: 'Olivia Barnes',
    architect: 'James Cho',
    leadDeveloper: 'Priya Nair',
    businessSponsor: 'Steve Donovan',
    startDate: '2025-10-01',
    endDate: '2026-03-15',
    status: STATUS.AT_RISK,
    priority: PRIORITY.HIGH,
    risks: [
      { id: 'r-s007-1', description: 'Data archival script performance – 8x slower than target', severity: SEVERITY.HIGH, mitigation: 'Parallel processing refactor in sprint 12.' },
      { id: 'r-s007-2', description: 'Client contracts referencing old billing codes not yet remapped', severity: SEVERITY.CRITICAL, mitigation: 'Audit underway; estimated 2-week remediation effort.' }
    ],
    lastUpdated: '2026-04-05T15:30:00Z'
  },
  {
    id: 'seed-008',
    name: 'SSO & Identity Consolidation',
    description: 'Roll out Okta-based SSO across all 47 internal tools, replacing individual user stores.',
    ae: 'Chris Fontaine',
    architect: 'Lin Wei',
    leadDeveloper: 'Ben Carter',
    businessSponsor: 'Nancy Wu',
    startDate: '2026-01-20',
    endDate: '2026-04-30',
    status: STATUS.ON_HOLD,
    priority: PRIORITY.HIGH,
    risks: [
      { id: 'r-s008-1', description: 'Vendor contract renewal stalled in procurement', severity: SEVERITY.HIGH, mitigation: 'CFO escalation requested by IT Director.' }
    ],
    lastUpdated: '2026-04-02T10:10:00Z'
  }
];

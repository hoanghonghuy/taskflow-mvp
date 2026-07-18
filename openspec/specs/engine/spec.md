# Engine — behavioral spec (Synapse-native)

## Scope

Broker, daemon, worker pool, MCP gateway, indexer, Surreal persistence.

## Requirements

### REQ-ENG-001 Stack health

**Given** `syn up` completed  
**When** `syn doctor` runs  
**Then** surreal, daemon, mcp-gateway report ok

### REQ-ENG-002 Job lifecycle

**Given** a job enqueued via broker  
**When** worker claims it  
**Then** job reaches completed or failed with telemetry

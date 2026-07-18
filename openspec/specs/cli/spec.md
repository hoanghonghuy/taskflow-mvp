# CLI — behavioral spec

## Scope

Node CLI `syn` / `synapse.js` — lifecycle, install, smoke, flow-test.

## Requirements

### REQ-CLI-001 Init

**Given** empty workspace  
**When** `syn init`  
**Then** `.env`, `.synapse/`, persona scaffold exist

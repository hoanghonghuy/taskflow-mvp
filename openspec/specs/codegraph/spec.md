# Codegraph — native code intelligence

## Scope

`pkg/codegraph` replaces external GitNexus for default dev (`CODE_INTEL_MODE=native`).

## Requirements

### REQ-CG-001 Go impact

**Given** a Go symbol in workspace  
**When** MCP `code_impact` is called  
**Then** definitions and references are returned from go/ast index

### REQ-CG-002 No external graph by default

**Given** default configuration  
**When** `syn doctor` runs  
**Then** `code_intel` is native and gitnexus is not required

## Roadmap

See [docs/CHECKLIST-OPENSPEC-CODEGRAPH.md](../../../docs/CHECKLIST-OPENSPEC-CODEGRAPH.md) Part II.

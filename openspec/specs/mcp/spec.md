# MCP gateway — behavioral spec

## Scope

~54 MCP tools, stdio + HTTP transport.

## Requirements

### REQ-MCP-001 Discovery

**When** IDE calls `search_tools`  
**Then** native catalog returns ranked tools

# MCP Servers

Model Context Protocol (MCP) servers provide additional capabilities and context to Claude through a standardized protocol.

## Directory Structure

Each subdirectory contains a complete MCP server implementation:

- `server-one/` - Example MCP server implementation
- `server-two/` - Example MCP server implementation

## What is MCP?

The Model Context Protocol allows Claude to:
- Access external data sources
- Interact with APIs and services
- Provide domain-specific context
- Extend capabilities beyond built-in tools

## Creating a New MCP Server

1. Create a new directory for your server
2. Implement the MCP protocol interface
3. Define available tools and resources
4. Add configuration and documentation

## Server Structure

```
server-name/
├── src/
│   └── index.ts       # Main server implementation
├── package.json       # Dependencies and metadata
├── tsconfig.json      # TypeScript configuration
└── README.md          # Server-specific documentation
```

## Configuration

MCP servers are configured in Claude Code's settings file. Add your server to the configuration:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["path/to/server/dist/index.js"]
    }
  }
}
```

## Resources

- [MCP Documentation](https://github.com/anthropics/anthropic-mcp)
- [Example Servers](https://github.com/anthropics/anthropic-mcp-servers)

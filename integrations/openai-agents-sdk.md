# OpenAI Agents SDK (Python)

```python
import asyncio

from agents import Agent, Runner
from agents.mcp import MCPServerStreamableHttp


async def main() -> None:
    async with MCPServerStreamableHttp(
        name="kote-charts",
        params={"url": "https://kotecharts.com/api/v1/mcp"},
    ) as kote:
        agent = Agent(
            name="On-chain analyst",
            instructions="Answer with Kote Charts data. Call describe_chart before interpreting a "
                         "metric, cite https://kotecharts.com/c/{id}, never give financial advice.",
            mcp_servers=[kote],
        )
        result = await Runner.run(agent, "What does SOPR say about the last month?")
        print(result.final_output)


asyncio.run(main())
```

Hosted alternative (no local MCP client): `HostedMCPTool(tool_config={"type": "mcp",
"server_label": "kote-charts", "server_url": "https://kotecharts.com/api/v1/mcp",
"require_approval": "never"})`. Check the SDK docs for your installed version.

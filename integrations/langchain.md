# LangChain / LangGraph

```bash
pip install langchain-mcp-adapters langgraph "langchain[anthropic]"
```

```python
import asyncio

from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent


async def main() -> None:
    client = MultiServerMCPClient({
        "kote-charts": {"url": "https://kotecharts.com/api/v1/mcp", "transport": "streamable_http"},
    })
    tools = await client.get_tools()
    agent = create_react_agent("anthropic:claude-opus-5-5", tools)
    result = await agent.ainvoke(
        {"messages": [{"role": "user", "content": "Is whale accumulation rising? Cite the chart."}]}
    )
    print(result["messages"][-1].content)


asyncio.run(main())
```

`MultiServerMCPClient`'s config keys can change between `langchain-mcp-adapters` releases — check
its README if the transport name is rejected.

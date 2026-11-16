# LlamaIndex

```bash
pip install llama-index-tools-mcp llama-index-llms-anthropic
```

```python
import asyncio

from llama_index.core.agent.workflow import FunctionAgent
from llama_index.llms.anthropic import Anthropic
from llama_index.tools.mcp import BasicMCPClient, McpToolSpec


async def main() -> None:
    mcp = BasicMCPClient("https://kotecharts.com/api/v1/mcp")
    tools = await McpToolSpec(client=mcp).to_tool_list_async()
    agent = FunctionAgent(
        tools=tools,
        llm=Anthropic(model="claude-opus-5-5"),
        system_prompt="Use Kote Charts tools; cite https://kotecharts.com/c/{id}; no financial advice.",
    )
    print(await agent.run("What is the current MVRV Z-Score and how does it compare to 2021?"))


asyncio.run(main())
```

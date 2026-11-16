"""Claude answers a Bitcoin on-chain question with live Kote Charts data via the MCP connector.

pip install anthropic; export ANTHROPIC_API_KEY=… (or `ant auth login`)
"""

import sys

import anthropic

question = " ".join(sys.argv[1:]) or (
    "Where is Bitcoin in its market cycle according to MVRV Z-Score and NUPL? "
    "Compare with previous cycle tops and cite every chart you used."
)

client = anthropic.Anthropic()
response = client.beta.messages.create(
    model="claude-opus-5-5",
    max_tokens=16000,
    output_config={"effort": "medium"},
    betas=["mcp-client-2025-11-20", "server-side-fallback-2026-07-01"],
    fallbacks="default",  # re-run a declined request on a fallback model server-side
    mcp_servers=[{"type": "url", "url": "https://kotecharts.com/api/v1/mcp", "name": "kote-charts"}],
    tools=[{"type": "mcp_toolset", "mcp_server_name": "kote-charts"}],
    messages=[{"role": "user", "content": question}],
)

if response.stop_reason == "refusal":
    print("Declined:", response.stop_details)
else:
    print("".join(block.text for block in response.content if block.type == "text"))

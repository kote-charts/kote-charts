"""Rolling 60-day balance change of whale cohorts vs exchange wallets (latest closed day).

export KOTE_API_KEY=kote_…
Data: Kote Charts — https://kotecharts.com/c/whale-vs-exchange-accumulation
"""

from kotecharts import KoteCharts

kc = KoteCharts()
meta = kc.metric("whale-vs-exchange-accumulation")
labels = {f["key"]: f["label"] for f in meta["fields"]}
row = kc.latest("whale-vs-exchange-accumulation") or {}
print(f"as of {row.get('t')}")
for key in ["btc100To1k", "btc1kTo10k", "btc10kPlus", "exchangeHot", "exchangeCold", "exchangeOther"]:
    if key in row and row[key] is not None:
        print(f"  {labels.get(key, key):<28} {row[key]:+,.0f} BTC")
print("Limitations:", *meta["limitations"], sep="\n - ")

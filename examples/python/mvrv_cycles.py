"""MVRV Z-Score highs and lows per four-year halving cycle.

pip install "kotecharts[pandas]"; export KOTE_API_KEY=kote_…
Data: Kote Charts — "MVRV Z-Score", https://kotecharts.com/c/mvrv-z-score (non-commercial use, cite).
"""

import pandas as pd

from kotecharts import KoteCharts

HALVINGS = ["2012-11-28", "2016-07-09", "2020-05-11", "2024-04-20"]

kc = KoteCharts()
meta = kc.metric("mvrv-z-score")
print(meta["formula"])
df = kc.chart("mvrv-z-score", start="2011-01-01").to_pandas()

edges = [pd.Timestamp("2011-01-01", tz="UTC"), *(pd.Timestamp(h, tz="UTC") for h in HALVINGS), df.index.max()]
for start, end in zip(edges[:-1], edges[1:]):
    cycle = df.loc[start:end, "mvrvZ"].dropna()
    if cycle.empty:
        continue
    print(
        f"{start.date()} → {end.date()}: peak {cycle.max():.2f} on {cycle.idxmax().date()}, "
        f"low {cycle.min():.2f} on {cycle.idxmin().date()}"
    )
print(f"latest: {df['mvrvZ'].dropna().iloc[-1]:.2f} ({df['mvrvZ'].dropna().index[-1].date()})")
print("Source: Kote Charts — https://kotecharts.com/c/mvrv-z-score")

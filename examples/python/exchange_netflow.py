"""Weekly exchange netflow (all labeled exchanges, then per venue).

pip install "kotecharts[pandas]"; export KOTE_API_KEY=kote_…
Data: Kote Charts — "Exchange Netflow", https://kotecharts.com/c/exchange-netflow
"""

from kotecharts import KoteCharts

kc = KoteCharts()
print(kc.metric("exchange-netflow")["formula"])

# This chart is published at 5m and day granularity (see metric()["availableGranularities"]);
# an unavailable granularity is served at the native one, so resample flows locally.
daily = kc.chart("exchange-netflow", start="2025-01-01").to_pandas()
weekly = daily[["exInBtc", "exOutBtc", "exNetBtc"]].resample("W").sum()
print(weekly.tail(8).round(0))

for venue in ["binance", "coinbase", "kraken"]:
    df = kc.chart("exchange-netflow", start="2025-10-01", exchange=venue).to_pandas()
    print(f"{venue:>9}: 30-day net {df['exNetBtc'].tail(30).sum():+,.0f} BTC")
print("Source: Kote Charts — https://kotecharts.com/c/exchange-netflow")

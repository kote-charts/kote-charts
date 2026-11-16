"""Print every public Kote Charts metric with its formula and field units — no API key needed."""

from kotecharts import KoteCharts

catalog = KoteCharts().metrics()
units = catalog["units"]
print(f"{catalog['total']} metrics\n")
for m in catalog["metrics"]:
    fields = ", ".join(f"{f['key']} [{units.get(f['unit'], f['unit'])}]" for f in m.get("fields", []))
    print(f"{m['id']:<40} {m.get('formula', '')[:90]}")
    if fields:
        print(f"{'':<40} fields: {fields}")

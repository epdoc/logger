# Todo List

## Influx Transport Optimizations

We have InfluxTransport -> InfluxDB -> Grafana working and we should now look at optimizations to improve the quality of the logs we display and the ease with which we can look at the data that we receive.

Influx Transport implementation: [transport.ts](./packages/logger/src/transports/influx/transport.ts)

Influx and grafana servers can be accessed using `ssh influx` and `ssh grafana`.

Influx display: [screenshot](https://www.dropbox.com/scl/fi/fp34d14eom2t9rbb43qox/Screenshot-2026-01-06-at-10.17.20-AM.png?rlkey=22s6k5kdqvns0flckh3jsv8us&dl=0)

Grafana Query:

```
import "strings"

from(bucket: "hamon")
  |> range(start: -24h) 
  |> filter(fn: (r) => r._measurement == "logs")
  |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
  |> map(fn: (r) => ({ 
      r with 
      level: if exists r.severity then strings.toUpper(v: r.severity) else "INFO" 
    }))
  // Merge all tables into one to ensure a global sort
  |> group()
  |> keep(columns: ["_time", "body", "level", "data_error", "data_database", "data_host"])
  |> sort(columns: ["_time"], desc: true)
```

Grafana Query Response:

```json
{
  "request": {
    "url": "api/ds/query?ds_type=influxdb&requestId=SQR107",
    "method": "POST",
    "data": {
      "queries": [
        {
          "datasource": {
            "type": "influxdb",
            "uid": "af96c4mf3sjcwf"
          },
          "query": "import \"strings\"\n\nfrom(bucket: \"hamon\")\n  |> range(start: -24h) \n  |> filter(fn: (r) => r._measurement == \"logs\")\n  |> pivot(rowKey:[\"_time\"], columnKey: [\"_field\"], valueColumn: \"_value\")\n  |> map(fn: (r) => ({ \n      r with \n      level: if exists r.severity then strings.toUpper(v: r.severity) else \"INFO\" \n    }))\n  // Merge all tables into one to ensure a global sort\n  |> group()\n  |> keep(columns: [\"_time\", \"body\", \"level\", \"data_error\", \"data_database\", \"data_host\"])\n  |> sort(columns: [\"_time\"], desc: true)",
          "refId": "A",
          "datasourceId": 1,
          "intervalMs": 30000,
          "maxDataPoints": 842
        }
      ],
      "from": "1767637424447",
      "to": "1767659024447"
    },
    "hideFromInspector": false
  },
  "response": {
    "results": {
      "A": {
        "status": 200,
        "frames": [
          {
            "schema": {
              "refId": "A",
              "meta": {
                "typeVersion": [
                  0,
                  0
                ],
                "executedQueryString": "import \"strings\"\n\nfrom(bucket: \"hamon\")\n  |> range(start: -24h) \n  |> filter(fn: (r) => r._measurement == \"logs\")\n  |> pivot(rowKey:[\"_time\"], columnKey: [\"_field\"], valueColumn: \"_value\")\n  |> map(fn: (r) => ({ \n      r with \n      level: if exists r.severity then strings.toUpper(v: r.severity) else \"INFO\" \n    }))\n  // Merge all tables into one to ensure a global sort\n  |> group()\n  |> keep(columns: [\"_time\", \"body\", \"level\", \"data_error\", \"data_database\", \"data_host\"])\n  |> sort(columns: [\"_time\"], desc: true)"
              },
              "fields": [
                {
                  "name": "_time",
                  "type": "time",
                  "typeInfo": {
                    "frame": "time.Time",
                    "nullable": true
                  }
                },
                {
                  "name": "body",
                  "type": "string",
                  "typeInfo": {
                    "frame": "string",
                    "nullable": true
                  },
                  "labels": {}
                },
                {
                  "name": "data_database",
                  "type": "string",
                  "typeInfo": {
                    "frame": "string",
                    "nullable": true
                  },
                  "labels": {}
                },
                {
                  "name": "data_error",
                  "type": "string",
                  "typeInfo": {
                    "frame": "string",
                    "nullable": true
                  },
                  "labels": {}
                },
                {
                  "name": "data_host",
                  "type": "string",
                  "typeInfo": {
                    "frame": "string",
                    "nullable": true
                  },
                  "labels": {}
                },
                {
                  "name": "level",
                  "type": "string",
                  "typeInfo": {
                    "frame": "string",
                    "nullable": true
                  },
                  "labels": {}
                }
              ]
            },
            "data": {
              "values": [
                [
                  1767657722089,
                  1767657722079,
                  1767657722071,
                  1767657722066,
                  1767657722040,
                  1767657722039
                ],
                [
                  "SAMPLE: Database connection failed",
                  "SAMPLE: High memory usage detected",
                  "SAMPLE: Service started",
                  "Console Transport: Console[text]",
                  "Influx Transport: Influx[http://10.0.10.35:8086/epdoc/hamon]",
                  "Logger initialized (manual emit)"
                ],
                [
                  "postgres",
                  null,
                  null,
                  null,
                  null,
                  null
                ],
                [
                  "Connection timeout",
                  null,
                  null,
                  null,
                  null,
                  null
                ],
                [
                  "localhost",
                  null,
                  null,
                  null,
                  null,
                  null
                ],
                [
                  "ERROR",
                  "WARN",
                  "INFO",
                  "INFO",
                  "INFO",
                  "INFO"
                ]
              ]
            }
          }
        ],
        "refId": "A"
      }
    }
  }
}
```


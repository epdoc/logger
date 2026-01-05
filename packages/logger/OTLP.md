# OpenTelemetry Protocol (OTLP) Transport Implementation

## Overview

**IMPORTANT**: Deno has built-in OpenTelemetry support since v1.40. This transport should integrate with Deno's native OTEL APIs rather than implementing OTLP from scratch.

## Deno OTEL Integration Strategy

Instead of creating a standalone OTLP transport, we should:

1. **Leverage Deno's built-in OTEL** - Use `Deno.telemetry` APIs
2. **Bridge to OTEL logging** - Connect @epdoc/logger to Deno's OTEL system
3. **Maintain compatibility** - Work with existing OTEL collectors and backends

## Research Needed

Before implementation, investigate:
- `Deno.telemetry` API capabilities
- Built-in OTLP export functionality
- Trace context propagation
- Log correlation with traces/metrics
- Configuration options

## Revised Implementation Approach

**Key Discovery**: Deno automatically exports `console.*` logs as OTLP when `OTEL_DENO=true`. This means we need a bridge transport that uses the OpenTelemetry Logs API.

### OTEL Bridge Transport (Recommended)
Create a transport that uses `npm:@opentelemetry/api` to emit structured logs:

```typescript
import { logs } from 'npm:@opentelemetry/api@1';

class OtelBridgeTransport extends Base.Transport {
  #logger: Logger;
  
  constructor(logMgr: LogMgr<MsgBuilder.Abstract>, opts: OtelOptions = {}) {
    super(logMgr, opts);
    const loggerProvider = logs.getLoggerProvider();
    this.#logger = loggerProvider.getLogger(opts.serviceName, opts.serviceVersion);
  }
  
  emit(msg: Entry) {
    // Convert @epdoc/logger Entry to OTEL LogRecord
    // Automatic OTLP export via Deno's built-in system
    this.#logger.emit({
      severityNumber: this.mapSeverity(msg.level),
      severityText: msg.level.toUpperCase(),
      body: this.formatMessage(msg),
      attributes: this.buildAttributes(msg),
      // Trace context automatically included by Deno
    });
  }
}
```

### Benefits of Bridge Approach
- **Zero OTLP implementation** - Leverages Deno's native export
- **Automatic trace correlation** - Deno handles span context
- **Standard compliance** - Uses official OpenTelemetry APIs
- **Performance** - Native Rust implementation in Deno
- **Future-proof** - Maintained by Deno team

## Implementation Structure

```
packages/logger/src/transports/otel/
├── transport.ts     # Main OTEL bridge transport
├── types.ts         # OTEL-specific types
├── bridge.ts        # Deno OTEL API integration
├── consts.ts        # OTEL constants
└── mod.ts           # Export module
```

## Next Steps

1. **Research Deno OTEL APIs** - Document available functionality
2. **Test integration** - Verify trace context propagation
3. **Choose approach** - Bridge vs format-only transport
4. **Implement minimal viable version**
5. **Test with OTEL ecosystem**

## Benefits of Deno Integration

- **Native performance** - Uses Deno's optimized OTEL implementation
- **Automatic correlation** - Built-in trace/span context
- **Standard compliance** - Guaranteed OTLP specification adherence
- **Ecosystem compatibility** - Works with all OTEL tooling
- **Future-proof** - Maintained by Deno team

This approach positions @epdoc/logger as a bridge to Deno's modern observability capabilities rather than reimplementing OTLP.

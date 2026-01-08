# @epdoc/logger

A comprehensive TypeScript logging ecosystem for modern applications, featuring structured message formatting, flexible transports, and CLI application integration.

## 🚀 Quick Start Options

**Prefer examples?** Jump straight to working code:
- **[Demo Project](./packages/demo/)** - Complete CLI app with custom message builders and file operations
- **[Examples Collection](./packages/examples/)** - Focused examples for specific use cases
- **Run examples**: `cd packages/examples && ./run.sh`

**Prefer tutorials?** Follow the step-by-step guide:
- **[Getting Started Guide](./GETTING_STARTED.md)** - Complete tutorial from basics to advanced patterns

## Installation

```bash
deno add @epdoc/logger @epdoc/msgbuilder @epdoc/cliapp
```

```typescript
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

type MsgBuilder = Console.Builder;
type Logger = Log.Std.Logger<MsgBuilder>;

const logMgr = new Log.Mgr<MsgBuilder>();
const logger = await logMgr.getLogger<Logger>();

logger.info.h1('Hello World').emit();
```

## Ecosystem Packages

| Package | Purpose | Status |
|---------|---------|---------|
| **[@epdoc/logger](./packages/logger/README.md)** | Core logging with transports | ✅ Stable |
| **[@epdoc/msgbuilder](./packages/msgbuilder/README.md)** | Structured message formatting | ✅ Stable |
| **[@epdoc/cliapp](./packages/cliapp/README.md)** | CLI application framework | ✅ Stable |
| **[@epdoc/loglevels](./packages/loglevels/README.md)** | Log level management | ✅ Stable |
| **[examples](./packages/examples/)** | Working examples and tutorials | ✅ Reference |
| **[demo](./packages/demo/)** | Complete CLI app showcase | ✅ Reference |
| [@epdoc/logdy](./packages/logdy/) | Logdy transport | 🚧 Development |
| [@epdoc/logjava](./packages/logjava/) | Java-style log levels | 🚧 Development |

## Documentation

| Document | Purpose |
|----------|---------|
| **[GETTING_STARTED.md](./GETTING_STARTED.md)** | Complete tutorial from basics to advanced patterns |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Technical architecture and design patterns |
| **[CONFIGURATION.md](./CONFIGURATION.md)** | Advanced configuration options |

## Key Features

- **🎯 Type-Safe Logging** - Full TypeScript support with generic constraints
- **🎨 Rich Formatting** - Chainable message builders with colors and styling
- **🔌 Flexible Transports** - Console, file, buffer, and custom outputs
- **📊 Performance Timing** - Built-in operation timing with `mark()` and `ewt()`
- **🏗️ CLI Integration** - Complete framework for command-line applications
- **🎭 Context Tracking** - Request IDs, session tracking, hierarchical loggers
- **🧪 Testing Support** - Buffer transport for programmatic log inspection

## Use Cases

### Simple Application Logging ([examples/logger.01.run.ts](./packages/examples/logger.01.run.ts))
```typescript
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

type MsgBuilder = Console.Builder;
type Logger = Log.Std.Logger<MsgBuilder>;

const logMgr = new Log.Mgr<MsgBuilder>();
const logger = await logMgr.getLogger<Logger>();

logger.info.h1('Hello World').emit();
```

### CLI Applications
```typescript
class MyApp extends CliApp.Cmd.Root<AppBundle, AppOptions> {
  // Structured CLI with integrated logging
}
```

### Custom Message Builders
```typescript
const AppBuilder = Console.extender({
  apiCall(method: string, endpoint: string) {
    return this.text(`[API] ${method} ${endpoint}`);
  }
});
```

## Development

This project uses AI-assisted development. See [AI.md](./AI
.md) for AI development guidelines.

## License

MIT License - see [LICENSE](./LICENSE) file for details.

# @epdoc/cliffapp

A command framework bridging [@epdoc/logger](https://jsr.io/@epdoc/logger) and [deno-cliffy](https://github.com/c4spar/deno-cliffy), supporting both declarative and class-based Cliffy command hierarchies with progressive context refinement.

## Features

- **Unified Architecture**: Single `Command` class handles both declarative and class-based patterns
- **Progressive Context Refinement**: Options flow down the command tree, allowing specialized contexts at each level
- **Staged Initialization**: Proper handling of Cliffy's parse-before-execute constraint
- **Standardized Logging**: Built-in `--log-level`, `--verbose`, `--debug`, `--dry-run` options
- **Type Safe**: Full TypeScript support with generic contexts
- **Flexible Patterns**: Start declarative, add classes where needed, or go fully class-based

## Installation

```json
{
  "imports": {
    "@epdoc/cliffapp": "jsr:@epdoc/cliffapp@^0.1.8"
  }
}
```

## Quick Start

```typescript
import { Command, addLoggingOptions, run } from "@epdoc/cliffapp";

// 1. Define your context
class MyContext implements ICtx {
  log!: Logger;
  logMgr!: LogManager;
  dryRun = false;
  pkg = { name: "my-app", version: "1.0.0", description: "My CLI app" };
  
  async close() { await this.logMgr.close(); }
}

// 2. Create command tree
const tree = {
  description: "My CLI application",
  setupGlobalAction: (cmd, ctx) => addLoggingOptions(cmd, ctx),
  subCommands: {
    hello: {
      description: "Say hello",
      action: (ctx, opts) => ctx.log.info.text("Hello World!").emit()
    }
  }
};

// 3. Run it
const ctx = new MyContext();
const cmd = new Command(tree);
await cmd.setContext(ctx);
await cmd.init();
await run(ctx, cmd.cmd);
```

## Architecture: Why Staged Initialization?

The framework uses staged initialization because **options flow down the command tree**:

```
Root Options (--host, --api-url) 
    ↓ [parsed]
Root Context (creates API client)
    ↓ [flows down]
Child Commands (use API client)
    ↓ [can refine further]
Grandchild Commands (specialized contexts)
```

This requires breaking initialization into stages:

1. **Declare Structure** (`setupOptions`) - Define options before parsing
2. **Set Context** (`setContext`) - Provide initial context  
3. **Initialize Tree** (`init`) - Build command hierarchy with context
4. **Parse & Execute** - Cliffy parses options and runs actions

## Pattern 1: Declarative Approach

**Best for**: Simple CLIs, rapid prototyping, configuration-driven commands

```typescript
import { Command, addLoggingOptions, run, type CommandNode, type ICtx } from "@epdoc/cliffapp";

interface AppContext extends ICtx {
  apiUrl?: string;
  apiClient?: ApiClient;
}

const tree: CommandNode<AppContext> = {
  description: "My API CLI",
  setupGlobalAction: (cmd, ctx) => addLoggingOptions(cmd, ctx),
  options: {
    '--api-url <url>': {
      description: 'API endpoint URL',
      default: 'https://api.example.com'
    }
  },
  // Context refinement: create API client from parsed options
  refineContext: async (ctx, opts) => {
    ctx.apiUrl = opts.apiUrl;
    ctx.apiClient = new ApiClient(opts.apiUrl);
    return ctx;
  },
  subCommands: {
    users: {
      description: "User management",
      subCommands: {
        list: {
          description: "List users",
          action: async (ctx) => {
            const users = await ctx.apiClient.getUsers();
            ctx.log.info.text(`Found ${users.length} users`).emit();
          }
        },
        create: {
          description: "Create user",
          options: {
            '--name <name>': 'User name',
            '--email <email>': 'User email'
          },
          action: async (ctx, opts) => {
            await ctx.apiClient.createUser(opts.name, opts.email);
            ctx.log.info.text(`Created user ${opts.name}`).emit();
          }
        }
      }
    }
  }
};

// Usage
const ctx = new AppContext();
const cmd = new Command(tree);
await cmd.setContext(ctx);
await cmd.init();
await run(ctx, cmd.cmd);
```

## Pattern 2: Hybrid Approach

**Best for**: Mostly simple commands with a few complex ones

Start declarative, add classes where you need more control:

```typescript
import { Command, addLoggingOptions } from "@epdoc/cliffapp";

// Complex command as a class
class DatabaseCommand extends Command<AppContext> {
  protected override async deriveChildContext(ctx: AppContext, opts: CmdOptions): Promise<AppContext> {
    // Create database connection from parent's API client
    ctx.dbConnection = await ctx.apiClient.getDatabaseConnection();
    return ctx;
  }

  protected override setupOptions(): void {
    this.cmd
      .description("Database operations")
      .option('--table <name>', 'Table name')
      .option('--batch-size <size:number>', 'Batch size', { default: 100 });
  }

  protected override setupAction(): void {
    this.cmd.action(async (opts) => {
      const records = await this.ctx.dbConnection.query(opts.table);
      this.ctx.log.info.text(`Processing ${records.length} records`).emit();
      
      // Complex batch processing logic here...
      for (let i = 0; i < records.length; i += opts.batchSize) {
        const batch = records.slice(i, i + opts.batchSize);
        await this.processBatch(batch);
      }
    });
  }

  private async processBatch(batch: Record[]) {
    // Complex processing logic that justifies a class
  }
}

// Mix with declarative commands
const hybridTree: CommandNode<AppContext> = {
  description: "Hybrid CLI",
  setupGlobalAction: (cmd, ctx) => addLoggingOptions(cmd, ctx),
  options: {
    '--api-url <url>': 'API endpoint'
  },
  refineContext: async (ctx, opts) => {
    ctx.apiClient = new ApiClient(opts.apiUrl);
    return ctx;
  },
  subCommands: {
    // Simple declarative command
    status: {
      description: "Check API status",
      action: async (ctx) => {
        const status = await ctx.apiClient.getStatus();
        ctx.log.info.text(`API Status: ${status}`).emit();
      }
    },
    // Complex class-based command
    database: DatabaseCommand
  }
};
```

## Pattern 3: Full Class-Based Approach

**Best for**: Large CLIs, complex business logic, extensive testing needs

```typescript
import { Command, addLoggingOptions } from "@epdoc/cliffapp";

// Root command with global options
class RootCommand extends Command<AppContext> {
  protected override subCommands = {
    users: UsersCommand,
    database: DatabaseCommand,
    config: ConfigCommand
  };

  protected override async deriveChildContext(ctx: AppContext, opts: CmdOptions): Promise<AppContext> {
    // Create API client from global options
    if (opts.apiUrl) {
      ctx.apiUrl = opts.apiUrl;
      ctx.apiClient = new ApiClient(opts.apiUrl, {
        timeout: opts.timeout,
        retries: opts.retries
      });
      
      // Validate connection
      await ctx.apiClient.ping();
      ctx.log.verbose.text(`Connected to API at ${opts.apiUrl}`).emit();
    }
    return ctx;
  }

  protected override setupOptions(): void {
    this.cmd
      .name(this.ctx.pkg.name)
      .version(this.ctx.pkg.version)
      .description(this.ctx.pkg.description)
      .option('--api-url <url>', 'API endpoint URL', { 
        default: 'https://api.example.com' 
      })
      .option('--timeout <ms:number>', 'Request timeout', { default: 5000 })
      .option('--retries <count:number>', 'Retry attempts', { default: 3 });

    addLoggingOptions(this.cmd, this.ctx);
  }
}

// Specialized command with its own context refinement
class UsersCommand extends Command<AppContext> {
  protected override subCommands = {
    list: UserListCommand,
    create: UserCreateCommand,
    delete: UserDeleteCommand
  };

  protected override async deriveChildContext(ctx: AppContext, opts: CmdOptions): Promise<AppContext> {
    // Add user-specific services to context
    ctx.userService = new UserService(ctx.apiClient);
    ctx.validator = new UserValidator();
    
    if (opts.adminMode) {
      ctx.userService.enableAdminMode();
      ctx.log.warn.text("Admin mode enabled - use with caution").emit();
    }
    
    return ctx;
  }

  protected override setupOptions(): void {
    this.cmd
      .description("User management commands")
      .option('--admin-mode', 'Enable admin operations');
  }
}

// Leaf command with specific action
class UserCreateCommand extends Command<AppContext> {
  protected override setupOptions(): void {
    this.cmd
      .description("Create a new user")
      .option('--name <name>', 'User name', { required: true })
      .option('--email <email>', 'User email', { required: true })
      .option('--role <role>', 'User role', { default: 'user' })
      .option('--send-welcome', 'Send welcome email');
  }

  protected override setupAction(): void {
    this.cmd.action(async (opts) => {
      // Validate input using context services
      const validation = await this.ctx.validator.validateUser({
        name: opts.name,
        email: opts.email,
        role: opts.role
      });

      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Create user using context service
      const user = await this.ctx.userService.createUser({
        name: opts.name,
        email: opts.email,
        role: opts.role
      });

      this.ctx.log.info
        .text(`Created user ${user.name} (${user.id})`)
        .emit();

      if (opts.sendWelcome) {
        await this.ctx.userService.sendWelcomeEmail(user.id);
        this.ctx.log.info.text("Welcome email sent").emit();
      }
    });
  }
}

// Usage
const ctx = new AppContext();
const rootCmd = new RootCommand();
await rootCmd.setContext(ctx);
await rootCmd.init();
await run(ctx, rootCmd.cmd);
```

## Context Refinement Patterns

### 1. Adding Services

```typescript
protected override async deriveChildContext(ctx: MyContext, opts: CmdOptions): Promise<MyContext> {
  // Add new services based on options
  if (opts.database) {
    ctx.db = new DatabaseService(opts.database);
  }
  
  if (opts.cache) {
    ctx.cache = new CacheService(opts.cache);
  }
  
  return ctx;
}
```

### 2. Creating Specialized Contexts

```typescript
class ApiContext extends BaseContext {
  apiClient!: ApiClient;
  rateLimiter!: RateLimiter;
}

protected override async deriveChildContext(ctx: BaseContext, opts: CmdOptions): Promise<ApiContext> {
  const apiCtx = new ApiContext();
  Object.assign(apiCtx, ctx); // Copy base properties
  
  apiCtx.apiClient = new ApiClient(opts.apiUrl);
  apiCtx.rateLimiter = new RateLimiter(opts.rateLimit);
  
  return apiCtx;
}
```

### 3. Conditional Context Modification

```typescript
protected override async deriveChildContext(ctx: MyContext, opts: CmdOptions): Promise<MyContext> {
  // Clone context to avoid mutations
  const newCtx = { ...ctx };
  
  if (opts.verbose) {
    newCtx.logMgr.threshold = 'verbose';
  }
  
  if (opts.production) {
    newCtx.environment = 'production';
    newCtx.apiClient = new ProductionApiClient();
  } else {
    newCtx.environment = 'development';
    newCtx.apiClient = new DevelopmentApiClient();
  }
  
  return newCtx;
}
```

## When to Use Each Pattern

### Choose Declarative When:
- ✅ Simple, straightforward commands
- ✅ Configuration-driven behavior
- ✅ Rapid prototyping
- ✅ Commands with minimal business logic
- ✅ Teams prefer functional programming

### Choose Hybrid When:
- ✅ Mostly simple commands with a few complex ones
- ✅ Gradual migration from declarative to class-based
- ✅ Different team members have different preferences
- ✅ Want to minimize boilerplate for simple commands

### Choose Class-Based When:
- ✅ Complex business logic in commands
- ✅ Extensive testing requirements
- ✅ Large command hierarchies
- ✅ Need inheritance and polymorphism
- ✅ Teams prefer object-oriented programming
- ✅ Commands need private methods and state

## Advanced Topics

### Custom Context Types

```typescript
interface DatabaseContext extends ICtx {
  db: DatabaseConnection;
  transaction?: Transaction;
}

interface ApiContext extends ICtx {
  apiClient: ApiClient;
  rateLimiter: RateLimiter;
}

// Commands can specify their required context type
class DatabaseCommand extends Command<DatabaseContext> {
  // TypeScript ensures this.ctx has db property
}
```

### Error Handling

```typescript
import { SilentError } from "@epdoc/cliffapp";

// Silent errors don't show stack traces
if (!user) {
  throw new SilentError("User not found");
}

// Regular errors show full details in debug mode
throw new Error("Database connection failed");
```

### Testing Commands

```typescript
import { Command } from "@epdoc/cliffapp";

// Test individual commands
const cmd = new MyCommand();
const mockCtx = createMockContext();
await cmd.setContext(mockCtx);
await cmd.init();

// Test with specific arguments
await cmd.cmd.parse(['--name', 'test', '--verbose']);
```

## Examples

See the [demo-cliffy](../demo-cliffy/) package for complete working examples of all three patterns.

## API Reference

### Command Class

```typescript
class Command<Ctx extends ICtx = ICtx> {
  constructor(node?: CommandNode<Ctx>)
  
  async setContext(ctx: Ctx): Promise<void>
  async init(): Promise<void>
  
  // Lifecycle hooks (override in subclasses)
  protected setupOptions(): void
  protected configureGlobalHooks(): void  
  protected setupSubcommands(): void
  protected setupAction(): void
  protected async deriveChildContext(ctx: Ctx, opts: CmdOptions): Promise<Ctx>
}
```

### Utility Functions

```typescript
// Add standard logging options
addLoggingOptions(command: Command, ctx: ICtx): Command

// Configure logging from parsed options
configureLogging(ctx: ICtx, opts: Partial<GlobalOptions>): void

// Run application with error handling and lifecycle management
run(ctx: ICtx, command: Command, args?: string[]): Promise<void>
```

## License

MIT

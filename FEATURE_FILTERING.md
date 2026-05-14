# Feature: log filtering

## Goal

The context is using a logger for user-facing log messages at LEVEL=INFO (typically) to monitor progress of a CLI application. For system logging, other levels (verbose, debug) can be used to provide the level of detail wanted.

Using an analogy, there are times when a CLI application may be building a city, in which case the user wants to see the creation of every park in the city. And other times you are buiding a country, in which case outputing log messages about the park will create too much noise. The user may just want a progress bar for the creation of each city.

The problem is that this monorepo doesn't support such filtering. 

## Solution

We may have a very natural location in code where we can filter log messages based on criteria other than the log level. 

 This location is the emit method on a msgBuilder makes a call `this._logMgr.transportMgr.meetsAnyThreshold(msg.level)` (see [logger.ts](/Users/jpravetz/dev/@epdoc/logger/packages/logger/src/loggers/indent/logger.ts) line 99) to determine if it should try to format the message for output. 

Note also that this monorepo does support progress bars. A progress bar cannot be interrrupted by other log messages being output between when `start` and `stop` are called.

### Preious AI Analysis by Gemini

Looking at the exact execution flow you described, **yes, this is the absolute perfect focus point** for handling this architecturally.

When `msgBuilder.emit()` runs, it is deciding whether to pay the performance cost of string formatting, object allocation, and transport delivery. If it bails early via `meetsAnyThreshold(msg.level)`, the log statement disappears with minimal CPU overhead.

If you want to inject constraints like `pkg` or specific context rules (`sid`, custom flags) to drop noisy logs early, modifying or hooking into this mechanism is highly efficient. Let's break down how this design accommodates that.

---

## The Current Flow vs. The Opportunity

Right now, the logic is strictly standard level-based:

```
[Log Call] ➔ msgBuilder.emit() ➔ transportMgr.meetsAnyThreshold(level) ➔ (True/False)

```

By enhancing this specific bottleneck, you can transform it into a **Context-Aware Guard**.

Because `msgBuilder` contains (or has access to) the `msg` object—which carries the `level`, the log message, and the context payload (`pkg`, `sid`, `reqId`)—you have all the telemetry you need right at that exact line of code.

Here are the two primary ways to design a solution around this specific checkpoint.

---

## Approach A: Refactoring `meetsAnyThreshold` to Accept Context

If you have control over the internal implementation of `@epdoc/logger`, the cleanest architectural change is to update `meetsAnyThreshold` so it doesn't just inspect the log level, but evaluates the full `msg` profile or context.

Instead of:

```typescript
this._logMgr.transportMgr.meetsAnyThreshold(msg.level)

```

You update it to pass the `pkg` or the entire context:

```typescript
this._logMgr.transportMgr.meetsAnyThreshold(msg.level, msg.pkg, msg.ctx)

```

### Why this is powerful:

Inside `transportMgr`, you can maintain a dynamic map of package-specific rules or scale-specific exclusions. For example:

```typescript
// Inside TransportMgr
public meetsAnyThreshold(level: Level, pkg?: string, ctx?: LogContext): boolean {
  // 1. Global scale check (e.g., if we are building the world)
  if (ctx?.sid === "world-build" && pkg === "city:parks") {
    return false; // Drop immediately regardless of level
  }

  // 2. Fall back to standard level thresholds per transport
  return this._transports.some(t => level >= t.threshold);
}

```

---

## Approach B: Intercepting inside `msgBuilder.emit` (Plugin/Predicate Pattern)

If you prefer to keep `TransportMgr` strictly focused on raw log levels, you can introduce a **Predicate Filter** directly into the `msgBuilder.emit()` logic.

This introduces a shortcut rule *before* it asks the transport manager about thresholds.

### The Design:

You can allow `LogMgr` to accept a user-defined filter function. Inside `msgBuilder.emit()`, you evaluate that filter:

```typescript
// Inside msgBuilder.emit()
if (this._logMgr.hasFilter() && !this._logMgr.evalFilter(this.msg)) {
  return; // Bailed out early due to custom rule (e.g., too many parks!)
}

// Fall back to the standard threshold check
if (!this._logMgr.transportMgr.meetsAnyThreshold(this.msg.level)) {
  return;
}

```

### How you would use it in your CLI app:

When your application transitions from "City Mode" to "World Mode", you configure the filter on your manager:

```typescript
import { LogMgr } from "@epdoc/logger";

const mgr = LogMgr.getInstance();

// When building the world:
mgr.setFilter((msg) => {
  // Block park logs during world builds
  if (msg.ctx?.sid === "world-build" && msg.pkg === "city:parks") {
    return false; 
  }
  return true;
});

```

---

## Why focusing on this point is superior

1. **Performance:** By short-circuiting right here, you avoid running string interpolations or formatting logic for thousands of parks when building the world.
2. **Centralization:** You don't have to pepper `if (mode !== 'world')` statements across your actual domain logic (the city/world builder algorithms). The domain logic just logs happily, and the infrastructure layer handles the operational scale muting.
3. **Preserves Object Structure:** Because `msgBuilder` already understands the structural properties of `@epdoc/logger` (`pkg`, `sid`), you don't have to invent a new schema to pass data around.

### My comment on the above analysis

I like this approach.  
To change the value of pkg, we do have to create a new context, do we not?
That is one drawback because, even though the architecture is designed for this, I've found it to be a mental chore to do so (feel free to differ).
However we could maybe have a BaseClass with a constuctor(ctx:Context) that automatically creates a new context with a new pkg value? Then if it is built in, then it is easier to use?

### AI analysis: 

You are absolutely hitting on a core developer ergonomics issue. I do not differ at all—it **is** a mental chore.

When an API forces you to manually manage, copy, or instantiate contexts deep inside your domain logic just to track what "module" you are in, it creates cognitive load. You end up writing boilerplate instead of building features.

Your idea of a `BaseClass` that handles this lifecycle automatically via the constructor is excellent. It shifts the burden from the *execution loop* to the *class definition*, making it a "set and forget" architectural pattern.

---

## The BaseClass Pattern with Automated Context

By using a base class, you can automatically derive or pass a `pkg` value once when a service or runner is instantiated. The base class takes care of generating the child logger context under the hood, exposing a clean, local `log` instance to the subclass.

Here is how that design looks:

```typescript
import { Logger, type Context } from "@epdoc/logger";

export abstract class LoggedComponent {
  // Every subclass gets its own pre-configured logger
  protected log: Logger;

  /**
   * @param pkg The package/namespace identifier for this component
   * @param baseCtx The inherited context (carrying existing sid, reqId)
   */
  constructor(pkg: string, baseCtx?: Context) {
    // We create the new context wrapper *once* during object creation
    const componentContext = {
      ...baseCtx,
      pkg: pkg // Inject or override the pkg identifier
    };

    // Instantiate the local logger bound to this specific context
    this.log = new Logger(componentContext);
  }
}

```

### Implementing the Subclasses (Zero Boilerplate)

Now, your actual domain classes don't have to think about context manipulation at all. They just use `this.log`.

```typescript
// 1. The Park Builder (Noisy component)
export class ParkBuilder extends LoggedComponent {
  constructor(parentCtx?: Context) {
    // Bind this class permanently to the "city:parks" namespace
    super("city:parks", parentCtx);
  }

  public addPark(name: string) {
    // No context logic here. The underlying msgBuilder automatically gets 'city:parks'
    this.log.info(`Added park: ${name}`); 
  }
}

// 2. The World Builder (High-level coordinator)
export class WorldBuilder extends LoggedComponent {
  private parkBuilder: ParkBuilder;

  constructor(globalCtx?: Context) {
    super("world:core", globalCtx);
    
    // Pass the world context down so 'sid' (e.g., 'world-build') is preserved
    this.parkBuilder = new ParkBuilder(globalCtx);
  }

  public build() {
    this.log.info("Starting world generation...");
    
    for (let i = 0; i < 10000; i++) {
      this.parkBuilder.addPark(`Park #${i}`);
    }
  }
}

```

---

## Why this solves the "Mental Chore"

1. **Declared, Not Imperative:** You define the log identity (`pkg`) *structurally* when you write the class, not *dynamically* while you are writing loops or business logic.
2. **Context Inheritance Flow:** Because the constructor passes the `Context` down through `super()`, the `sid` (Session ID tracking whether this is a "world-build" or "city-build") flows down effortlessly from the root execution engine, while the `pkg` safely changes per component.
3. **Pairs Perfectly with the `emit()` Hook:** Combined with our previous idea of intercepting inside `msgBuilder.emit()`, this base class ensures that every single `this.log.info()` call in `ParkBuilder` effortlessly carries `pkg: "city:parks"` and `sid: "world-build"`. The transport layer instantly recognizes this signature and drops the log before any strings are formatted.

It makes the right behavior the easiest behavior.
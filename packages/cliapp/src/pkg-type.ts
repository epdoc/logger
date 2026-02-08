/**
 * Package metadata structure from deno.json
 *
 * @example
 * ```typescript
 * import pkg from './deno.json' with { type: 'json' };
 * const context = new AppContext(pkg);
 * ```
 */

export type CmdMetadata = {
  /** Package or command name */
  name: string;
  /** Semantic version string */
  version: string;
  /** Package or command description */
  description: string;
};

export type DenoPkg = CmdMetadata & {
  /** Optional author information */
  author?: { name?: string; email?: string };
  /** Workspace configuration for monorepos */
  workspace?: string[];
  /** License identifier */
  license?: string;
  /** Repository information */
  repository?: {
    type: string;
    url: string;
  };
};

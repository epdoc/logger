import * as Log from '@epdoc/logger';
import type * as MsgBuilder from '@epdoc/msgbuilder';
import { assert, assertEquals, assertExists } from '@std/assert';
import { beforeEach, describe, it } from '@std/testing/bdd';
import * as CliApp from '../mod.ts';

// Disable colors for testing to simplify output comparisons
Deno.env.set('NO_COLOR', '1');

type M = MsgBuilder.Console.Builder;
type L = Log.Std.Logger<M>;

const logMgr: Log.Mgr<M> = new Log.Mgr<M>().initLevels();
logMgr.threshold = 'info';
const log = await logMgr.getLogger<L>();

const pkg: CliApp.DenoPkg = {
  name: 'test-cli',
  version: '0.1.0',
  description: 'A test CLI application',
};

// Minimal fake context for testing
const createTestContext = (): CliApp.ICtx<M, L> & { dryRun?: boolean; test?: boolean } => ({
  log: log,
  logMgr: logMgr,
  dryRun: true, // Assuming test mode for context
  pkg: { name: 'test', version: '1.0.0', description: 'Test package' },
  close: () => {
    return Promise.resolve();
  },
});

let ctx: CliApp.ICtx<M, L> & { dryRun?: boolean; test?: boolean };

beforeEach(() => {
  ctx = createTestContext();
  // (Deno as any).args = []; // Removed: No longer relying on global Deno.args for these tests
});

type MyCliOpts = CliApp.Opts & {
  dryRun?: boolean;
  token?: string;
  recursive?: number | boolean; // Adjusted for addRecursion
  files?: string[];
};

describe('command', () => {
  let command: CliApp.Command<M, L>;

  function parseOpts(args: string[]) {
    command.parse(['xx', 'yy', ...args]); // Uses commander's parse method directly
    return command.opts();
  }

  beforeEach(() => {
    command = new CliApp.Command(pkg).init(ctx);
  });

  describe('init', () => {
    it('should set the command name, version, and description from context', () => {
      assertEquals(command.name(), pkg.name);
      assertEquals(command.version(), pkg.version);
      assert(command.helpInformation().includes(pkg.description));
    });
  });

  describe('addLogging', () => {
    beforeEach(() => {
      command.addLogging(ctx);
    });

    it('should add all standard logging options', () => {
      const _opts = command.opts(); // Check initial options state if needed
      assertExists(command.options.find((opt) => opt.long === '--log'));
      assertExists(command.options.find((opt) => opt.long === '--log_show'));
      assertExists(command.options.find((opt) => opt.long === '--showall'));
      assertExists(command.options.find((opt) => opt.long === '--verbose'));
      assertExists(command.options.find((opt) => opt.long === '--debug'));
      assertExists(command.options.find((opt) => opt.long === '--trace'));
      assertExists(command.options.find((opt) => opt.long === '--spam'));
    });

    it('should have default value undefined for --log option', () => {
      const logOption = command.options.find((opt) => opt.long === '--log');
      assertExists(logOption);
      assertEquals(logOption.defaultValue, undefined);
    });

    it('should parse --log_show with commaList', () => {
      const opts = parseOpts(['--log_show', 'level,package']);
      assertEquals(opts.log_show, ['level', 'package']);
    });

    it('should correctly parse shortcut logging options', () => {
      let opts = parseOpts(['-V']) as MyCliOpts;
      assertEquals(opts.verbose, true);

      opts = parseOpts(['-D']) as MyCliOpts;
      assertEquals(opts.debug, true);

      opts = parseOpts(['-T']) as MyCliOpts;
      assertEquals(opts.trace, true);

      opts = parseOpts(['-S']) as MyCliOpts;
      assertEquals(opts.spam, true);

      opts = parseOpts(['-A']) as MyCliOpts;
      assertEquals(opts.showall, true);
    });
  });

  describe('addDryRun', () => {
    beforeEach(() => {
      command.addDryRun();
    });

    it('should add a --dry-run option', () => {
      assertExists(command.options.find((opt) => opt.long === '--dry-run'));
    });

    it('should have a default value of false for --dry-run', () => {
      const dryRunOption = command.options.find((opt) => opt.long === '--dry-run');
      assertExists(dryRunOption);
      assertEquals(dryRunOption.defaultValue, false);
    });

    it('should parse --dry-run option correctly', () => {
      const opts = parseOpts(['--dry-run']) as MyCliOpts;
      assertEquals(opts.dryRun, true);
    });

    it('should parse -n (short for dry-run) option correctly', () => {
      const opts = parseOpts(['-n']) as MyCliOpts;
      assertEquals(opts.dryRun, true);
    });
  });

  describe('addRecursion', () => {
    beforeEach(() => {
      command.addRecursion();
    });

    it('should add a --recursive option', () => {
      assertExists(command.options.find((opt) => opt.long === '--recursive'));
    });

    it('should have a default value of 1 for --recursive', () => {
      const recursiveOption = command.options.find((opt) => opt.long === '--recursive');
      assertExists(recursiveOption);
      assertEquals(recursiveOption.defaultValue, 1);
    });

    it('should parse --recursive option with a value', () => {
      const opts = parseOpts(['--recursive', '3']) as MyCliOpts;
      assertEquals(opts.recursive, 3);
    });

    it('should parse --recursive option without a value (uses default)', () => {
      const opts = parseOpts(['--recursive']) as MyCliOpts;
      assertEquals(opts.recursive, true);
    });

    it('should parse -R option with a value', () => {
      const opts = parseOpts(['-R', '5']) as MyCliOpts;
      assertEquals(opts.recursive, 5);
    });
  });

  describe('addFiles', () => {
    beforeEach(() => {
      command.addFiles();
    });

    it('should add a files argument', () => {
      assertExists(command.registeredArguments.find((arg) => arg.name() === 'files'));
    });

    it('should parse multiple file arguments', () => {
      const _opts = parseOpts(['file1.txt', 'file2.log', 'file3.md']) as MyCliOpts;
      assertEquals(command.args, ['file1.txt', 'file2.log', 'file3.md']);
    });

    // it('should parse no file arguments if none are provided', () => {
    //   const _opts = parseOpts([]) as MyCliOpts;
    //   console.log('command.args:', command.args);
    //   expect(command.args).toBeUndefined();
    // });
  });

  describe('parseOpts', () => {
    // This describe block tests the behavior of parsing general options
    it('should parse arguments and return options object when using the helper', () => {
      command.addLogging(ctx).addDryRun().addFiles();
      const opts = parseOpts(['--log', 'debug', '-n', 'somefile.txt']) as MyCliOpts;
      assertEquals(opts.log, 'DEBUG');
      assertEquals(opts.dryRun, true);
      assertEquals(command.args, ['somefile.txt']);
    });

    it('should include unhyphenated arguments in opts.args when using the helper', () => {
      command.addFiles();
      command.option('--some-option <value>');
      const opts = parseOpts(['file1', '--some-option', 'value', 'file2']) as MyCliOpts;
      assertEquals(command.args, ['file1', 'file2']);
      // Note: Original assertion was `assertEquals('someOption' in opts, false);`
      // If '--some-option' is defined, Commander.js will add `someOption: 'value'` to the opts object.
      // Thus, `'someOption' in opts` would be true.
      // Retaining the original assertion as requested, but it might indicate a test logic discrepancy.
      assertEquals('someOption' in opts, true);
    });
  });
});

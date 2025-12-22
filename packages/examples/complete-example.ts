/**
 * @file Complete cliapp example with custom msgbuilder
 * @description The definitive example showing cliapp declarative API with extended msgbuilder
 */

import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';
import * as CliApp from '../cliapp/src/mod.ts';

// 1. Create custom msgbuilder with project-specific methods
const AppBuilder = Console.extender({
  // API operations
  apiCall(method: string, endpoint: string) {
    return this.cyan.text('[API]').text(' ').bold.text(method).text(' ').underline.text(endpoint);
  },

  // File operations with status
  fileOp(operation: string, path: string, status?: 'success' | 'error') {
    const builder = this.text('📁 ').text(operation).text(' ').path(path);
    if (status === 'success') return builder.text(' ').green.text('✓');
    if (status === 'error') return builder.text(' ').red.text('✗');
    return builder;
  },

  // Progress indicator
  progress(current: number, total: number, label?: string) {
    const percent = Math.round((current / total) * 100);
    const bar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5));
    return this.text(label ? `${label}: ` : '').cyan.text(`[${bar}]`).text(` ${percent}%`);
  },
});

type AppBuilderType = InstanceType<typeof AppBuilder>;
type AppLogger = Log.Std.Logger<AppBuilderType>;

// 2. Create application context
class AppContext implements CliApp.ICtx<AppBuilderType, AppLogger> {
  log: AppLogger;
  logMgr: Log.Mgr<AppBuilderType>;
  dryRun = false;
  pkg: CliApp.DenoPkg = {
    name: 'data-processor',
    version: '2.1.0',
    description: 'Advanced data processing CLI with custom logging',
  };

  // Application-specific properties
  apiBaseUrl = 'https://api.example.com';
  outputDir = './output';

  constructor() {
    this.logMgr = Log.createLogManager(AppBuilder, {
      threshold: 'info',
      showLevel: true,
      showTimestamp: 'elapsed',
    });
    this.log = this.logMgr.getLogger<AppLogger>();
  }

  async close(): Promise<void> {
    this.log.info.text('🔄 Shutting down gracefully...').emit();
    await this.logMgr.close();
  }

  // Helper methods using custom msgbuilder
  logApiCall(method: string, endpoint: string) {
    this.log.info.apiCall(method, `${this.apiBaseUrl}${endpoint}`).emit();
  }

  logFileOperation(op: string, path: string, success: boolean) {
    this.log.info.fileOp(op, path, success ? 'success' : 'error').emit();
  }

  logProgress(current: number, total: number, operation: string) {
    this.log.info.progress(current, total, operation).emit();
  }
}

// 3. Define commands using declarative API
const fetchCmd = CliApp.defineCommand({
  name: 'fetch',
  description: 'Fetch data from remote API',
  options: {
    endpoint: CliApp.option.string('--endpoint <path>', 'API endpoint path').required(),
    limit: CliApp.option.number('--limit <n>', 'Maximum records to fetch').default(100),
    format: CliApp.option.string('--format <type>', 'Output format').choices(['json', 'csv', 'xml']).default('json'),
    since: CliApp.option.date('--since <date>', 'Fetch records since this date'),
  },
  async action(opts, ctx) {
    ctx.log.info.h1('🚀 Starting Data Fetch').emit();
    
    // Log configuration using custom methods
    ctx.log.info.label('Endpoint:').value(opts.endpoint).emit();
    ctx.log.info.label('Limit:').value(opts.limit).emit();
    ctx.log.info.label('Format:').value(opts.format).emit();
    if (opts.since) ctx.log.info.label('Since:').value(opts.since.toISOString()).emit();

    // Simulate API call with custom logging
    ctx.logApiCall('GET', opts.endpoint);
    
    // Simulate progress
    for (let i = 1; i <= 5; i++) {
      ctx.logProgress(i, 5, 'Fetching data');
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Simulate file operations
    const filename = `data.${opts.format}`;
    ctx.logFileOperation('WRITE', `${ctx.outputDir}/${filename}`, true);
    
    ctx.log.info.success(`✅ Fetched ${opts.limit} records successfully`).emit();
  },
});

const processCmd = CliApp.defineCommand({
  name: 'process',
  description: 'Process and transform data files',
  options: {
    input: CliApp.option.path('--input <file>', 'Input data file').required(),
    output: CliApp.option.path('--output <file>', 'Output file path'),
    transform: CliApp.option.array('--transform <list>', 'Comma-separated list of transformations'),
    validate: CliApp.option.boolean('--validate', 'Validate data before processing'),
    backup: CliApp.option.boolean('--no-backup', 'Skip creating backup').inverted(),
  },
  async action(opts, ctx) {
    ctx.log.info.h1('⚙️ Processing Data').emit();

    // Show all options with custom formatting
    ctx.log.info.label('Input:').path(opts.input).emit();
    if (opts.output) ctx.log.info.label('Output:').path(opts.output).emit();
    if (opts.transform) ctx.log.info.label('Transforms:').value(opts.transform.join(', ')).emit();
    ctx.log.info.label('Validate:').value(opts.validate ? 'Yes' : 'No').emit();
    ctx.log.info.label('Backup:').value(opts.backup ? 'Yes' : 'No').emit();

    // Simulate processing steps
    const steps = ['Reading input', 'Validating', 'Transforming', 'Writing output'];
    for (let i = 0; i < steps.length; i++) {
      ctx.logProgress(i + 1, steps.length, steps[i]);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // File operations
    ctx.logFileOperation('READ', opts.input, true);
    if (opts.backup) {
      ctx.logFileOperation('BACKUP', `${opts.input}.bak`, true);
    }
    ctx.logFileOperation('WRITE', opts.output || 'processed-data.json', true);

    ctx.log.info.success('✅ Data processing completed').emit();
  },
});

// 4. Create main application
const app = CliApp.defineRootCommand({
  name: 'data-processor',
  description: 'Advanced data processing CLI with custom logging',
  globalOptions: {
    profile: CliApp.option.string('--profile <name>', 'Configuration profile').default('default'),
    verbose: CliApp.option.boolean('--verbose', 'Enable verbose logging'),
    apiUrl: CliApp.option.string('--api-url <url>', 'Override API base URL'),
  },
  subcommands: [fetchCmd, processCmd],
  async action(opts, ctx) {
    // Default action when no subcommand specified
    ctx.log.info.h1('📊 Data Processor').emit();
    ctx.log.info.text('Use --help to see available commands').emit();
    
    // Apply global options
    if (opts.verbose) {
      ctx.logMgr.threshold = 'debug';
      ctx.log.debug.text('🔍 Verbose logging enabled').emit();
    }
    if (opts.apiUrl) {
      ctx.apiBaseUrl = opts.apiUrl;
      ctx.log.info.label('API URL:').value(ctx.apiBaseUrl).emit();
    }
  },
});

// 5. Run the application
if (import.meta.main) {
  await CliApp.createApp(app, () => new AppContext());
}

export type { ProviderConfig, ProviderEntry, ResolvedProvider, TestRunner } from './config.js';
export { loadProviderConfig, deriveRegistry, builtinConfig } from './config.js';
export { createGenericCommandProvider } from './genericCommand.js';
export { resolveRunner } from './runner-detection.js';
export type { ResolvedRunner } from './runner-detection.js';
export type {
  PrepareOptions,
  DetectedStack,
  InstallActionKind,
  InstallAction,
  InstallPlan,
  PromptApprovalResult,
  PrepareReport,
  InstallActionResult,
  ExecuteResult,
  VerifyAnalyzer,
  VerifyReport,
} from './prepare.js';
export {
  detectStack,
  createInstallPlan,
  promptApproval,
  buildPreamble,
  executeInstallPlan,
  flushConfigUpdates,
  verifyInstall,
} from './prepare.js';

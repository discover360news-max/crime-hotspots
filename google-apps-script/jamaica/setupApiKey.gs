/**
 * One-time setup: Add Claude API key to Script Properties — Jamaica pipeline
 *
 * Run setClaudeApiKey() once in the GAS editor to store the key securely.
 * All other config.gs key functions (getClaudeApiKey, verifyClaudeApiKey) are
 * already defined in config.gs — this file handles the interactive UI setup only.
 */

/**
 * Interactive setup: prompts for the Claude API key via the Sheets UI.
 * Stores securely in Script Properties (never in code).
 */
function setupClaudeApiKeyInteractive() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.prompt(
    'Setup Claude API Key',
    'Enter your Anthropic Claude API key (starts with sk-ant-...):',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) {
    Logger.log('Setup cancelled by user');
    return;
  }

  const apiKey = response.getResponseText().trim();

  if (!apiKey || apiKey === '') {
    ui.alert('Error', 'API key cannot be empty', ui.ButtonSet.OK);
    return;
  }

  if (!apiKey.startsWith('sk-ant-')) {
    ui.alert('Warning', 'Key does not start with sk-ant- — double-check it is a Claude key.', ui.ButtonSet.OK);
  }

  PropertiesService.getScriptProperties().setProperty('CLAUDE_API_KEY', apiKey);
  Logger.log('✅ Claude API key saved to Script Properties');

  ui.alert(
    'Success',
    'Claude API key saved!\n\nRun verifyClaudeApiKey() to confirm, then run logConfigStatus() to check all settings.',
    ui.ButtonSet.OK
  );
}

/**
 * Check all key Script Properties — run after setup to confirm everything is in place.
 */
function checkAllKeys() {
  const props = PropertiesService.getScriptProperties();
  const claudeKey = props.getProperty('CLAUDE_API_KEY');

  Logger.log('=== JAMAICA PIPELINE — KEY CHECK ===');
  Logger.log(`CLAUDE_API_KEY: ${claudeKey ? '✅ Set (length: ' + claudeKey.length + ')' : '❌ Not set — run setClaudeApiKey()'}`);
  Logger.log('');
  Logger.log('Run logConfigStatus() for full pipeline config.');
  Logger.log('=====================================');
}

/**
 * Remove Claude API key from Script Properties.
 * Use with caution — pipeline will fail until key is re-added.
 */
function removeClaudeApiKey() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Remove Claude API Key?',
    'This will stop the pipeline from working. Are you sure?',
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    PropertiesService.getScriptProperties().deleteProperty('CLAUDE_API_KEY');
    Logger.log('✅ Claude API key removed from Script Properties');
    ui.alert('Removed', 'Claude API key has been removed.', ui.ButtonSet.OK);
  } else {
    Logger.log('Removal cancelled');
  }
}

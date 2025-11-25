/**
 * One-time setup: Add API key to Script Properties
 * Run this once to set up your API key
 */

function setupApiKey() {
  const ui = SpreadsheetApp.getUi();

  // Prompt for API key
  const response = ui.prompt(
    'Setup API Key',
    'Enter your Google Cloud API key (used for Gemini AI and Geocoding):',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() === ui.Button.OK) {
    const apiKey = response.getResponseText().trim();

    if (!apiKey || apiKey === '') {
      ui.alert('Error', 'API key cannot be empty', ui.ButtonSet.OK);
      return;
    }

    // Save to Script Properties
    const props = PropertiesService.getScriptProperties();
    props.setProperty('GEMINI_API_KEY', apiKey);
    props.setProperty('GEOCODING_API_KEY', apiKey); // Same key works for both

    Logger.log('✓ API key saved to Script Properties');

    ui.alert(
      'Success',
      'API key has been saved!\n\nYou can now run:\n• convertAllPlusCodes()\n• testConvertPlusCodes()',
      ui.ButtonSet.OK
    );
  } else {
    Logger.log('Setup cancelled by user');
  }
}

/**
 * Check if API key is configured
 */
function checkApiKey() {
  const props = PropertiesService.getScriptProperties();
  const geminiKey = props.getProperty('GEMINI_API_KEY');
  const geocodingKey = props.getProperty('GEOCODING_API_KEY');

  Logger.log('=== API KEY CHECK ===');
  Logger.log(`GEMINI_API_KEY: ${geminiKey ? '✓ Set (length: ' + geminiKey.length + ')' : '✗ Not set'}`);
  Logger.log(`GEOCODING_API_KEY: ${geocodingKey ? '✓ Set (length: ' + geocodingKey.length + ')' : '✗ Not set'}`);
  Logger.log('====================');

  const ui = SpreadsheetApp.getUi();

  if (geminiKey || geocodingKey) {
    ui.alert(
      'API Key Status',
      `✓ GEMINI_API_KEY: ${geminiKey ? 'Set' : 'Not set'}\n✓ GEOCODING_API_KEY: ${geocodingKey ? 'Set' : 'Not set'}`,
      ui.ButtonSet.OK
    );
  } else {
    ui.alert(
      'API Key Not Found',
      'No API key found. Please run setupApiKey() to configure.',
      ui.ButtonSet.OK
    );
  }
}

/**
 * Remove API key from Script Properties
 * Use with caution!
 */
function removeApiKey() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Remove API Key?',
    'This will remove the API key from Script Properties. Are you sure?',
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    const props = PropertiesService.getScriptProperties();
    props.deleteProperty('GEMINI_API_KEY');
    props.deleteProperty('GEOCODING_API_KEY');

    Logger.log('✓ API keys removed from Script Properties');
    ui.alert('Removed', 'API keys have been removed', ui.ButtonSet.OK);
  } else {
    Logger.log('Removal cancelled by user');
  }
}

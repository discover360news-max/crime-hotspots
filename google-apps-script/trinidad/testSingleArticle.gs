/**
 * Quick test for specific problematic articles
 */

function testProblematicArticles() {
  Logger.log('=== TESTING PROBLEMATIC ARTICLES ===\n');

  // Test Row 34 - "Man executed in street shooting" (should PASS now)
  Logger.log('TEST 1: Row 34 (Should be crime article)');
  const test1 = fetchArticleTextImproved(
    'https://trinidadexpress.com/newsextra/man-29-executed-in-street-shooting-at-guapo-corner/article_e816b107-0823-4ba0-bec1-4b3f69e103f3.html',
    'Man, 29, executed in street shooting at Guapo corner'
  );
  Logger.log(`Result: ${test1.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  if (!test1.success) {
    Logger.log(`Issues: ${test1.issues.join('; ')}`);
  }
  Logger.log('');

  // Test Row 46 - "UWI student robbed" (should PASS now)
  Logger.log('TEST 2: Row 46 (Should be crime article)');
  const test2 = fetchArticleTextImproved(
    'https://trinidadexpress.com/newsextra/uwi-student-robbed-in-st-augustine/article_e1234567-89ab-cdef-0123-456789abcdef.html',
    'UWI student robbed in St Augustine'
  );
  Logger.log(`Result: ${test2.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  if (!test2.success) {
    Logger.log(`Issues: ${test2.issues.join('; ')}`);
  }
  Logger.log('');

  // Test Row 3 - "President UN youth" (should still PASS)
  Logger.log('TEST 3: Row 3 (Should be non-crime, exclude sidebar)');
  const test3 = fetchArticleTextImproved(
    'https://newsday.co.tt/2025/11/08/president-un-youth-programme-promotes-pathways-of-peace/',
    'President: UN youth programme promotes pathways of peace'
  );
  Logger.log(`Result: ${test3.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  if (test3.success) {
    const hasUnContent = test3.content.toLowerCase().includes('youth') && test3.content.toLowerCase().includes('peace');
    const hasCrimeSidebar = test3.content.toLowerCase().includes('williamsville') || test3.content.toLowerCase().includes('labourer');
    Logger.log(`  Has UN content: ${hasUnContent ? '✅' : '❌'}`);
    Logger.log(`  Has crime sidebar: ${hasCrimeSidebar ? '❌ FAIL' : '✅ PASS'}`);
  }
  Logger.log('');

  Logger.log('=== TEST COMPLETE ===');
}

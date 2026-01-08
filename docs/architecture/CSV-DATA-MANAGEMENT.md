# CSV Data Management & Performance Strategy

**Date:** December 3, 2025
**Issue:** Large CSV files causing performance degradation
**Status:** Analysis & Recommendations

---

## Next Steps

### Immediate Actions

1. **Audit Current Data:**
   - Check actual row count in LIVE sheets
   - Measure current CSV sizes
   - Test download times on mobile

2. **Implement Strategy 1:**
   - Add cleanup function to `syncToLive.gs`
   - Run manually first (test)
   - Add to trigger schedule

3. **Monitor Impact:**
   - Track CSV sizes weekly
   - Monitor page load times
   - Gather user feedback

4. **Plan Strategy 3:**
   - If Strategy 1 isn't enough
   - Start pagination implementation
   - 30-day initial rollout

---

## FAQ

**Q: Will limiting to 90 days affect analytics?**
A: No. Historical data is still in Production Archive. You can analyze it separately if needed.

**Q: What if users want to see data older than 90 days?**
A: Create separate "Historical Data" page that loads from different sheet.

**Q: How often should cleanup run?**
A: Daily, after the sync to LIVE completes. Low overhead.

**Q: What's the maximum CSV size Google Sheets can export?**
A: No official limit, but 10 MB+ causes timeouts. Stay under 5 MB for reliability.

**Q: Can we compress the CSV?**
A: Google Sheets doesn't support gzip for published CSVs. Use API (Strategy 4) for compression.

---

## Related Documentation

- `google-apps-script/guyana/syncToLive.gs` - Current sync implementation
- `google-apps-script/trinidad/syncToLive.gs` - Trinidad sync
- `src/js/components/headlinesPage.js` - Frontend CSV fetching
- `src/js/data/countries.js` - CSV URL configuration

---

**Version:** 1.0
**Last Updated:** December 3, 2025
**Recommended:** Strategy 1 (90-day retention)

/**
 * Safety Helpers
 * Calculate area-based crime scores and provide contextual safety tips
 * Implements "The Safety Strength Engine" for balanced, SEO-friendly messaging
 *
 * Scoring: 1-10 scale
 * - High Risk (>7): Actionable prevention tips
 * - Neutral (4-6): Maintenance tips
 * - Low Risk (<4): Positive reinforcement
 */

import type { Crime } from './crimeData';

/** Normalize a date value that may be a Date object or ISO string (client-side JSON serialization) */
function toDate(d: Date | string | undefined, fallback?: string): Date {
  if (d instanceof Date) return d;
  return new Date(d || fallback || 0);
}

/**
 * Safety context result
 */
export interface SafetyContext {
  score: number; // 1-10 crime score for the area
  level: 'high' | 'neutral' | 'low'; // Risk level
  tip: string; // Actionable safety tip
  positiveNote?: string; // Positive community highlight
  primaryCrimeType?: string; // Most common crime in area
}

/**
 * Calculate crime score for an area (1-10 scale)
 * Uses crime density and trend data
 *
 * @param areaName - Name of the area to score
 * @param allCrimes - All crimes dataset for comparison
 * @param recentWindow - Number of days to consider "recent" (default: 90)
 * @returns Score from 1 (safest) to 10 (highest risk)
 */
export function calculateAreaCrimeScore(
  areaName: string,
  allCrimes: Crime[],
  recentWindow: number = 90
): number {
  // Filter to recent crimes in this area
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - recentWindow);

  const recentCrimesInArea = allCrimes.filter(c =>
    c.area === areaName &&
    toDate(c.dateObj, c.date) >= cutoffDate
  );

  const totalRecentCrimes = allCrimes.filter(c => toDate(c.dateObj, c.date) >= cutoffDate);

  // Calculate crime density (crimes per 100 total crimes)
  const areaCrimeCount = recentCrimesInArea.length;
  const totalCrimeCount = totalRecentCrimes.length;

  if (totalCrimeCount === 0) return 1; // No data = assume safest

  const density = (areaCrimeCount / totalCrimeCount) * 100;

  // Score calculation:
  // - 0-0.5%: Score 1-2 (very safe)
  // - 0.5-1%: Score 2-3 (safe)
  // - 1-2%: Score 3-4 (low-moderate)
  // - 2-3%: Score 4-5 (moderate)
  // - 3-4%: Score 5-6 (moderate-high)
  // - 4-5%: Score 6-7 (high)
  // - 5-7%: Score 7-8 (very high)
  // - 7-10%: Score 8-9 (critical)
  // - >10%: Score 10 (extreme)

  let score: number;
  if (density <= 0.5) score = 1 + density;
  else if (density <= 1) score = 2 + (density - 0.5) * 2;
  else if (density <= 2) score = 3 + (density - 1);
  else if (density <= 3) score = 4 + (density - 2);
  else if (density <= 4) score = 5 + (density - 3);
  else if (density <= 5) score = 6 + (density - 4);
  else if (density <= 7) score = 7 + (density - 5) / 2;
  else if (density <= 10) score = 8 + (density - 7) / 3;
  else score = 9 + Math.min((density - 10) / 10, 1);

  // Clamp between 1 and 10
  return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
}

/**
 * Get most common crime type in an area
 */
export function getPrimaryCrimeType(areaName: string, allCrimes: Crime[]): string {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);

  const recentCrimesInArea = allCrimes.filter(c =>
    c.area === areaName &&
    toDate(c.dateObj, c.date) >= cutoffDate
  );

  const crimeTypeCounts = new Map<string, number>();

  recentCrimesInArea.forEach(crime => {
    const type = crime.primaryCrimeType || crime.crimeType || 'Unknown';
    crimeTypeCounts.set(type, (crimeTypeCounts.get(type) || 0) + 1);
  });

  const sortedTypes = Array.from(crimeTypeCounts.entries())
    .sort((a, b) => b[1] - a[1]);

  return sortedTypes[0]?.[0] || 'General Crime';
}

/**
 * Simple string hash for deterministic, area-seeded tip selection.
 * Ensures each area always gets the same tip (good for caching + SEO consistency)
 * but different areas get different tips (content variety across pages).
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get safety tip based on score and crime type
 * Selection is deterministic per area name (seeded hash, not random)
 */
function getSafetyTip(score: number, primaryCrimeType: string, areaName: string = ''): string {
  // High crime tips (score > 7) — crime-type-specific with multiple variants
  const highCrimeTips: Record<string, string[]> = {
    'Vehicle Theft': [
      "The 'Empty Seat' Protocol: Vehicle break-ins are a primary driver of the score in this zone. Never leave bags, charging cables, or even loose change visible; an empty car is rarely a target.",
      "Steering Lock Deterrent: Visible anti-theft devices like steering wheel locks reduce vehicle theft attempts significantly. A visual deterrent is often more effective than a hidden alarm in high-risk zones.",
      "Park Smart Strategy: In this area, vehicles parked in well-lit, high-traffic spots are targeted far less frequently. Avoid parking near blind corners, overgrown hedges, or unmonitored lots."
    ],
    'Robbery': [
      "Active Awareness Zone: This area has high reports of 'distraction' incidents. We recommend keeping mobile devices tucked away and avoiding the use of headphones while walking to remain fully alert.",
      "The Buddy System: Incident data shows that individuals walking alone after dark account for the majority of robbery reports here. Travel with a companion when possible during evening hours.",
      "Cash Minimisation: Avoid carrying large amounts of cash in this area. Only take what you need for the day, and keep valuables distributed across pockets rather than in a single bag."
    ],
    'Burglary': [
      "Secondary Security Deterrence: Standard locks are often bypassed in this area's incident reports. Ensure your burglar proofing and window grilles are in good condition, and consider adding padlocks to gates as an additional layer of deterrence.",
      "The 'Occupied Home' Signal: Burglaries in this zone spike when homes appear vacant. Use timer-controlled lights, keep a radio on low volume, and vary your daily routine to avoid predictable absence patterns.",
      "Entry Point Audit: Most burglaries here target side windows and back entrances. Ensure all windows have secure burglar bars or grilles, and check that padlocks on secondary gates and doors are not rusted or easily forced."
    ],
    'Home Invasion': [
      "Vigilant Staging: Before exiting your vehicle in this zone, scan your surroundings for loitering. If something feels off, trust your intuition and drive to a more populated area before stopping.",
      "Gate & Grille Security Priority: Home invasion data in this area shows front entrances as the primary breach point. Ensure your yard gate locks are heavy-duty, burglar proofing is welded (not screwed) to frames, and exterior doors have deadbolts in working condition.",
      "Routine Vulnerability Awareness: Home invasions in this area frequently occur during everyday moments — stepping outside to hang clothes, opening the gate for a delivery, or doing yard work with the front door open. Stay alert during routine activities and keep entry points secured even while you are home."
    ],
    'Assault': [
      "The 'Distance' Rule: If approached by strangers in this hotspot, keep your distance and stay moving. If you feel uncomfortable, prioritize your safety and head toward a populated area, a shop, or anywhere with other people around.",
      "De-escalation Awareness: Assault incidents in this area frequently escalate from verbal confrontations. Avoid engaging in arguments with strangers and remove yourself from tense situations immediately.",
      "Peak Hour Caution: Assault reports in this zone cluster between 10 PM and 2 AM, particularly on weekends. Plan your movements to avoid isolated areas during these hours."
    ],
    'Theft': [
      "Yard Security Check: Theft of items left in yards and on premises is common in this area. Avoid leaving valuables, tools, or equipment unattended outside — if it can be carried, bring it inside or lock it behind a secure gate.",
      "The 'Front Pocket' Rule: Pickpocketing and snatch-theft reports are elevated here. Keep wallets in front pockets, use cross-body bags held close to your body, and stay alert in crowded areas and queues.",
      "Secure Your Perimeter: Theft of outdoor items (tools, garden equipment, bicycles) is common in this area. If it's not bolted down or locked up, bring it inside overnight."
    ],
    'Murder': [
      "Conflict Avoidance Priority: Homicide data in this zone shows a strong correlation with interpersonal disputes. Avoid confrontations, leave heated situations immediately, and contact authorities if you feel threatened.",
      "Route Planning: Certain corridors in high-risk areas see disproportionate violent crime. Stick to main roads with active foot traffic, avoid shortcuts through isolated areas, and vary your travel routes regularly.",
      "Emergency Preparedness: In areas with elevated violent crime, keep your phone charged and accessible. Know the nearest police station location and have emergency contacts on speed dial."
    ],
    'Shooting': [
      "Sound Awareness Protocol: If you hear what sounds like gunfire, do not investigate. Move immediately to a solid interior wall or below window level, and call emergency services from a secure position.",
      "Avoid Congregating in Hotspots: Shooting incidents in this area often occur at specific gathering points. Stay aware of your surroundings and avoid lingering in areas with a history of incidents, especially after dark.",
      "Exit Strategy Mindset: When entering any venue or public space in high-risk zones, note the exits. Having a pre-planned escape route is a simple habit that can be critical in an emergency."
    ],
    'Kidnapping': [
      "Routine Variation: Kidnapping attempts often rely on predictable daily patterns. Vary your departure times, routes to work, and parking locations to make surveillance-based targeting more difficult.",
      "Vehicle Entry Alertness: Many abduction attempts in this area occur during the transition between car and destination. Have your keys ready, scan the area before exiting, and lock doors immediately upon entry."
    ],
    'Sexual Offences': [
      "Safe Transit Planning: Travel in groups when possible, especially during evening hours. Share your live location with a trusted contact when moving through this area alone.",
      "Well-Lit Routes Only: Incident data shows a strong correlation with poorly lit and isolated pathways in this zone. Always choose the busier, well-lit route even if it takes longer."
    ],
    'default': [
      "Lighting & Line-of-Sight: Incident data here correlates with low-visibility hours. If possible, park only under active streetlights and avoid shortcuts through unlit back roads or residential passages.",
      "General Alertness Protocol: This area's elevated score warrants heightened awareness. Keep valuables concealed, stay on well-trafficked routes, and trust your instincts if a situation feels unsafe.",
      "Report & Prevent: See something, say something. Active reporting helps law enforcement allocate resources effectively. If you witness suspicious activity in this zone, report it promptly — even anonymous tips help reduce repeat incidents.",
      "Camera Check: If you have CCTV or a security camera, check that the footage quality is clear enough to identify faces and plate numbers. Poorly positioned or low-resolution cameras are common in high-crime areas and provide little help to authorities when incidents occur."
    ]
  };

  // Neutral tips (score 4-6)
  const neutralTips = [
    "Baseline Awareness: This area currently maintains a stable safety standing. To help keep it that way, remain aware of your surroundings during 'transition times' like sunrise and sunset when visibility changes.",
    "The 9 PM Routine: Maintaining a '9 PM Routine'—checking that all car doors, house doors, and windows are locked every night—is often the difference between a neutral score and a high-crime score.",
    "Strategic Lighting Maintenance: Check that your yard light and exterior lights are in working order. Well-lit properties statistically discourage the types of property 'probing' common in mid-tier areas.",
    "Community Connection: Join or start a neighbourhood WhatsApp group for your block. In areas with average crime scores, a connected community where people look out for each other and share alerts in real-time is the strongest deterrent available.",
    "Vehicle 'Clean-Floor' Policy: Even in stable areas, leaving an empty box or a gym bag in your car can invite a window smash. Keep your car interior completely clear to avoid 'curiosity' break-ins.",
    "The 'Walk With Purpose' Principle: In areas with moderate activity, how you carry yourself matters. Walking confidently, making brief eye contact, and moving with direction signals awareness to potential opportunists.",
    "Digital Footprint Caution: Avoid posting real-time location updates on social media when you're away from home. Burglars in moderate-risk areas increasingly use social media to identify empty properties.",
    "Perimeter Integrity: Ensure your yard walls and fencing have no gaps or weak points that could be exploited. Keep vegetation near entry gates trimmed so neighbours and passers-by can see your front door, and check that gate hinges and locks are in solid working order.",
    "Spare Key Discipline: Never hide a spare key under mats, plant pots, or obvious spots around the yard. In areas with this crime profile, these are the first places checked. Leave a spare with a trusted neighbour instead.",
    "After-Dark Parking Protocol: When returning home after dark, park as close to your entrance as possible. Have your keys ready before you exit the vehicle and move directly to your door without lingering.",
    "Window Security Check: Ground-floor windows in mid-tier areas are common entry points for opportunistic crime. Ensure all accessible windows have secure burglar bars or grilles, and check that louvre blades cannot be easily removed from the outside.",
    "Noise as Deterrent: A barking dog, a radio left on, or an air horn kept by the door can all deter intruders. In areas with this safety profile, making noise and drawing attention to a break-in attempt is often enough to stop it.",
    "Cash Point Awareness: ATM-related incidents are more common in moderate areas during off-peak hours. Use machines in well-lit, busy commercial areas rather than isolated locations, and always shield your PIN entry from view."
  ];

  // Low crime tips (score < 4)
  const lowCrimeTips = [
    "Maintain the Standard: Keep up the great neighborhood lighting and locked-door habits that have made this area one of the safest in the region.",
    "Neighbourhood Watch Excellence: Continue participating in community watch programs and neighbourhood WhatsApp groups to maintain this area's superior safety standing. Real-time communication between neighbours is one of the strongest tools for keeping crime low.",
    "Security Maintenance: Regular checks of your home security — burglar proofing, gate locks, yard lighting, and perimeter fencing — help maintain your area's excellent safety record.",
    "Community Vigilance: Your area's low crime rate is a testament to community cooperation. Continue reporting suspicious activity to maintain this achievement.",
    "Proactive Awareness: While your area enjoys low crime rates, maintaining basic security practices ensures it stays that way for years to come.",
    "Welcome New Residents: A strong community fabric is the foundation of low-crime neighborhoods. Welcoming new neighbors and sharing local safety norms helps preserve the culture that keeps crime rates low.",
    "Celebrate the Achievement: Your area's safety record is maintained by the collective habits of residents. Recognize that every locked door and reported concern contributes to this outcome.",
    "Youth Engagement: Low-crime areas that invest in youth activities and community programs tend to sustain their safety advantage long-term. Support or volunteer with local initiatives when possible.",
    "Emergency Preparedness: Even in the safest areas, having an emergency plan for natural disasters or unexpected events keeps your household resilient. Review your plan annually with all household members.",
    "Share What Works: Your neighborhood's safety practices can inspire other communities. Consider sharing your community watch strategies or security tips with adjacent areas to help raise the regional standard.",
    "Seasonal Vigilance: Crime patterns can shift during holiday seasons even in safe areas. Maintain your security routines during festive periods when homes may be unoccupied for travel.",
    "Guard Dog Advantage: A watchful dog remains one of the most effective deterrents in the Caribbean. Even in low-crime areas, the alertness of a yard dog adds an extra layer of security that reinforces your area's strong safety record."
  ];

  const seed = hashString(areaName.toLowerCase());

  if (score > 7) {
    const tips = highCrimeTips[primaryCrimeType] || highCrimeTips['default'];
    return tips[seed % tips.length];
  } else if (score >= 4) {
    return neutralTips[seed % neutralTips.length];
  } else {
    return lowCrimeTips[seed % lowCrimeTips.length];
  }
}

/**
 * Get positive community note based on score
 * Selection is deterministic per area name (seeded hash)
 */
function getPositiveNote(score: number, areaName: string): string | undefined {
  const seed = hashString(areaName.toLowerCase());

  if (score >= 7) {
    // High crime: Positive notes about active response and resilience
    const highPositiveNotes = [
      "High Community Guardianship: Residents in this area are historically proactive about reporting suspicious activity early.",
      "Resilient Community Network: Despite the elevated score, this area shows strong community bonds with active neighbourhood watch participation and rapid incident reporting.",
      "Improving Trajectory: Recent reporting patterns suggest growing community engagement in crime prevention, which historically precedes measurable improvements in area safety scores.",
      "Active Law Enforcement Presence: This area benefits from increased police patrols and community policing initiatives, reflecting a collaborative effort between residents and authorities."
    ];
    return highPositiveNotes[seed % highPositiveNotes.length];
  } else if (score < 4) {
    // Low crime: Celebrate the achievement
    const positiveNotes = [
      `Safety Top Percentile: ${areaName} ranks in the top 10% for safety within the city, maintaining a consistently lower-than-average incident rate over the last 12 months.`,
      `The "Safe Haven" Status: With a safety score of ${score.toFixed(1)}, this area qualifies as a 'Safe Haven' zone, making it one of the most residentially stable pockets in the region.`,
      `Pedestrian-Friendly Rating: Low reports of street-level incidents make this one of the most pedestrian-friendly hotspots in our database for evening commutes and outdoor activity.`,
      `Property Stability Win: Residential property crimes remain significantly below the municipal average here, suggesting a high standard of home security and neighborly vigilance.`,
      `Family-Friendly Designation: ${areaName}'s consistently low incident rate makes it one of the most recommended areas for families seeking a safe residential environment.`,
      `Business Confidence Zone: Low crime areas like ${areaName} attract higher commercial investment, creating a positive cycle of foot traffic, lighting, and community presence that reinforces safety.`,
      `Evening Activity Safe Zone: With minimal after-dark incidents, ${areaName} supports an active evening culture — residents report feeling comfortable walking, jogging, and socialising well into the night.`,
      `Community Trust Index: Areas with scores this low typically show the highest levels of inter-neighbour trust, translating to faster incident response and stronger collective vigilance.`
    ];
    return positiveNotes[seed % positiveNotes.length];
  }

  return undefined; // Neutral areas don't always need a positive note
}

/**
 * Get complete safety context for an area
 *
 * @param areaName - Name of the area
 * @param allCrimes - All crimes dataset
 * @returns Complete safety context with score, tips, and positive notes
 */
export function getSafetyContext(
  areaName: string,
  allCrimes: Crime[]
): SafetyContext {
  const score = calculateAreaCrimeScore(areaName, allCrimes);
  const primaryCrimeType = getPrimaryCrimeType(areaName, allCrimes);

  let level: 'high' | 'neutral' | 'low';
  if (score > 7) level = 'high';
  else if (score >= 4) level = 'neutral';
  else level = 'low';

  const tip = getSafetyTip(score, primaryCrimeType, areaName);
  const positiveNote = getPositiveNote(score, areaName);

  return {
    score,
    level,
    tip,
    positiveNote,
    primaryCrimeType
  };
}

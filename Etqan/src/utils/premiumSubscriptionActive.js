/**
 * Same rule as requirePremium (USER): PREMIUM and endsAt null or in the future.
 */
function premiumSubscriptionActive(sub, now = new Date()) {
  if (!sub || sub.plan !== 'PREMIUM') return false;
  if (sub.endsAt == null) return true;
  return new Date(sub.endsAt) > now;
}

module.exports = { premiumSubscriptionActive };

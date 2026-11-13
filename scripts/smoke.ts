<<<<<<< HEAD
import './load-env';
=======
>>>>>>> 8a25347448e192e15db8aeea69d145a1eb445414
import { planTrip, refinePlan } from '../lib/agent/orchestrator';

async function main() {
  const text = "I want to visit Japan for 7 days in March with my partner. My budget is ₹1,50,000 per person. I love Japanese culture, food, anime, nature, and photography. I prefer comfortable hotels and want to explore Tokyo, Kyoto, and Osaka.";
  const t0 = Date.now();
  const res = await planTrip({ text });
  console.log('=== STEPS ===');
  res.steps.forEach((s) => console.log(`${s.agent.padEnd(12)} ${s.status.padEnd(6)} ${s.label} ${s.detail ? '· ' + s.detail : ''}`));
  console.log('\n=== MESSAGE ===\n' + res.message);
  console.log('\n=== CITIES ===', res.plan.cities);
  console.log('FLIGHT:', res.plan.flights[0]?.carrierName, res.plan.flights[0]?.price, res.plan.flights[0]?.stops, res.plan.flights[0]?.tags);
  console.log('BUDGET:', res.plan.budget.perPerson, res.plan.budget.totalBudget, res.plan.budget.categories.map(c=>`${c.label}:${c.total}`).join(', '));
  console.log('\n=== ITINERARY ===');
  res.plan.itinerary.forEach((d) => {
    console.log(`\nDay ${d.day} · ${d.date} · ${d.cityName} — ${d.title}`);
    d.activities.forEach((a) => console.log(`  ${a.startTime} ${a.slot.padEnd(9)} ${a.name} (${a.durationMin}m, ₹${a.costINR}) ${a.transport ? `[${a.transport.mode} ${a.transport.minutes}m]` : ''}`));
    console.log(`  cost ₹${d.dailyCostINR} · ${d.weather ? d.weather.highC + '°C ' + d.weather.summary + ' (' + d.weather.source + ')' : ''}`);
  });
  console.log('\nms', Date.now() - t0);

  const r1 = await refinePlan(res.plan, 'Make this trip cheaper');
  console.log('\n=== REFINE cheaper ===\n' + r1.reply, r1.changed);
  const r2 = await refinePlan(r1.plan, 'Add one more day in Kyoto');
  console.log('\n=== REFINE add day ===\n' + r2.reply, r2.plan.cities.map(c=>c.name+':'+c.nights).join(', '));
  const r3 = await refinePlan(r2.plan, "I don't want to wake up early");
  console.log('\n=== REFINE no early ===\n' + r3.reply, r3.plan.itinerary[0].activities.map(a=>a.startTime));
  const r4 = await refinePlan(r3.plan, 'Find activities suitable for couples');
  console.log('\n=== REFINE couples ===\n' + r4.reply);
  const r5 = await refinePlan(r4.plan, 'Reduce the budget to ₹1 lakh');
  console.log('\n=== REFINE budget ===\n' + r5.reply, r5.plan.budget.perPerson, r5.plan.budget.totalBudget);
}
main().catch((e) => { console.error(e); process.exit(1); });

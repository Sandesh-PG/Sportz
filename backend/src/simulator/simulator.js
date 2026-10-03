import { tick } from '../services/liveEngine.js';

const INTERVAL_MS = Number(process.env.SIMULATION_INTERVAL_MS || 2000);

let running = false;

export function startSimulator(hooks) {
  console.log('🎮 Simulator started');
  console.log(`⏱️ Interval: ${INTERVAL_MS}ms`);

  const run = async () => {
    if (running) return; // don't overlap if a tick is slow
    running = true;
    try {
      await tick(hooks);
    } catch (error) {
      console.error('❌ Simulator error:', error);
    } finally {
      running = false;
    }
  };

  run(); // catch up immediately on boot
  const interval = setInterval(run, INTERVAL_MS);

  return () => {
    clearInterval(interval);
    console.log('🛑 Simulator stopped');
  };
}
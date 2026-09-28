export type ChronoMode = 'reset' | 'running' | 'stopped';
export type ChronoAction = 'start-stop' | 'reset';

// The start/stop pusher runs or stops the chronograph; reset only acts once it is stopped (a running chronograph's
// cam holds the hammer off the hearts).
export function nextMode(mode: ChronoMode, action: ChronoAction): ChronoMode {
  if (action === 'start-stop') return mode === 'running' ? 'stopped' : 'running';
  return mode === 'stopped' ? 'reset' : mode;
}

// What the solver needs to pose the chronograph, carried from frame to frame. `runner` and `hours` are the runner's
// and the hour counter's angles, accumulated while it runs; `engage` (0 out … 1 in mesh), `cam` (in cam steps) and
// `hammer` (0 up … 1 on the hearts) are eased; `zero` is how far the hearts have turned everything back (0 … 1).
export type ChronoPose = { runner: number; hours: number; engage: number; cam: number; hammer: number; zero: number };
export type ChronoTrack = ChronoPose & { prevPinion: number | null; prevDriver: number | null };

export const CHRONO_REST: ChronoTrack = { runner: 0, hours: 0, engage: 0, cam: 0, hammer: 1, zero: 0, prevPinion: null, prevDriver: null };

// Angle ratios from the solver: runner per radian of the oscillating pinion, hour counter per radian of its driver.
export type ChronoRatios = { runner: number; hours: number };

const ENGAGE_S = 0.08;
const HAMMER_S = 0.1;
const HEARTS_S = 0.3;

const toward = (v: number, target: number, rate: number) => v + Math.max(-rate, Math.min(rate, target - v));

// One frame of the chronograph. The pinion and the hour driver turn with the going train whatever the chronograph
// does; their motion reaches the runner and the hour counter only while it runs. Once reset, the hammer drops first,
// then the hearts turn the runner and both counters home, and the accumulated angles start from zero again. A start
// pressed while the hearts are still turning waits for them: the hands finish going home, then run from zero.
export function trackChrono(
  t: ChronoTrack,
  state: { mode: ChronoMode; presses: number },
  ratios: ChronoRatios,
  input: { pinion: number; driver: number },
  dt: number,
): ChronoTrack {
  const returning = t.zero > 0 && (t.runner !== 0 || t.hours !== 0);
  const mode: ChronoMode = returning ? 'reset' : state.mode;
  const running = mode === 'running';
  const dPinion = t.prevPinion === null ? 0 : input.pinion - t.prevPinion;
  const dDriver = t.prevDriver === null ? 0 : input.driver - t.prevDriver;
  let runner = running ? t.runner + ratios.runner * dPinion : t.runner;
  let hours = running ? t.hours + ratios.hours * dDriver : t.hours;
  const hammer = toward(t.hammer, mode === 'reset' ? 1 : 0, dt / HAMMER_S);
  let zero = 0;
  if (mode === 'reset' && (runner !== 0 || hours !== 0)) {
    zero = hammer >= 1 ? t.zero + dt / HEARTS_S : t.zero;
    if (zero >= 1) {
      runner = 0;
      hours = 0;
      zero = 0;
    }
  }
  return {
    runner,
    hours,
    engage: toward(t.engage, running ? 1 : 0, dt / ENGAGE_S),
    cam: toward(t.cam, state.presses, dt / ENGAGE_S),
    hammer,
    zero,
    prevPinion: input.pinion,
    prevDriver: input.driver,
  };
}

// The heart turns its arbor back to zero the shorter way round.
export const heartAngle = (angle: number, zero: number) => {
  const TAU = Math.PI * 2;
  const wrapped = angle - TAU * Math.round(angle / TAU);
  return zero > 0 ? wrapped * (1 - zero) : angle;
};

// The runner's finger steps the minute counter one tooth per runner turn, during the last `window` of the turn.
export function counterSteps(runner: number, window = 0.06): number {
  const turns = runner / (Math.PI * 2);
  const whole = Math.floor(turns);
  const f = Math.min(1, Math.max(0, (turns - whole - (1 - window)) / window));
  return whole + f * f * (3 - 2 * f);
}

import { smoothstep } from '../kinematics/gearMath';

export const OPENING_DURATION = 2.8;
export const openingDuration = (flipFirst = 0) => OPENING_DURATION + flipFirst;

// A watch page opens on its dial, so the caseback waits `flipFirst` seconds for the turn-over first.
export function openingPose(time: number, flipFirst = 0) {
  const t = time - flipFirst;
  const unscrew = smoothstep(t / 1.3);
  const away = smoothstep((t - 1.1) / 1.1);
  const rotor = smoothstep((t - 1.3) / 1.3);
  return {
    casebackAngle: unscrew === 0 ? 0 : -1.1 * unscrew,
    casebackLift: 1.5 * unscrew + 40 * away,
    casebackOpacity: 1 - away,
    rotorLift: 6 * rotor,
    rotorSlide: 30 * rotor * rotor,
    done: time >= openingDuration(flipFirst),
  };
}

/**
 * Physics integration for Drosophila melanogaster inside a 3D bounded arena.
 * Translates ConnectomeEngine motor output (steering torque & thrust) into physical 3D kinematics.
 */
export class FlyPhysics {
  constructor(arenaBounds = { x: 80, y: 45, z: 80 }) {
    this.bounds = arenaBounds;

    // Kinematic State
    this.position = [0, 0, 0];
    this.velocity = [0, 0, 0];
    this.yaw = 0; // Heading in radians (0 = facing +Z)
    this.pitch = 0;
    this.roll = 0;
    this.speed = 1.0;

    // Environmental Stimulus inside the arena
    this.stimulus = {
      type: 'light', // 'light' | 'odor' | 'food' | 'none'
      position: [40, 5, 40],
      intensity: 1.0,
      active: true,
    };
  }

  /**
   * Calculates sensory flux received by the fly's bilateral sensors.
   */
  computeSensoryFlux() {
    if (!this.stimulus.active || this.stimulus.type === 'none') {
      return this._computeWallSensory();
    }

    const [px, py, pz] = this.position;
    const [sx, sy, sz] = this.stimulus.position;

    const dx = sx - px;
    const dy = sy - py;
    const dz = sz - pz;
    const distSq = dx * dx + dy * dy + dz * dz;
    const dist = Math.sqrt(distSq) || 1;

    // Angle to stimulus in horizontal plane (where 0 is +Z, PI/2 is +X)
    const angleToTarget = Math.atan2(dx, dz);
    let relAngle = angleToTarget - this.yaw;

    // Normalize to [-PI, PI]
    while (relAngle > Math.PI) relAngle -= 2 * Math.PI;
    while (relAngle < -Math.PI) relAngle += 2 * Math.PI;

    // Bilateral Compound Eye Acceptance (~50° lateral offset)
    // Positive relAngle = target is to the RIGHT
    // Negative relAngle = target is to the LEFT
    const rightEyeAngle = relAngle - 0.7; // Aligned with right eye viewing axis
    const leftEyeAngle = relAngle + 0.7;  // Aligned with left eye viewing axis

    const distFactor = Math.min(1.2, 90 / (dist + 8));

    const lightR = Math.max(0, Math.cos(rightEyeAngle)) * distFactor * this.stimulus.intensity;
    const lightL = Math.max(0, Math.cos(leftEyeAngle)) * distFactor * this.stimulus.intensity;

    // Antennal odor concentration gradient
    const odorConc = 1.0 / (1.0 + 0.001 * distSq);
    const odorR = odorConc * (relAngle > 0 ? 1.2 : 0.6);
    const odorL = odorConc * (relAngle < 0 ? 1.2 : 0.6);

    const wallSensory = this._computeWallSensory();

    return {
      lightL: this.stimulus.type === 'light' ? lightL : 0,
      lightR: this.stimulus.type === 'light' ? lightR : 0,
      odorL: (this.stimulus.type === 'odor' || this.stimulus.type === 'food') ? odorL : 0,
      odorR: (this.stimulus.type === 'odor' || this.stimulus.type === 'food') ? odorR : 0,
      wallProximity: wallSensory.wallProximity,
    };
  }

  _computeWallSensory() {
    const [px, py, pz] = this.position;
    const bx = this.bounds.x;
    const by = this.bounds.y;
    const bz = this.bounds.z;

    const distLeft = px - (-bx);
    const distRight = bx - px;
    const distBottom = py - (-by);
    const distTop = by - py;
    const distBack = pz - (-bz);
    const distFront = bz - pz;

    const minDist = Math.min(distLeft, distRight, distBottom, distTop, distBack, distFront);
    const dangerZone = 22.0;

    let wallProximity = 0;
    if (minDist < dangerZone) {
      wallProximity = (dangerZone - minDist) / dangerZone;
    }

    return { wallProximity };
  }

  /**
   * Applies motor output from ConnectomeEngine and updates body kinematics.
   */
  update(motorOutput, dt = 0.016) {
    const { steeringTorque, forwardThrust } = motorOutput;

    // Integrate emergent steering torque
    this.yaw += steeringTorque * dt;

    // Smooth Wall Avoidance Steering (Avoids getting trapped in corners)
    const [px, py, pz] = this.position;
    const margin = 18.0;
    const bx = this.bounds.x - margin;
    const bz = this.bounds.z - margin;

    let avoidTorque = 0;
    if (px > bx) {
      avoidTorque -= (px - bx) * 0.25; // Steer left
    } else if (px < -bx) {
      avoidTorque += (-bx - px) * 0.25; // Steer right
    }

    if (pz > bz) {
      avoidTorque -= (pz - bz) * 0.25; // Steer back
    } else if (pz < -bz) {
      avoidTorque += (-bz - pz) * 0.25; // Steer forward
    }

    this.yaw += avoidTorque * dt;

    // Body roll proportional to steering rate
    this.roll = THREE_clamp(-(steeringTorque + avoidTorque) * 0.18, -0.4, 0.4);

    // Forward speed (mm/s simulated scale)
    this.speed = Math.max(0.4, forwardThrust * 12.0);

    // Velocity along heading
    this.velocity[0] = Math.sin(this.yaw) * this.speed;
    this.velocity[2] = Math.cos(this.yaw) * this.speed;

    // Altitude guidance towards stimulus elevation or center plane
    let targetY = 0;
    if (this.stimulus.active && this.stimulus.type !== 'none') {
      targetY = this.stimulus.position[1];
    }
    const altDiff = targetY - this.position[1];
    this.velocity[1] = THREE_clamp(altDiff * 1.2, -4.0, 4.0);

    // Position integration
    this.position[0] += this.velocity[0] * dt;
    this.position[1] += this.velocity[1] * dt;
    this.position[2] += this.velocity[2] * dt;

    // Smooth Soft Bounce / Boundary Reflection (Never stick to corners)
    const maxX = this.bounds.x - 3;
    const maxY = this.bounds.y - 3;
    const maxZ = this.bounds.z - 3;

    if (Math.abs(this.position[0]) > maxX) {
      this.position[0] = Math.sign(this.position[0]) * maxX;
      this.yaw = Math.PI - this.yaw; // Reflect heading horizontally
    }
    if (Math.abs(this.position[2]) > maxZ) {
      this.position[2] = Math.sign(this.position[2]) * maxZ;
      this.yaw = -this.yaw; // Reflect heading vertically
    }
    if (Math.abs(this.position[1]) > maxY) {
      this.position[1] = Math.sign(this.position[1]) * maxY;
    }

    this.pitch = -this.velocity[1] * 0.04;
  }

  setStimulus(type, position, intensity = 1.0) {
    this.stimulus = {
      type,
      position: position || this.stimulus.position,
      intensity,
      active: type !== 'none',
    };
  }

  resetPosition() {
    this.position = [0, 0, 0];
    this.velocity = [0, 0, 0];
    this.yaw = 0;
    this.pitch = 0;
    this.roll = 0;
  }
}

function THREE_clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

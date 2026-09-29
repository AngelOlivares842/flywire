/**
 * Physics integration for Drosophila melanogaster inside a 3D bounded arena.
 * Translates ConnectomeEngine motor output (steering torque & thrust) into physical 3D kinematics.
 * Includes robust boundary evasion and elastic wall reflection (zero corner sticking).
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
      type: 'light', // 'light' | 'odor' | 'none'
      position: [35, 5, 35],
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

    // Angle to stimulus in horizontal plane
    const angleToTarget = Math.atan2(dx, dz);
    let relAngle = angleToTarget - this.yaw;

    // Normalize to [-PI, PI]
    while (relAngle > Math.PI) relAngle -= 2 * Math.PI;
    while (relAngle < -Math.PI) relAngle += 2 * Math.PI;

    // Bilateral Compound Eye Acceptance
    const rightEyeAngle = relAngle - 0.75;
    const leftEyeAngle = relAngle + 0.75;

    const distFactor = Math.min(1.4, 95 / (dist + 8));

    const lightR = Math.max(0, Math.cos(rightEyeAngle)) * distFactor * this.stimulus.intensity;
    const lightL = Math.max(0, Math.cos(leftEyeAngle)) * distFactor * this.stimulus.intensity;

    // Antennal odor concentration gradient
    const odorConc = 1.0 / (1.0 + 0.0008 * distSq);
    const odorR = odorConc * (relAngle > 0 ? 1.3 : 0.5);
    const odorL = odorConc * (relAngle < 0 ? 1.3 : 0.5);

    const wallSensory = this._computeWallSensory();

    return {
      lightL: this.stimulus.type === 'light' ? lightL : 0,
      lightR: this.stimulus.type === 'light' ? lightR : 0,
      odorL: this.stimulus.type === 'odor' ? odorL : 0,
      odorR: this.stimulus.type === 'odor' ? odorR : 0,
      wallProximity: wallSensory.wallProximity,
      relAngle,
      targetDist: dist,
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
    const dangerZone = 25.0;

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

    // Integrate emergent neural steering torque
    this.yaw += steeringTorque * dt;

    // Smooth anticipatory wall avoidance steering (pushes yaw toward center before collision)
    const [px, py, pz] = this.position;
    const margin = 24.0;
    const bx = this.bounds.x - margin;
    const bz = this.bounds.z - margin;

    let avoidTorque = 0;
    if (px > bx) {
      avoidTorque -= (px - bx) * 0.35; // Steer left toward center
    } else if (px < -bx) {
      avoidTorque += (-bx - px) * 0.35; // Steer right toward center
    }

    if (pz > bz) {
      avoidTorque -= (pz - bz) * 0.35; // Steer backward
    } else if (pz < -bz) {
      avoidTorque += (-bz - pz) * 0.35; // Steer forward
    }

    this.yaw += avoidTorque * dt;

    // Body roll proportional to steering rate
    this.roll = THREE_clamp(-(steeringTorque + avoidTorque) * 0.18, -0.45, 0.45);

    // Forward speed (mm/s simulated scale)
    this.speed = Math.max(0.4, forwardThrust * 13.0);

    // Velocity along heading
    this.velocity[0] = Math.sin(this.yaw) * this.speed;
    this.velocity[2] = Math.cos(this.yaw) * this.speed;

    // Altitude guidance towards stimulus elevation or center plane
    let targetY = 0;
    if (this.stimulus.active && this.stimulus.type !== 'none') {
      targetY = this.stimulus.position[1];
    }
    const altDiff = targetY - this.position[1];
    this.velocity[1] = THREE_clamp(altDiff * 1.5, -4.5, 4.5);

    // Position integration
    this.position[0] += this.velocity[0] * dt;
    this.position[1] += this.velocity[1] * dt;
    this.position[2] += this.velocity[2] * dt;

    // ── ELASTIC BOUNDARY REFLECTION & COLLISION RECOVERY (Zero sticking) ──
    const boundX = this.bounds.x - 4;
    const boundY = this.bounds.y - 4;
    const boundZ = this.bounds.z - 4;
    let reflected = false;

    // X boundaries (Lateral walls)
    if (this.position[0] >= boundX) {
      this.position[0] = boundX - 4; // Push back inside
      this.velocity[0] = -Math.abs(this.velocity[0]) * 0.85;
      reflected = true;
    } else if (this.position[0] <= -boundX) {
      this.position[0] = -boundX + 4;
      this.velocity[0] = Math.abs(this.velocity[0]) * 0.85;
      reflected = true;
    }

    // Z boundaries (Front / Back walls)
    if (this.position[2] >= boundZ) {
      this.position[2] = boundZ - 4;
      this.velocity[2] = -Math.abs(this.velocity[2]) * 0.85;
      reflected = true;
    } else if (this.position[2] <= -boundZ) {
      this.position[2] = -boundZ + 4;
      this.velocity[2] = Math.abs(this.velocity[2]) * 0.85;
      reflected = true;
    }

    // Y boundaries (Ceiling / Floor)
    if (this.position[1] >= boundY) {
      this.position[1] = boundY - 4;
      this.velocity[1] = -Math.abs(this.velocity[1]) * 0.85; // Push downward
    } else if (this.position[1] <= -boundY) {
      this.position[1] = -boundY + 4;
      this.velocity[1] = Math.abs(this.velocity[1]) * 0.85; // Push upward
    }

    // If reflected off a wall, align yaw to new inward velocity vector
    if (reflected) {
      this.yaw = Math.atan2(this.velocity[0], this.velocity[2]);
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

// domain/models/BodyPart.js  (REFACTORED)
// Embedded map inside pets/{petId}.bodyParts. Now each part carries a visual
// description and observable phenomena, plus muscle tension and sensitivity so
// actions (bite, hit, cut, caress, rub) can cause localized changes. Pure shape.

export function createBodyPart({
  name = "",
  description = "",         // visual text, e.g. "slender pale forearm"
  integrityHp = 100,        // 0..100. 0 = broken/injured
  localTemperature = 37.0,  // Celsius
  muscleTension = 0.1,      // 0..1, rises with reflex/arousal, falls when relaxed
  sensitivity = 0.3,        // 0..1, base tactile sensitivity
  isCore = false,

  // Observable phenomena accumulated on this part.
  // e.g. ["gooseflesh","reddened","bruised","bite-mark","cut"]
  physicalDetails = [],
} = {}) {
  return {
    name,
    description,
    integrityHp,
    localTemperature,
    muscleTension,
    sensitivity,
    isCore,
    physicalDetails,
  };
}

export const BODY_PART_IDS = [
  "head", "torso", "leftArm", "rightArm",
  "leftLeg", "rightLeg", "leftFoot", "rightFoot",
];

export function createDefaultBodyParts() {
  return {
    head:      createBodyPart({ name: "Head",       isCore: true,  localTemperature: 36.8 }),
    torso:     createBodyPart({ name: "Torso",      isCore: true,  localTemperature: 37.0 }),
    leftArm:   createBodyPart({ name: "Left Arm",   localTemperature: 36.0 }),
    rightArm:  createBodyPart({ name: "Right Arm",  localTemperature: 36.0 }),
    leftLeg:   createBodyPart({ name: "Left Leg",   localTemperature: 35.8 }),
    rightLeg:  createBodyPart({ name: "Right Leg",  localTemperature: 35.8 }),
    leftFoot:  createBodyPart({ name: "Left Foot",  localTemperature: 35.0 }),
    rightFoot: createBodyPart({ name: "Right Foot", localTemperature: 35.0 }),
  };
}

export const BODY_PART_HP_MIN = 0;
export const BODY_PART_HP_MAX = 100;

import type { AnyCircuitElement, LayerRef } from "circuit-json";
import {
  convertSoupToGerberCommands,
  stringifyGerberCommandLayers,
} from "circuit-json-to-gerber";

export type CopperGerberLayerName = "F_Cu" | "B_Cu" | `In${number}_Cu`;

export const getGerberLayerName = (layer: LayerRef): CopperGerberLayerName => {
  if (layer === "top") return "F_Cu";
  if (layer === "bottom") return "B_Cu";
  return `In${layer.slice("inner".length)}_Cu` as CopperGerberLayerName;
};

const normalizeRotation = (rotation: number): number =>
  ((rotation % 360) + 360) % 360;

const isOddQuarterTurn = (rotation: number): boolean =>
  Math.abs(rotation - 90) < 1e-6 || Math.abs(rotation - 270) < 1e-6;

/**
 * gerber-to-svg does not apply Gerber LR transforms to rounded-rectangle
 * apertures. Bake orthogonal quarter turns into the aperture dimensions before
 * handing the Gerber to that renderer so the bitmap matches the Circuit JSON.
 */
const normalizeOrthogonalSmtpadRotations = (
  elements: AnyCircuitElement[],
): AnyCircuitElement[] =>
  elements.map((element) => {
    if (element.type !== "pcb_smtpad" || element.shape !== "rotated_rect") {
      return element;
    }

    const rotation = normalizeRotation(element.ccw_rotation);
    if (!isOddQuarterTurn(rotation)) return element;

    return {
      ...element,
      width: element.height,
      height: element.width,
      ccw_rotation: 0,
    };
  });

export const getGerberLayerString = (
  elements: AnyCircuitElement[],
  layer: LayerRef,
): string | undefined => {
  const gerberLayers = stringifyGerberCommandLayers(
    convertSoupToGerberCommands(normalizeOrthogonalSmtpadRotations(elements)),
  );

  return gerberLayers[getGerberLayerName(layer)];
};

export const assertGerberLayerCanBeGenerated = (
  circuitJson: AnyCircuitElement[],
  layer: LayerRef,
): void => {
  const gerberLayers = convertSoupToGerberCommands(circuitJson);
  const layerName = getGerberLayerName(layer);

  if (!gerberLayers[layerName] || gerberLayers[layerName].length === 0) {
    throw new Error(`Expected ${layerName} Gerber commands to be generated`);
  }
};

import { expect, test } from "bun:test";
import type { AnyCircuitElement } from "circuit-json";
import { createGerberGroupMask } from "../lib/gerber-mask";
import { getGerberLayerName } from "../lib/gerber-layer";

test("maps all ten copper layers to Gerber layer names", () => {
  expect(getGerberLayerName("top")).toBe("F_Cu");
  expect(getGerberLayerName("inner1")).toBe("In1_Cu");
  expect(getGerberLayerName("inner7")).toBe("In7_Cu");
  expect(getGerberLayerName("inner8")).toBe("In8_Cu");
  expect(getGerberLayerName("bottom")).toBe("B_Cu");
});

test("renders orthogonally rotated rounded SMT pads with the correct dimensions", async () => {
  const pad = {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pcb_smtpad_u3_pin_1",
    layer: "top",
    shape: "rotated_rect",
    width: 1,
    height: 0.6,
    corner_radius: 0.075,
    x: 0,
    y: 0,
    ccw_rotation: 90.0000001,
    is_covered_with_solder_mask: false,
  } as AnyCircuitElement;
  const width = 200;
  const height = 200;
  const mask = await createGerberGroupMask({
    elements: [pad],
    bounds: { minX: -1, maxX: 1, minY: -1, maxY: 1 },
    width,
    height,
    layer: "top",
  });

  let minX = width;
  let maxX = -1;
  let minY = height;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x] === 0) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }

  const renderedWidth = maxX - minX + 1;
  const renderedHeight = maxY - minY + 1;
  expect(renderedWidth).toBeCloseTo(60, -1);
  expect(renderedHeight).toBeCloseTo(100, -1);
  expect(renderedHeight).toBeGreaterThan(renderedWidth);
});

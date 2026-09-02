import { expect, test } from "bun:test";
import type { AnyCircuitElement } from "circuit-json";
import { createShortDebugSvg } from "lib/index";
import {
  writeOrCompareBitmapSnapshot,
  writeOrCompareCircuitJsonSvgSnapshot,
  writeOrCompareSvgSnapshot,
} from "tests/fixtures/bitmap-snapshot";

const endpoint = { x: 3.846005050633883, y: -11.297005050633885 };

const circuitJson = [
  {
    type: "source_net",
    source_net_id: "source_net_vbus",
    name: "VBUS",
  },
  {
    type: "source_net",
    source_net_id: "source_net_3v3",
    name: "V3V3",
  },
  {
    type: "source_trace",
    source_trace_id: "source_trace_vbus",
    connected_source_port_ids: [],
    connected_source_net_ids: ["source_net_vbus"],
  },
  {
    type: "source_trace",
    source_trace_id: "source_trace_3v3",
    connected_source_port_ids: [],
    connected_source_net_ids: ["source_net_3v3"],
  },
  {
    type: "pcb_board",
    pcb_board_id: "pcb_board_repro",
    center: { x: 3.45, y: -10.95 },
    width: 3.5,
    height: 2.8,
    num_layers: 2,
  },
  {
    type: "pcb_trace",
    pcb_trace_id: "pcb_trace_vbus",
    source_trace_id: "source_trace_vbus",
    route: [
      {
        route_type: "wire",
        x: 4.4163017865631815,
        y: -11.06630178656318,
        width: 0.55,
        layer: "top",
      },
      {
        route_type: "wire",
        x: 4.044191857708787,
        y: -10.694103191042121,
        width: 0.55,
        layer: "top",
      },
    ],
  },
  {
    type: "pcb_trace",
    pcb_trace_id: "pcb_trace_3v3",
    source_trace_id: "source_trace_3v3",
    route: [
      {
        route_type: "wire",
        x: 3.2793367004225895,
        y: -11.330003367089256,
        width: 0.375,
        layer: "top",
      },
      {
        route_type: "wire",
        ...endpoint,
        width: 0.6,
        layer: "top",
      },
      {
        route_type: "via",
        ...endpoint,
        from_layer: "bottom",
        to_layer: "top",
        via_diameter: 0.3,
        via_hole_diameter: 0.2,
      },
    ],
  },
  {
    type: "pcb_via",
    pcb_via_id: "pcb_via_3v3",
    pcb_trace_id: "pcb_trace_3v3",
    ...endpoint,
    hole_diameter: 0.2,
    outer_diameter: 0.3,
    layers: ["top", "bottom"],
    from_layer: "bottom",
    to_layer: "top",
  },
] as AnyCircuitElement[];

test("Gerber mode reports a false VBUS to 3V3 short across a valid gap", async () => {
  const pcbShorts = await writeOrCompareBitmapSnapshot(
    import.meta.path,
    "pcb-bitmap",
    circuitJson,
    { mode: "pcb", layer: "top", micronsPerPixel: 35 },
  );
  const gerberShorts = await writeOrCompareBitmapSnapshot(
    import.meta.path,
    "gerber-bitmap",
    circuitJson,
    { mode: "gerber", layer: "top", micronsPerPixel: 35 },
  );

  expect(pcbShorts).toHaveLength(0);
  expect(gerberShorts).toHaveLength(1);
  await writeOrCompareSvgSnapshot(
    import.meta.path,
    createShortDebugSvg(circuitJson, gerberShorts),
  );
  await writeOrCompareCircuitJsonSvgSnapshot(import.meta.path, circuitJson);
});

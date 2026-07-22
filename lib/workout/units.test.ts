import { describe, expect, it } from "vitest";
import { displayWeight, kgToLb, lbToKg, toKg } from "./units";

describe("kgToLb", () => {
  it("convierte kg a lb redondeando a 1 decimal", () => {
    expect(kgToLb(0)).toBe(0);
    expect(kgToLb(1)).toBe(2.2);
    expect(kgToLb(60)).toBe(132.3);
    expect(kgToLb(100)).toBe(220.5);
  });
});

describe("lbToKg", () => {
  it("convierte lb a kg redondeando a 1 decimal", () => {
    expect(lbToKg(0)).toBe(0);
    expect(lbToKg(45)).toBe(20.4);
    expect(lbToKg(225)).toBe(102.1);
  });

  it("es aproximadamente inversa de kgToLb", () => {
    const kg = 82.5;
    expect(lbToKg(kgToLb(kg))).toBeCloseTo(kg, 0);
  });
});

describe("displayWeight", () => {
  it("devuelve el kg tal cual cuando la unidad es kg", () => {
    expect(displayWeight(60, "kg")).toBe(60);
  });

  it("convierte a lb cuando la unidad es lb", () => {
    expect(displayWeight(60, "lb")).toBe(kgToLb(60));
  });
});

describe("toKg", () => {
  it("devuelve el valor tal cual cuando la unidad es kg", () => {
    expect(toKg(60, "kg")).toBe(60);
  });

  it("convierte de lb a kg cuando la unidad es lb", () => {
    expect(toKg(135, "lb")).toBe(lbToKg(135));
  });
});

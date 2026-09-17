import type { ComponentType } from "react";

type AcidSquaresProps = {
  color1?: string;
  color2?: string;
  color3?: string;
  detail?: "low" | "medium" | "high";
  speed?: number;
  waveDepth?: number;
  zoom?: number;
  density?: number;
  glow?: number;
  exposure?: number;
  spread?: number;
  stepSize?: number;
  colorShift?: number;
  contrast?: number;
  brightness?: number;
  opacity?: number;
  mouseInteraction?: boolean;
  mouseStrength?: number;
  mouseRadius?: number;
  blur?: number;
  grain?: boolean;
  grainIntensity?: number;
  lightMode?: boolean;
  className?: string;
};

declare const AcidSquares: ComponentType<AcidSquaresProps>;
export default AcidSquares;

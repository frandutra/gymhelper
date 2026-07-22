import { mkdirSync, writeFileSync } from "node:fs";
import { ImageResponse } from "next/og";

// Ícono de la app: mancuerna simple sobre el acento de marca (DESIGN.md).
// Padding generoso para que no se recorte si el sistema aplica una máscara.
function dumbbell(size: number) {
  const barHeight = Math.round(size * 0.07);
  const barWidth = Math.round(size * 0.16);
  const discSize = Math.round(size * 0.24);
  const discRadius = Math.round(discSize * 0.28);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ff5a1f",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: discSize,
              height: discSize,
              borderRadius: discRadius,
              background: "#0d0d0f",
            }}
          />
          <div style={{ width: barWidth, height: barHeight, background: "#0d0d0f" }} />
          <div
            style={{
              width: discSize,
              height: discSize,
              borderRadius: discRadius,
              background: "#0d0d0f",
            }}
          />
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}

async function saveIcon(size: number, filePath: string) {
  const response = dumbbell(size);
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(filePath, buffer);
  console.log(`  ${filePath} (${size}x${size})`);
}

async function main() {
  mkdirSync("public/icons", { recursive: true });
  console.log("Generando íconos...");
  await saveIcon(192, "public/icons/icon-192.png");
  await saveIcon(512, "public/icons/icon-512.png");
  await saveIcon(180, "public/icons/apple-touch-icon.png");
  console.log("Listo.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

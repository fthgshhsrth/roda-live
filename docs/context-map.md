# Mapa de contexto

Índice estático de imports e exports; evita reler o projeto inteiro. Gere novamente após mudar módulos.

```mermaid
graph LR
  n0["launch-window.mjs"]
  n1["media.js"]
  n2["music.js"]
  n3["party.js"]
  n4["public/backstage.js"]
  n5["public/camera-director.js"]
  n6["public/capture-profile.js"]
  n7["public/club-room.js"]
  n8["public/gift-artwork.js"]
  n9["public/gift-catalog.js"]
  n10["public/instruments.js"]
  n11["public/layout.js"]
  n12["public/overlay.js"]
  n13["public/panel.js"]
  n14["public/party-layout.js"]
  n15["public/roach.js"]
  n16["public/scene3d.js"]
  n17["public/spiral-layout.js"]
  n18["public/waltz.js"]
  n19["public/wedding-decor.js"]
  n20["qa-camera.mjs"]
  n21["qa-party.mjs"]
  n22["qa-wedding.mjs"]
  n23["qa.mjs"]
  n24["scripts/context-map.mjs"]
  n25["server.js"]
  n26["source-link.js"]
  n27["test.js"]
  n28["wheel.js"]
  n3 --> n14
  n9 --> n8
  n12 --> n16
  n13 --> n14
  n13 --> n9
  n15 --> n10
  n15 --> n18
  n16 --> n15
  n16 --> n11
  n16 --> n5
  n16 --> n14
  n16 --> n4
  n16 --> n6
  n16 --> n9
  n16 --> n18
  n16 --> n17
  n16 --> n19
  n16 --> n7
  n20 --> n21
  n22 --> n21
  n23 --> n21
  n25 --> n1
  n25 --> n2
  n25 --> n28
  n25 --> n9
  n25 --> n26
  n25 --> n3
  n27 --> n28
  n27 --> n14
  n27 --> n5
  n27 --> n11
  n27 --> n1
  n27 --> n2
  n27 --> n9
  n27 --> n6
  n27 --> n18
  n27 --> n17
  n27 --> n26
  n28 --> n3
```

Fluxos principais: presentes → server.js → wheel.js → party.js → public/party-layout.js; visual → scene3d.js → roach.js/instruments.js/backstage.js; câmera → camera-director.js.

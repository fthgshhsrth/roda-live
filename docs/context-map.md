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
  n7["public/gift-artwork.js"]
  n8["public/gift-catalog.js"]
  n9["public/instruments.js"]
  n10["public/layout.js"]
  n11["public/overlay.js"]
  n12["public/panel.js"]
  n13["public/party-layout.js"]
  n14["public/roach.js"]
  n15["public/scene3d.js"]
  n16["public/waltz.js"]
  n17["public/wedding-decor.js"]
  n18["qa-camera.mjs"]
  n19["qa-party.mjs"]
  n20["qa-wedding.mjs"]
  n21["qa.mjs"]
  n22["scripts/context-map.mjs"]
  n23["server.js"]
  n24["test.js"]
  n25["wheel.js"]
  n3 --> n13
  n8 --> n7
  n11 --> n15
  n12 --> n13
  n12 --> n8
  n14 --> n9
  n14 --> n16
  n15 --> n14
  n15 --> n10
  n15 --> n5
  n15 --> n13
  n15 --> n4
  n15 --> n6
  n15 --> n8
  n15 --> n16
  n15 --> n17
  n18 --> n19
  n20 --> n19
  n21 --> n19
  n23 --> n1
  n23 --> n2
  n23 --> n25
  n23 --> n8
  n24 --> n25
  n24 --> n13
  n24 --> n5
  n24 --> n10
  n24 --> n1
  n24 --> n2
  n24 --> n8
  n24 --> n6
  n24 --> n16
  n25 --> n3
```

Fluxos principais: presentes → server.js → wheel.js → party.js → public/party-layout.js; visual → scene3d.js → roach.js/instruments.js/backstage.js; câmera → camera-director.js.

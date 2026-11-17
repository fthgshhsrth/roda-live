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
  n17["qa-camera.mjs"]
  n18["qa-party.mjs"]
  n19["qa-wedding.mjs"]
  n20["qa.mjs"]
  n21["scripts/context-map.mjs"]
  n22["server.js"]
  n23["test.js"]
  n24["wheel.js"]
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
  n17 --> n18
  n19 --> n18
  n20 --> n18
  n22 --> n1
  n22 --> n2
  n22 --> n24
  n22 --> n8
  n23 --> n24
  n23 --> n13
  n23 --> n5
  n23 --> n10
  n23 --> n1
  n23 --> n2
  n23 --> n8
  n23 --> n6
  n23 --> n16
  n24 --> n3
```

Fluxos principais: presentes → server.js → wheel.js → party.js → public/party-layout.js; visual → scene3d.js → roach.js/instruments.js/backstage.js; câmera → camera-director.js.

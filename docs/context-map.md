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
  n7["public/gift-catalog.js"]
  n8["public/instruments.js"]
  n9["public/layout.js"]
  n10["public/overlay.js"]
  n11["public/panel.js"]
  n12["public/party-layout.js"]
  n13["public/roach.js"]
  n14["public/scene3d.js"]
  n15["qa-camera.mjs"]
  n16["qa-party.mjs"]
  n17["qa-wedding.mjs"]
  n18["qa.mjs"]
  n19["scripts/context-map.mjs"]
  n20["server.js"]
  n21["test.js"]
  n22["wheel.js"]
  n3 --> n12
  n10 --> n14
  n11 --> n12
  n11 --> n7
  n13 --> n8
  n14 --> n13
  n14 --> n9
  n14 --> n5
  n14 --> n12
  n14 --> n4
  n14 --> n6
  n14 --> n7
  n15 --> n16
  n17 --> n16
  n18 --> n16
  n20 --> n1
  n20 --> n2
  n20 --> n22
  n20 --> n7
  n21 --> n22
  n21 --> n12
  n21 --> n5
  n21 --> n9
  n21 --> n1
  n21 --> n2
  n21 --> n7
  n21 --> n6
  n22 --> n3
```

Fluxos principais: presentes → server.js → wheel.js → party.js → public/party-layout.js; visual → scene3d.js → roach.js/instruments.js/backstage.js; câmera → camera-director.js.

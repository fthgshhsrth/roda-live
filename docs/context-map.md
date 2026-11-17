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
  n6["public/instruments.js"]
  n7["public/layout.js"]
  n8["public/overlay.js"]
  n9["public/panel.js"]
  n10["public/party-layout.js"]
  n11["public/roach.js"]
  n12["public/scene3d.js"]
  n13["qa-camera.mjs"]
  n14["qa-party.mjs"]
  n15["qa-wedding.mjs"]
  n16["qa.mjs"]
  n17["scripts/context-map.mjs"]
  n18["server.js"]
  n19["test.js"]
  n20["wheel.js"]
  n3 --> n10
  n8 --> n12
  n9 --> n10
  n11 --> n6
  n12 --> n11
  n12 --> n7
  n12 --> n5
  n12 --> n10
  n12 --> n4
  n13 --> n14
  n15 --> n14
  n16 --> n14
  n18 --> n1
  n18 --> n2
  n18 --> n20
  n19 --> n20
  n19 --> n10
  n19 --> n5
  n19 --> n7
  n19 --> n1
  n19 --> n2
  n20 --> n3
```

Fluxos principais: presentes → server.js → wheel.js → party.js → public/party-layout.js; visual → scene3d.js → roach.js/instruments.js/backstage.js; câmera → camera-director.js.

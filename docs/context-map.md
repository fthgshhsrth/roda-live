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
  n17["public/waltz.js"]
  n18["public/wedding-decor.js"]
  n19["qa-camera.mjs"]
  n20["qa-party.mjs"]
  n21["qa-wedding.mjs"]
  n22["qa.mjs"]
  n23["scripts/context-map.mjs"]
  n24["server.js"]
  n25["source-link.js"]
  n26["test.js"]
  n27["wheel.js"]
  n3 --> n14
  n9 --> n8
  n12 --> n16
  n13 --> n14
  n13 --> n9
  n15 --> n10
  n15 --> n17
  n16 --> n15
  n16 --> n11
  n16 --> n5
  n16 --> n14
  n16 --> n4
  n16 --> n6
  n16 --> n9
  n16 --> n17
  n16 --> n18
  n16 --> n7
  n19 --> n20
  n21 --> n20
  n22 --> n20
  n24 --> n1
  n24 --> n2
  n24 --> n27
  n24 --> n9
  n24 --> n25
  n26 --> n27
  n26 --> n14
  n26 --> n5
  n26 --> n11
  n26 --> n1
  n26 --> n2
  n26 --> n9
  n26 --> n6
  n26 --> n17
  n26 --> n25
  n27 --> n3
```

Fluxos principais: presentes → server.js → wheel.js → party.js → public/party-layout.js; visual → scene3d.js → roach.js/instruments.js/backstage.js; câmera → camera-director.js.

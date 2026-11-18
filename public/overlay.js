// A cena usa a janela inteira, pixel a pixel (como o overlay de referência: Godot com stretch "expand" e
// fundo transparente). O LIVE Studio captura a janela em 1080×1032 num monitor 1080p; com 1080 de largura ela entra
// 1:1 na tela vertical, sem ampliar. Reduzir a cena a um quadro 9:16 menor só jogava pixels fora.
import './scene3d.js';

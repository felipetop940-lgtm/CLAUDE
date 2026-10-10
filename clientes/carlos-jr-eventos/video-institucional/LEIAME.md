# Vídeo institucional (motion graphics)

`video.html` é a animação (GSAP). Para renderizar, ela precisa da pasta de trabalho com `img/`, `seq/` (quadros dos vídeos) e `node_modules/gsap`; o `render.js` captura quadro a quadro com Playwright e o ffmpeg junta:

    node render.js frames 30
    ffmpeg -framerate 30 -i frames/%05d.jpg -c:v libx264 -crf 20 -pix_fmt yuv420p carlos-jr-motion.mp4

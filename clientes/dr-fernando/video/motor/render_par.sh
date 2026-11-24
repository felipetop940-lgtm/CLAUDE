#!/bin/bash
# uso: render_par.sh saida.mp4  (renderiza em 4 partes paralelas e junta)
OUT=$1; N=750; P=4; STEP=$(( (N + P - 1) / P )); rm -f part_*.mp4 parts.txt
for i in $(seq 0 $((P-1))); do
  DE=$((i*STEP)); ATE=$(( (i+1)*STEP )); [ $ATE -gt $N ] && ATE=$N
  OMP_NUM_THREADS=1 python3 render.py seg fotos fonts part_$i.mp4 --de $DE --ate $ATE > part_$i.log 2>&1 &
  echo "file 'part_$i.mp4'" >> parts.txt
done
wait
grep -l Traceback part_*.log && exit 1
ffmpeg -v error -y -f concat -safe 0 -i parts.txt -c copy $OUT && echo "pronto $OUT"

import sys, os, pillow_heif
from PIL import Image, ImageOps
pillow_heif.register_heif_opener()
src, dst = sys.argv[1], sys.argv[2]
for f in sorted(os.listdir(src)):
    if f.upper().endswith('.HEIC'):
        im = ImageOps.exif_transpose(Image.open(os.path.join(src, f))).convert('RGB')
        im.save(os.path.join(dst, f.rsplit('.',1)[0] + '.jpg'), quality=95)
        print(f, im.size)

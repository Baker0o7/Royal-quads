from PIL import Image
import os

img = Image.open("assets/images/logo.png").convert("RGBA")

densities = [
    ("android/app/src/main/res/mipmap-mdpi",     48),
    ("android/app/src/main/res/mipmap-hdpi",     72),
    ("android/app/src/main/res/mipmap-xhdpi",    96),
    ("android/app/src/main/res/mipmap-xxhdpi",  144),
    ("android/app/src/main/res/mipmap-xxxhdpi", 192),
]

for folder, size in densities:
    os.makedirs(folder, exist_ok=True)
    icon = img.resize((size, size), Image.LANCZOS)
    icon.save(f"{folder}/ic_launcher.png",       "PNG")
    icon.save(f"{folder}/ic_launcher_round.png", "PNG")
    print(f"  {size}px -> {folder}")

print("Icons done")

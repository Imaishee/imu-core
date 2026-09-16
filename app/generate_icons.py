from PIL import Image, ImageDraw, ImageFont
import os

SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

RES_BASE = "android/app/src/main/res"


def create_icon(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Dark rounded-rect background (#09090B)
    margin = int(size * 0.08)
    radius = int(size * 0.22)
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=radius,
        fill=(9, 9, 11, 255),
    )

    # Purple accent circle behind text
    cx, cy = size // 2, size // 2
    circle_r = int(size * 0.28)
    draw.ellipse(
        [cx - circle_r, cy - circle_r, cx + circle_r, cy + circle_r],
        fill=(167, 139, 250, 255),  # #A78BFA purple
    )

    # "IM" text in white bold
    font_size = int(size * 0.28)
    try:
        font = ImageFont.truetype("arialbd.ttf", font_size)
    except:
        try:
            font = ImageFont.truetype("Arial Bold.ttf", font_size)
        except:
            font = ImageFont.load_default()

    text = "IM"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text(
        (cx - tw // 2, cy - th // 2 - int(size * 0.02)),
        text,
        fill=(255, 255, 255, 255),
        font=font,
    )

    return img


def create_adaptive_icon(size):
    """Create adaptive icon foreground (108dp at each density)"""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = size // 2, size // 2

    # Purple circle
    circle_r = int(size * 0.22)
    draw.ellipse(
        [cx - circle_r, cy - circle_r, cx + circle_r, cy + circle_r],
        fill=(167, 139, 250, 255),
    )

    # "IM" text
    font_size = int(size * 0.22)
    try:
        font = ImageFont.truetype("arialbd.ttf", font_size)
    except:
        try:
            font = ImageFont.truetype("Arial Bold.ttf", font_size)
        except:
            font = ImageFont.load_default()

    text = "IM"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text(
        (cx - tw // 2, cy - th // 2 - int(size * 0.015)),
        text,
        fill=(255, 255, 255, 255),
        font=font,
    )

    return img


# Generate regular icons
for folder, size in SIZES.items():
    out_dir = os.path.join(RES_BASE, folder)
    os.makedirs(out_dir, exist_ok=True)

    icon = create_icon(size)
    icon.save(os.path.join(out_dir, "ic_launcher.png"))
    print(f"  {folder}/ic_launcher.png ({size}x{size})")

    # Round icon (circle mask)
    round_icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse([0, 0, size, size], fill=255)
    round_icon.paste(icon, mask=mask)
    round_icon.save(os.path.join(out_dir, "ic_launcher_round.png"))

# Generate adaptive icon foreground
adaptive_sizes = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}

for folder, size in adaptive_sizes.items():
    out_dir = os.path.join(RES_BASE, folder)
    fg = create_adaptive_icon(size)
    fg.save(os.path.join(out_dir, "ic_launcher_foreground.png"))
    print(f"  {folder}/ic_launcher_foreground.png ({size}x{size})")

# Create adaptive icon XML
drawable_dir = os.path.join(RES_BASE, "drawable")
os.makedirs(drawable_dir, exist_ok=True)

with open(os.path.join(drawable_dir, "ic_launcher_background.xml"), "w") as f:
    f.write("""<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <solid android:color="#09090B"/>
</shape>
""")

mipmap_anydpi_dir = os.path.join(RES_BASE, "mipmap-anydpi-v26")
os.makedirs(mipmap_anydpi_dir, exist_ok=True)

with open(os.path.join(mipmap_anydpi_dir, "ic_launcher.xml"), "w") as f:
    f.write("""<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
""")

with open(os.path.join(mipmap_anydpi_dir, "ic_launcher_round.xml"), "w") as f:
    f.write("""<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
""")

print("\nAll icons generated!")

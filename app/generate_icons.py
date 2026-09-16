from PIL import Image, ImageDraw
import math


def create_icon():
    size = 1024
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Dark background rounded rect
    margin = 0
    bg = Image.new("RGBA", (size, size), (9, 9, 11, 255))
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin], radius=220, fill=255
    )
    img.paste(bg, (0, 0), mask)

    # Main purple circle in center
    cx, cy = size // 2, size // 2
    circle_r = int(size * 0.28)
    purple = (167, 139, 250)  # #A78BFA
    draw.ellipse(
        [cx - circle_r, cy - circle_r, cx + circle_r, cy + circle_r], fill=purple
    )

    # Inner darker circle for depth
    inner_r = int(size * 0.20)
    dark_purple = (109, 79, 200)
    draw.ellipse(
        [cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r], fill=dark_purple
    )

    # Two abstract brain/network nodes on sides
    node_r = int(size * 0.06)
    # Left node
    lx = cx - int(size * 0.17)
    ly = cy - int(size * 0.02)
    draw.ellipse([lx - node_r, ly - node_r, lx + node_r, ly + node_r], fill=purple)
    # Right node
    rx = cx + int(size * 0.17)
    ry = cy - int(size * 0.02)
    draw.ellipse([rx - node_r, ry - node_r, rx + node_r, ry + node_r], fill=purple)

    # Connecting lines from nodes to center circle (network feel)
    line_color = (167, 139, 250, 180)
    line_width = int(size * 0.012)
    # Left to center
    draw.line([(lx, ly), (cx - int(size * 0.08), cy)], fill=purple, width=line_width)
    # Right to center
    draw.line([(rx, ry), (cx + int(size * 0.08), cy)], fill=purple, width=line_width)

    # Small dots scattered for network effect
    dot_r = int(size * 0.018)
    dots = [
        (cx - int(size * 0.22), cy - int(size * 0.12)),
        (cx + int(size * 0.22), cy + int(size * 0.08)),
        (cx - int(size * 0.08), cy - int(size * 0.18)),
        (cx + int(size * 0.10), cy + int(size * 0.16)),
        (cx - int(size * 0.15), cy + int(size * 0.14)),
        (cx + int(size * 0.18), cy - int(size * 0.13)),
    ]
    for dx, dy in dots:
        draw.ellipse(
            [dx - dot_r, dy - dot_r, dx + dot_r, dy + dot_r], fill=(167, 139, 250, 120)
        )

    # Thin connecting lines between scattered dots
    thin_width = max(1, int(size * 0.005))
    connections = [
        (dots[0], (lx, ly)),
        (dots[1], (rx, ry)),
        (dots[2], (cx, cy - inner_r)),
        (dots[3], (cx, cy + inner_r)),
        (dots[4], (lx, ly)),
        (dots[5], (rx, ry)),
    ]
    for a, b in connections:
        draw.line([a, b], fill=(167, 139, 250, 60), width=thin_width)

    # Save main icon
    img.save(
        "A:/IMU-CORE/app/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png"
    )
    img.save(
        "A:/IMU-CORE/app/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png"
    )
    img.save(
        "A:/IMU-CORE/app/android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png"
    )
    img.save(
        "A:/IMU-CORE/app/android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png"
    )
    img.save(
        "A:/IMU-CORE/app/android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png"
    )

    # Round icon
    round_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    round_draw = ImageDraw.Draw(round_img)
    round_draw.ellipse([0, 0, size, size], fill=(9, 9, 11, 255))
    round_img.paste(img, (0, 0), img)

    round_img.save(
        "A:/IMU-CORE/app/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png"
    )
    round_img.save(
        "A:/IMU-CORE/app/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png"
    )
    round_img.save(
        "A:/IMU-CORE/app/android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png"
    )
    round_img.save(
        "A:/IMU-CORE/app/android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png"
    )
    round_img.save(
        "A:/IMU-CORE/app/android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png"
    )

    print("Icons generated successfully!")


create_icon()

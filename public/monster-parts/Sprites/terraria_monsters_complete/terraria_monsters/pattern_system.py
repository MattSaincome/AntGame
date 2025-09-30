# Pattern Overlay System
from PIL import Image, ImageDraw

def create_stripe_pattern(size=32, color1=(255, 255, 255, 50), color2=(0, 0, 0, 50)):
    """Create a stripe pattern overlay"""
    pattern = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(pattern)
    
    stripe_width = 4
    for y in range(0, size, stripe_width * 2):
        draw.rectangle([0, y, size, y + stripe_width], fill=color1)
        draw.rectangle([0, y + stripe_width, size, y + stripe_width * 2], fill=color2)
    
    return pattern

def create_spot_pattern(size=32, spot_color=(255, 255, 255, 100), spot_count=8):
    """Create a spotted pattern overlay"""
    pattern = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(pattern)
    
    import random
    for _ in range(spot_count):
        x = random.randint(5, size - 5)
        y = random.randint(5, size - 5)
        radius = random.randint(2, 5)
        draw.ellipse([x - radius, y - radius, x + radius, y + radius], fill=spot_color)
    
    return pattern

def create_scale_pattern(size=32, scale_color=(255, 255, 255, 80)):
    """Create a scale pattern overlay"""
    pattern = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(pattern)
    
    scale_size = 4
    for y in range(0, size, scale_size):
        offset = (y // scale_size) % 2 * (scale_size // 2)
        for x in range(offset, size, scale_size):
            # Draw scale shape
            points = [
                (x, y),
                (x + scale_size // 2, y - scale_size // 2),
                (x + scale_size, y),
                (x + scale_size // 2, y + scale_size // 2)
            ]
            draw.polygon(points, fill=scale_color)
    
    return pattern

def apply_pattern(monster_sprite, pattern):
    """Apply a pattern overlay to a monster sprite"""
    # Ensure both images are the same size
    if monster_sprite.size != pattern.size:
        pattern = pattern.resize(monster_sprite.size, Image.NEAREST)
    
    # Composite the pattern over the sprite
    result = Image.new('RGBA', monster_sprite.size, (0, 0, 0, 0))
    result.paste(monster_sprite, (0, 0))
    result.paste(pattern, (0, 0), pattern)
    
    return result

# Example usage:
# monster = Image.open('assembled/dragon_evo5_complete.png')
# stripes = create_stripe_pattern(64)
# striped_dragon = apply_pattern(monster, stripes)
# striped_dragon.save('dragon_striped.png')

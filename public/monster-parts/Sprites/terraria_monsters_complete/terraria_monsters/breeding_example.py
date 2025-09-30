# Monster Breeding Example Script
import random
from PIL import Image

def breed_monsters(parent1_parts, parent2_parts):
    """Example breeding function"""
    child_parts = {}
    
    # Each part has 50% chance from each parent
    for part_type in ['head', 'body', 'legs', 'tail', 'wings']:
        if part_type in parent1_parts and part_type in parent2_parts:
            if random.random() < 0.5:
                child_parts[part_type] = parent1_parts[part_type]
            else:
                child_parts[part_type] = parent2_parts[part_type]
        elif part_type in parent1_parts:
            # 25% chance to inherit unique part
            if random.random() < 0.25:
                child_parts[part_type] = parent1_parts[part_type]
        elif part_type in parent2_parts:
            if random.random() < 0.25:
                child_parts[part_type] = parent2_parts[part_type]
    
    return child_parts

def assemble_monster(parts_dict, output_size=64):
    """Assemble monster from parts"""
    canvas = Image.new('RGBA', (output_size, output_size), (0, 0, 0, 0))
    
    # Layer order
    layer_order = ['tail', 'wings', 'body', 'legs', 'arms', 'head']
    
    for part_name in layer_order:
        if part_name in parts_dict:
            part_img = Image.open(parts_dict[part_name])
            # Scale to output size
            part_img = part_img.resize((output_size, output_size), Image.NEAREST)
            
            # Position based on part type
            if part_name == 'head':
                canvas.paste(part_img, (0, -8), part_img)
            elif part_name == 'tail':
                canvas.paste(part_img, (16, 0), part_img)
            elif part_name == 'wings':
                canvas.paste(part_img, (-16, 0), part_img)
            else:
                canvas.paste(part_img, (0, 0), part_img)
    
    return canvas

# Example usage:
# dragon_parts = {
#     'head': 'heads/dragon_evo5_head.png',
#     'body': 'bodies/dragon_evo5_body.png',
#     'wings': 'wings/dragon_evo5_wings.png',
#     'legs': 'legs/dragon_evo5_legs.png',
#     'tail': 'tails/dragon_evo5_tail.png'
# }
# 
# demon_parts = {
#     'head': 'heads/demon_evo5_head.png',
#     'body': 'bodies/demon_evo5_body.png',
#     'wings': 'wings/demon_evo5_wings.png',
#     'tail': 'tails/demon_evo5_tail.png'
# }
# 
# child_parts = breed_monsters(dragon_parts, demon_parts)
# child_sprite = assemble_monster(child_parts)
# child_sprite.save('hybrid_monster.png')

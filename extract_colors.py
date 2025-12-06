
import pygame
import os

os.environ['SDL_VIDEODRIVER'] = 'dummy'

try:
    pygame.init() # Needed for some image loading
    path = r"C:\Users\USER\Downloads\stitch_remix_of_splash_screen\screen.png"
    if not os.path.exists(path):
        print(f"File not found: {path}")
        exit(1)
        
    surf = pygame.image.load(path)
    width, height = surf.get_size()
    
    colors = {}
    
    # Sample every 5th pixel for speed
    step = 5
    for x in range(0, width, step):
        for y in range(0, height, step):
            try:
                col = surf.get_at((x, y))
                # col is (r, g, b, a) usually or (r, g, b)
                if len(col) == 4 and col[3] < 128:
                    continue # Transparent
                
                # Quantize slightly to group near-identical colors
                q = 16 # bucket size
                r = (col[0] // q) * q + q//2
                g = (col[1] // q) * q + q//2
                b = (col[2] // q) * q + q//2
                
                key = (r, g, b)
                colors[key] = colors.get(key, 0) + 1
            except IndexError:
                pass
            
    sorted_colors = sorted(colors.items(), key=lambda item: item[1], reverse=True)
    
    # Get top distinct colors
    final_palette = []
    
    def is_distinct(c1, palette):
        for c2 in palette:
            # sum of diffs
            dist = abs(c1[0]-c2[0]) + abs(c1[1]-c2[1]) + abs(c1[2]-c2[2])
            if dist < 60: # Threshold for distinctness
                return False
        return True
        
    print(f"Scanning {len(sorted_colors)} colors...")
    for c, count in sorted_colors:
        if len(final_palette) >= 8: # Get top 8
            break
        if is_distinct(c, final_palette):
            final_palette.append(c)
            
    print("Detected Palette:")
    for c in final_palette:
        print("#{:02x}{:02x}{:02x}".format(c[0], c[1], c[2]))
        
except Exception as e:
    print(f"Error: {e}")

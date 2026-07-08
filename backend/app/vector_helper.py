import numpy as np
import random
import hashlib

# Global model holder
model = None
has_transformers = False

try:
    from sentence_transformers import SentenceTransformer
    from PIL import Image
    import io
    # We will try to load the model lazily when needed
    has_transformers = True
    print("SentenceTransformers is available. Real CLIP embeddings will be used if model loads successfully.")
except ImportError:
    print("SentenceTransformers or Pillow is not installed. Falling back to deterministic pseudo-embeddings for development.")

def get_sentence_transformer_model():
    global model, has_transformers
    if not has_transformers:
        return None
    if model is None:
        try:
            # clip-ViT-B-32 yields 512-dimensional dual image/text embeddings
            model = SentenceTransformer('clip-ViT-B-32')
            print("Successfully loaded clip-ViT-B-32 model.")
        except Exception as e:
            print(f"Failed to load sentence-transformer model: {e}. Falling back to pseudo-embeddings.")
            has_transformers = False
    return model

def get_text_embedding(text: str) -> list:
    """
    Generates a 512-dimensional normalized float list representing the text query.
    If SentenceTransformer is available, it uses CLIP.
    Otherwise, it generates a hash-based deterministic pseudo-vector.
    """
    transformer = get_sentence_transformer_model()
    if transformer and has_transformers:
        try:
            embedding = transformer.encode(text)
            # Normalize
            norm = np.linalg.norm(embedding)
            if norm > 0:
                embedding = embedding / norm
            return [float(x) for x in embedding]
        except Exception as e:
            print(f"Error encoding text with model: {e}. Using fallback.")
            
    # Deterministic pseudo-embedding fallback
    return _generate_pseudo_embedding(text)

def get_image_embedding(image_bytes: bytes) -> list:
    """
    Generates a 512-dimensional normalized float list representing the image.
    If SentenceTransformer and PIL are available, it encodes the image.
    Otherwise, it generates a hash-based deterministic pseudo-vector.
    """
    transformer = get_sentence_transformer_model()
    if transformer and has_transformers:
        try:
            from PIL import Image
            import io
            image = Image.open(io.BytesIO(image_bytes))
            embedding = transformer.encode(image)
            # Normalize
            norm = np.linalg.norm(embedding)
            if norm > 0:
                embedding = embedding / norm
            return [float(x) for x in embedding]
        except Exception as e:
            print(f"Error encoding image with model: {e}. Using fallback.")
            
    # Hash the image bytes to create a seed for a pseudo-embedding
    byte_hash = hashlib.md5(image_bytes).hexdigest()
    return _generate_pseudo_embedding(f"img_{byte_hash}")

def _generate_pseudo_embedding(seed_text: str) -> list:
    """
    Generates a deterministic 512-dimensional unit vector based on a seed string.
    This guarantees that the same input yields the same vector, supporting mock search.
    """
    # Seed random generator with a hash of the text
    hash_val = int(hashlib.md5(seed_text.encode('utf-8')).hexdigest(), 16)
    rng = random.Random(hash_val)
    
    vec = [rng.gauss(0, 1) for _ in range(512)]
    
    # Normalize to unit sphere
    mag = sum(x**2 for x in vec)**0.5
    if mag > 0:
        vec = [round(x / mag, 6) for x in vec]
    else:
        vec = [0.0] * 512
        vec[0] = 1.0
        
    return vec

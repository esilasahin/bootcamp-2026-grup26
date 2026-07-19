def chunk_text(text: str, max_tokens: int = 1000) -> list[str]:
    """
    Uzun metinleri LLM token sınırlarına uygun parçalara ayırır.
    
    Bu fonksiyon şimdilik basit bir kelime/karakter bazlı bölme işlemi yapar.
    İleride tiktoken gibi daha gelişmiş bir tokenizer kullanılabilir.
    
    Args:
        text (str): Parçalanacak uzun metin.
        max_tokens (int): Her bir parçanın tahmini maksimum token sayısı.
        
    Returns:
        list[str]: Metin parçalarının listesi.
    """
    if not text or not text.strip():
        return []
        
    # Basit bir yaklaşım: Ortalama bir token'ı 4 karakter olarak varsayalım.
    max_chars = max_tokens * 4
    words = text.split()
    
    chunks = []
    current_chunk = []
    current_length = 0
    
    for word in words:
        # Kelimenin uzunluğu + 1 boşluk
        word_len = len(word) + 1 
        if current_length + word_len > max_chars and current_chunk:
            chunks.append(" ".join(current_chunk))
            current_chunk = [word]
            current_length = word_len
        else:
            current_chunk.append(word)
            current_length += word_len
            
    if current_chunk:
        chunks.append(" ".join(current_chunk))
        
    return chunks

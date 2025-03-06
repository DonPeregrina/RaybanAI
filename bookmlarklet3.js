javascript:(function(){
    const API_URL='http://localhost:3103/api/raybanai';
    const resultDiv=document.createElement('div');
    resultDiv.style.cssText='position:fixed;bottom:20px;right:20px;background:rgba(0,0,0,0.8);color:white;padding:15px;border-radius:8px;z-index:9999;max-width:300px;font-family:Arial;';
    document.body.appendChild(resultDiv);
    
    // Set para almacenar las URLs de imágenes ya procesadas
    const processedImages = new Set();
    let lastProcessedTime = Date.now();
    
    async function processImage(imgSrc) {
      // Evitar procesamiento si la imagen ya fue procesada recientemente
      if (Date.now() - lastProcessedTime < 1000) return;
      
      // Evitar procesamiento de la misma imagen
      if (processedImages.has(imgSrc)) {
        console.log('Image already processed, skipping:', imgSrc);
        return;
      }
      
      // Evitar procesar imágenes de perfil/avatar
      if (imgSrc.includes('profile') || imgSrc.includes('avatar')) return;
      
      // Marcar esta imagen como procesada
      processedImages.add(imgSrc);
      lastProcessedTime = Date.now();
      
      resultDiv.textContent = 'Analyzing image...';
      console.log('Processing:', imgSrc);
      
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ type: 'url', imageUrl: imgSrc })
          // Eliminado el modo "no-cors" que puede causar comportamientos inesperados
        });
        
        const data = await response.json();
        console.log('Response:', data);
        resultDiv.textContent = data.response || data.description;
      } catch (error) {
        console.error('Error:', error);
        resultDiv.textContent = 'Error processing image';
      }
    }
    
    // Usar MutationObserver para observar cambios en el DOM
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes);
        for (const node of addedNodes) {
          if (node.nodeType === 1 && node.classList && node.classList.contains('x78zum5')) {
            const images = node.getElementsByTagName('img');
            if (images.length > 0) {
              const lastImage = images[images.length - 1];
              // Solo procesar si tiene src y no ha sido procesada ya
              if (lastImage.src && !lastImage.dataset.processed) {
                lastImage.dataset.processed = 'true';
                processImage(lastImage.src);
                // Importante: return para procesar solo una imagen por mutación
                return;
              }
            }
          }
        }
      }
    });
    
    const chatContainer = document.querySelector('[role="main"]');
    if (chatContainer) {
      observer.observe(chatContainer, {
        childList: true,
        subtree: true
      });
      console.log('Observer started');
      resultDiv.textContent = 'Observer activated - Latest images only';
    } else {
      console.error('Chat not found');
      resultDiv.textContent = 'Error: Chat not found';
    }
  })();
// script.js – leitura com html5-qrcode e busca de vinho

const scanButton = document.getElementById('scanButton');
const cameraView = document.getElementById('cameraView');

let html5QrCodeInstance = null;

scanButton.addEventListener('click', async () => {
  if (!html5QrCodeInstance) {
    html5QrCodeInstance = new Html5Qrcode('cameraView');
  }

  const qrCodeSuccessCallback = async (decodedText) => {
    try {
      await html5QrCodeInstance.stop();
      await html5QrCodeInstance.clear();
      console.log('Câmera parada.');
    } catch (err) {
      console.log('Erro ao parar a câmera:', err);
    }

    const wineData = await fetchWineData(decodedText);
    displayWineInfo(wineData);
  };

  const config = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    // Ativar recursos experimentais para tentar detectar alguns barcodes
    experimentalFeatures: {
      useBarCodeDetectorIfSupported: true
    },
    // Preferir câmera traseira em dispositivos móveis
    facingMode: 'environment'
  };
  try {
    await html5QrCodeInstance.start({ facingMode: 'environment' }, config, qrCodeSuccessCallback);
  } catch (err) {
    console.error('Não foi possível iniciar a câmera:', err);
  }
});

async function fetchWineData(code) {
  // Tente API real (necessita chave e CORS) e faça fallback para base local
  const apiKey = '';
  const apiUrl = apiKey
    ? `https://api.wine.com/v1/wines?code=${encodeURIComponent(code)}&apikey=${apiKey}`
    : null;

  if (apiUrl) {
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      // Ajuste conforme a estrutura da API real
      return normalizeWineDataFromApi(data);
    } catch (e) {
      console.warn('Falha na API, usando base local:', e);
    }
  }

  // Base local: `wines.json` mapeando código → dados
  try {
    const res = await fetch('wines.json');
    const db = await res.json();
    const item = db[code] || db[code.trim()] || null;
    if (item) return normalizeWineData(item);
  } catch (e) {
    console.warn('Falha ao carregar base local:', e);
  }

  // Fallback simples com informações genéricas
  return normalizeWineData({
    name: code,
    type: '--',
    region: '--',
    year: '--',
    harmonization: {
      food: ['Massas leves', 'Aves'],
      cheese: ['Brie', 'Camembert'],
      temperature: '12-14°C'
    }
  });
}

function normalizeWineDataFromApi(apiData) {
  // Exemplo de normalização; ajuste conforme resposta real da API
  const first = Array.isArray(apiData?.wines) ? apiData.wines[0] : apiData;
  return normalizeWineData({
    name: first?.name || '--',
    type: first?.type || '--',
    region: first?.region || '--',
    year: first?.year || '--',
    harmonization: first?.harmonization || {
      food: ['Carnes', 'Massas'],
      cheese: ['Gouda'],
      temperature: '14-16°C'
    }
  });
}

function normalizeWineData(raw) {
  return {
    name: raw.name || '--',
    type: raw.type || '--',
    region: raw.region || '--',
    year: raw.year || '--',
    harmonization: {
      food: Array.isArray(raw?.harmonization?.food) ? raw.harmonization.food : ['--'],
      cheese: Array.isArray(raw?.harmonization?.cheese) ? raw.harmonization.cheese : ['--'],
      temperature: raw?.harmonization?.temperature || '--'
    }
  };
}

function displayWineInfo(wineData) {
  document.getElementById('wineName').textContent = `Nome: ${wineData.name}`;
  document.getElementById('wineType').textContent = `Tipo: ${wineData.type}`;
  document.getElementById('wineRegion').textContent = `Região: ${wineData.region}`;
  document.getElementById('wineYear').textContent = `Ano: ${wineData.year}`;

  document.getElementById('foodSuggestions').textContent = `Comidas: ${wineData.harmonization.food.join(', ')}`;
  document.getElementById('cheeseSuggestions').textContent = `Queijos: ${wineData.harmonization.cheese.join(', ')}`;
  document.getElementById('temperature').textContent = `Temperatura ideal: ${wineData.harmonization.temperature}`;
}

// Inicializa em branco
displayWineInfo(normalizeWineData({}));

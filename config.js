// Configuración centralizada del sitio
window.MoodBoxConfig = {
  // Configuración del carrito
  cart: {
    localStorageKey: 'cart',
    maxItems: 50,
    alertDuration: 3000
  },
  
  // Configuración de productos
  products: {
    localStorageKey: 'productos',
    defaultImage: './assets/imagenes/logo.png',
    defaultRating: '4.5'
  },
  
  // Configuración de la interfaz
  ui: {
    animationDuration: 300,
    mobileBreakpoint: 768
  },
  
  // URLs y endpoints
  urls: {
    logo: './assets/imagenes/logo.png',
    defaultProductImage: './assets/imagenes_catalogo/cajita.png'
  }
};

// Función para obtener configuración
window.getConfig = function(key) {
  const keys = key.split('.');
  let value = window.MoodBoxConfig;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return null;
    }
  }
  
  return value;
};

// Función para establecer configuración
window.setConfig = function(key, value) {
  const keys = key.split('.');
  let config = window.MoodBoxConfig;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!config[keys[i]]) {
      config[keys[i]] = {};
    }
    config = config[keys[i]];
  }
  
  config[keys[keys.length - 1]] = value;
};

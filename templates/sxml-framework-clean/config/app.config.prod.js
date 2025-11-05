(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.APP_CONFIG = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  // Generated from app.config.prod.json for faster startup
  return {
    "env": "production",
    "app": {
      "name": "Your App",
      "title": "Your App Management Entrance",
      "subtitle": "Management System",
      "description": "Modern Web 3.0 Management System powered by SXML"
    },
    "api": {
      "baseUrl": "https://api.example.com",
      "cspReportUrl": "/api/csp-report",
      "wsUrl": "wss://api.example.com/ws",
      "uploadUrl": "https://api.example.com/upload",
      "downloadUrl": "https://api.example.com/download"
    },
    "upload": {
      "maxFileSize": 10485760,
      "maxFileSizeMB": 10,
      "allowedTypes": ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
      "allowedExtensions": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".doc", ".docx", ".xls", ".xlsx"],
      "imageMaxWidth": 4096,
      "imageMaxHeight": 4096,
      "chunkSize": 1048576,
      "enableChunkUpload": true
    },
    "external": {
      "ipGeoProvider": "https://ipapi.co",
      "ipApiProvider": "https://api.ipify.org"
    },
    "security": {
      "connectSrc": [
        "'self'",
        "https://api.example.com",
        "wss://api.example.com",
        "https://ipapi.co",
        "https://api.ipify.org"
      ],
      "preconnectHosts": [
        "https://api.example.com",
        "https://ipapi.co",
        "https://api.ipify.org"
      ]
    },
    "i18n": {
      "defaultLocale": "en-US",
      "fallbackLocale": "en-US"
    },
    "branding": {
      "faviconPath": "../../images/logo1.png",
      "logoPath": "../../images/logo1.png",
      "logoAlt": "{{APP_NAME}}"
    }
  };
});


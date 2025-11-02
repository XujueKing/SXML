(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.APP_CONFIG = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  // Generated from app.config.dev.json for faster startup
  return {
    "env": "development",
    "app": {
      "name": "Your App (Dev)",
      "title": "Your App Management Entrance - DEV",
      "subtitle": "Development Environment",
      "description": "Modern Web 3.0 Management System - Development"
    },
    "api": {
      "baseUrl": "http://localhost:8080",
      "cspReportUrl": "/api/csp-report",
      "wsUrl": "ws://localhost:8080/ws",
      "uploadUrl": "http://localhost:8080/upload",
      "downloadUrl": "http://localhost:8080/download"
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
        "http://localhost:8080",
        "ws://localhost:8080",
        "https://ipapi.co",
        "https://api.ipify.org"
      ],
      "preconnectHosts": [
        "http://localhost:8080"
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

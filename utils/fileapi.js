/**
 * 文件上传下载 API 模块
 * 提供文件上传、下载、预览、分片上传、进度监控等功能
 * 支持多种文件类型验证和图片压缩
 * 
 * @author King, Rainbow Haruko
 * @version 1.0.0
 */

(function (global) {
  'use strict';

  /**
   * 文件 API 管理器
   */
  class FileAPIManager {
    constructor(options = {}) {
      // 从全局配置读取
      const config = (typeof window !== 'undefined' && window.APP_CONFIG) || {};
      
      this.config = {
        // 上传配置
        uploadUrl: options.uploadUrl || config.api?.uploadUrl || `${config.api?.baseUrl || ''}/upload`,
        downloadUrl: options.downloadUrl || config.api?.downloadUrl || `${config.api?.baseUrl || ''}/download`,
        
        // 文件限制
        maxFileSize: options.maxFileSize || config.upload?.maxFileSize || 10 * 1024 * 1024, // 10MB
        allowedTypes: options.allowedTypes || config.upload?.allowedTypes || [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ],
        allowedExtensions: options.allowedExtensions || config.upload?.allowedExtensions || [
          '.jpg', '.jpeg', '.png', '.gif', '.webp',
          '.pdf', '.doc', '.docx', '.xls', '.xlsx'
        ],
        
        // 图片配置
        imageMaxWidth: options.imageMaxWidth || config.upload?.imageMaxWidth || 4096,
        imageMaxHeight: options.imageMaxHeight || config.upload?.imageMaxHeight || 4096,
        imageQuality: options.imageQuality || 0.85,
        autoCompress: options.autoCompress !== false,
        
        // 分片上传
        chunkSize: options.chunkSize || config.upload?.chunkSize || 1024 * 1024, // 1MB
        enableChunkUpload: options.enableChunkUpload !== false,
        
        // 其他选项
        withCredentials: options.withCredentials !== false,
        headers: options.headers || {},
        debug: options.debug || false
      };

      this._log('FileAPIManager initialized', this.config);
    }

    /**
     * 日志输出
     */
    _log(...args) {
      if (this.config.debug && console && console.log) {
        console.log('[FileAPI]', ...args);
      }
    }

    /**
     * 错误日志
     */
    _error(...args) {
      if (console && console.error) {
        console.error('[FileAPI]', ...args);
      }
    }

    /**
     * 验证文件
     */
    validateFile(file) {
      const errors = [];

      // 检查文件大小
      if (file.size > this.config.maxFileSize) {
        const maxSizeMB = (this.config.maxFileSize / 1024 / 1024).toFixed(2);
        errors.push(`文件大小超过限制 (最大 ${maxSizeMB}MB)`);
      }

      // 检查文件类型
      if (this.config.allowedTypes.length > 0) {
        if (!this.config.allowedTypes.includes(file.type)) {
          errors.push(`不支持的文件类型: ${file.type}`);
        }
      }

      // 检查文件扩展名
      if (this.config.allowedExtensions.length > 0) {
        const ext = this._getFileExtension(file.name);
        if (!this.config.allowedExtensions.includes(ext)) {
          errors.push(`不支持的文件扩展名: ${ext}`);
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    }

    /**
     * 获取文件扩展名
     */
    _getFileExtension(filename) {
      const lastDot = filename.lastIndexOf('.');
      return lastDot !== -1 ? filename.substring(lastDot).toLowerCase() : '';
    }

    /**
     * 判断是否为图片
     */
    _isImage(file) {
      return file.type.startsWith('image/');
    }

    /**
     * 压缩图片
     */
    async compressImage(file, options = {}) {
      return new Promise((resolve, reject) => {
        if (!this._isImage(file)) {
          resolve(file);
          return;
        }

        const maxWidth = options.maxWidth || this.config.imageMaxWidth;
        const maxHeight = options.maxHeight || this.config.imageMaxHeight;
        const quality = options.quality || this.config.imageQuality;

        const reader = new FileReader();
        
        reader.onload = (e) => {
          const img = new Image();
          
          img.onload = () => {
            let width = img.width;
            let height = img.height;

            // 计算缩放比例
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width = Math.floor(width * ratio);
              height = Math.floor(height * ratio);
            }

            // 如果尺寸未改变且质量为1，返回原文件
            if (width === img.width && height === img.height && quality >= 1) {
              resolve(file);
              return;
            }

            // 创建 canvas 进行压缩
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                if (blob) {
                  // 创建新的 File 对象
                  const compressedFile = new File([blob], file.name, {
                    type: file.type,
                    lastModified: Date.now()
                  });
                  
                  this._log(`Image compressed: ${(file.size / 1024).toFixed(2)}KB -> ${(compressedFile.size / 1024).toFixed(2)}KB`);
                  resolve(compressedFile);
                } else {
                  resolve(file);
                }
              },
              file.type,
              quality
            );
          };

          img.onerror = () => {
            reject(new Error('Failed to load image'));
          };

          img.src = e.target.result;
        };

        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
      });
    }

    /**
     * 上传单个文件
     */
    async upload(file, options = {}) {
      try {
        // 验证文件
        const validation = this.validateFile(file);
        if (!validation.valid) {
          throw new Error(validation.errors.join('; '));
        }

        // 压缩图片（如果启用）
        let uploadFile = file;
        if (this.config.autoCompress && this._isImage(file)) {
          uploadFile = await this.compressImage(file);
        }

        // 判断是否使用分片上传
        if (this.config.enableChunkUpload && uploadFile.size > this.config.chunkSize * 2) {
          return await this._chunkUpload(uploadFile, options);
        } else {
          return await this._simpleUpload(uploadFile, options);
        }

      } catch (error) {
        this._error('Upload error:', error);
        throw error;
      }
    }

    /**
     * 简单上传（小文件）
     */
    async _simpleUpload(file, options = {}) {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);

        // 添加额外字段
        if (options.data) {
          Object.keys(options.data).forEach(key => {
            formData.append(key, options.data[key]);
          });
        }

        const xhr = new XMLHttpRequest();

        // 进度回调
        if (options.onProgress) {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              options.onProgress(percent, e.loaded, e.total);
            }
          });
        }

        // 完成回调
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              this._log('Upload success:', response);
              resolve(response);
            } catch (e) {
              resolve({ success: true, data: xhr.responseText });
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        });

        // 错误回调
        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed: Network error'));
        });

        // 取消回调
        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'));
        });

        // 配置请求
        const url = options.url || this.config.uploadUrl;
        xhr.open('POST', url, true);

        // 设置请求头
        Object.keys(this.config.headers).forEach(key => {
          xhr.setRequestHeader(key, this.config.headers[key]);
        });
        if (options.headers) {
          Object.keys(options.headers).forEach(key => {
            xhr.setRequestHeader(key, options.headers[key]);
          });
        }

        // 添加认证信息
        if (this.config.withCredentials) {
          xhr.withCredentials = true;
        }

        // 添加自定义请求头（如果有 sessionStorage 中的认证信息）
        if (typeof sessionStorage !== 'undefined') {
          const userAccount = sessionStorage.getItem('u');
          if (userAccount) {
            xhr.setRequestHeader('x-user-account', userAccount);
          }
        }

        this._log('Uploading file:', file.name, file.size);
        xhr.send(formData);

        // 返回可取消的对象
        if (options.onCancel) {
          options.onCancel(() => xhr.abort());
        }
      });
    }

    /**
     * 分片上传（大文件）
     */
    async _chunkUpload(file, options = {}) {
      const chunkSize = this.config.chunkSize;
      const chunks = Math.ceil(file.size / chunkSize);
      const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this._log(`Chunk upload: ${chunks} chunks, size: ${chunkSize}`);

      let uploadedSize = 0;

      for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('chunkIndex', i);
        formData.append('totalChunks', chunks);
        formData.append('fileId', fileId);
        formData.append('fileName', file.name);
        formData.append('fileSize', file.size);

        // 添加额外字段
        if (options.data) {
          Object.keys(options.data).forEach(key => {
            formData.append(key, options.data[key]);
          });
        }

        try {
          await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                uploadedSize += chunk.size;
                
                // 更新进度
                if (options.onProgress) {
                  const percent = Math.round((uploadedSize / file.size) * 100);
                  options.onProgress(percent, uploadedSize, file.size);
                }

                try {
                  const response = JSON.parse(xhr.responseText);
                  resolve(response);
                } catch (e) {
                  resolve({ success: true });
                }
              } else {
                reject(new Error(`Chunk ${i} upload failed: ${xhr.status}`));
              }
            });

            xhr.addEventListener('error', () => {
              reject(new Error(`Chunk ${i} upload failed: Network error`));
            });

            const url = options.url || this.config.uploadUrl;
            xhr.open('POST', url, true);

            // 设置请求头
            Object.keys(this.config.headers).forEach(key => {
              xhr.setRequestHeader(key, this.config.headers[key]);
            });
            if (options.headers) {
              Object.keys(options.headers).forEach(key => {
                xhr.setRequestHeader(key, options.headers[key]);
              });
            }

            if (this.config.withCredentials) {
              xhr.withCredentials = true;
            }

            // 添加认证信息
            if (typeof sessionStorage !== 'undefined') {
              const userAccount = sessionStorage.getItem('u');
              if (userAccount) {
                xhr.setRequestHeader('x-user-account', userAccount);
              }
            }

            xhr.send(formData);
          });

        } catch (error) {
          this._error(`Chunk ${i} upload failed:`, error);
          throw error;
        }
      }

      this._log('All chunks uploaded');
      return { success: true, fileId, fileName: file.name, chunks };
    }

    /**
     * 批量上传文件
     */
    async uploadMultiple(files, options = {}) {
      const results = [];
      
      for (let i = 0; i < files.length; i++) {
        try {
          const result = await this.upload(files[i], {
            ...options,
            onProgress: (percent, loaded, total) => {
              if (options.onProgress) {
                options.onProgress(i, percent, loaded, total);
              }
            }
          });
          results.push({ success: true, file: files[i], result });
        } catch (error) {
          results.push({ success: false, file: files[i], error: error.message });
        }
      }

      return results;
    }

    /**
     * 下载文件
     */
    async download(fileId, options = {}) {
      try {
        const url = options.url || `${this.config.downloadUrl}/${fileId}`;
        
        this._log('Downloading file:', fileId);

        const response = await fetch(url, {
          method: 'GET',
          credentials: this.config.withCredentials ? 'include' : 'same-origin',
          headers: {
            ...this.config.headers,
            ...(options.headers || {})
          }
        });

        if (!response.ok) {
          throw new Error(`Download failed: ${response.status} ${response.statusText}`);
        }

        // 获取文件名
        let filename = options.filename;
        if (!filename) {
          const disposition = response.headers.get('Content-Disposition');
          if (disposition) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
            if (matches && matches[1]) {
              filename = matches[1].replace(/['"]/g, '');
            }
          }
        }
        if (!filename) {
          filename = `download_${Date.now()}`;
        }

        // 下载文件
        const blob = await response.blob();
        this._downloadBlob(blob, filename);

        this._log('Download success:', filename);
        return { success: true, filename, size: blob.size };

      } catch (error) {
        this._error('Download error:', error);
        throw error;
      }
    }

    /**
     * 下载 Blob
     */
    _downloadBlob(blob, filename) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }

    /**
     * 预览文件（新窗口打开）
     */
    async preview(fileId, options = {}) {
      try {
        const url = options.url || `${this.config.downloadUrl}/${fileId}`;
        
        if (options.newWindow !== false) {
          window.open(url, '_blank');
        } else {
          window.location.href = url;
        }

        return { success: true, url };

      } catch (error) {
        this._error('Preview error:', error);
        throw error;
      }
    }

    /**
     * 获取文件 URL（用于 img src、video src 等）
     */
    getFileUrl(fileId, options = {}) {
      return options.url || `${this.config.downloadUrl}/${fileId}`;
    }

    /**
     * 读取文件为 Base64
     */
    async readAsDataURL(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
    }

    /**
     * 读取文件为文本
     */
    async readAsText(file, encoding = 'UTF-8') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file, encoding);
      });
    }

    /**
     * 读取文件为 ArrayBuffer
     */
    async readAsArrayBuffer(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsArrayBuffer(file);
      });
    }

    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
  }

  // 导出到全局
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileAPIManager;
  } else {
    global.FileAPIManager = FileAPIManager;
    
    // 创建默认实例
    global.fileapi = new FileAPIManager();
  }

})(typeof window !== 'undefined' ? window : global);

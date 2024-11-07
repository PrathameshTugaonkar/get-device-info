class DeviceDetector {
    constructor() {
        this.userAgent = navigator.userAgent;
        this.platform = navigator.platform;
        this.maxTouchPoints = navigator.maxTouchPoints || 0;
        this.vendor = navigator.vendor;
    }

    getDeviceInfo() {
        return {
            deviceType: this.getDeviceType(),
            operatingSystem: this.getOS(),
            browser: this.getBrowser(),
            isMobile: this.isMobile(),
            isTablet: this.isTablet(),
            isDesktop: this.isDesktop(),
            hasTouch: this.hasTouch(),
            screenInfo: this.getScreenInfo(),
            orientation: this.getOrientation(),
            connectionType: this.getConnectionType()
        };
    }

    getDeviceType() {
        if (this.isTablet()) return 'tablet';
        if (this.isMobile()) return 'mobile';
        return 'desktop';
    }

    isMobile() {
        return /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(this.userAgent);
    }

    isTablet() {
        return /iPad|Android/i.test(this.userAgent) && !/Mobile/i.test(this.userAgent) ||
               (this.maxTouchPoints > 0 && window.innerWidth >= 768);
    }

    isDesktop() {
        return !this.isMobile() && !this.isTablet();
    }

    getOS() {
        const os = {
            Windows: /Windows/.test(this.userAgent),
            MacOS: /Mac OS X/.test(this.userAgent),
            iOS: /iPhone|iPad|iPod/.test(this.userAgent),
            Android: /Android/.test(this.userAgent),
            Linux: /Linux/.test(this.userAgent)
        };

        return Object.keys(os).find(key => os[key]) || 'Unknown';
    }

    getBrowser() {
        const browsers = {
            Chrome: /Chrome/.test(this.userAgent) && /Google Inc/.test(this.vendor),
            Safari: /Safari/.test(this.userAgent) && /Apple Computer/.test(this.vendor),
            Firefox: /Firefox/.test(this.userAgent),
            Opera: /OPR/.test(this.userAgent),
            Edge: /Edg/.test(this.userAgent),
            IE: /Trident/.test(this.userAgent)
        };

        return Object.keys(browsers).find(key => browsers[key]) || 'Unknown';
    }

    hasTouch() {
        return 'ontouchstart' in window || this.maxTouchPoints > 0;
    }

    getScreenInfo() {
        return {
            width: window.screen.width,
            height: window.screen.height,
            availWidth: window.screen.availWidth,
            availHeight: window.screen.availHeight,
            colorDepth: window.screen.colorDepth,
            pixelRatio: window.devicePixelRatio || 1,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight
        };
    }

    getOrientation() {
        if (window.screen.orientation) {
            return window.screen.orientation.type;
        }
        return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    }

    getConnectionType() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        return connection ? connection.effectiveType : 'unknown';
    }
}


class DeviceHardwareInfo extends DeviceDetector {
    constructor() {
        super();
        this.hardwareInfo = {};
    }

    async getHardwareInfo() {
        const basicInfo = this.getDeviceInfo();
        
        return {
            ...basicInfo,
            hardware: {
                // CPU Info
                logicalProcessors: navigator.hardwareConcurrency || 'Not available',
                
                // Memory Info
                deviceMemory: navigator.deviceMemory 
                    ? `${navigator.deviceMemory} GB`
                    : 'Not available',
                
                // GPU Info
                gpu: await this.getGPUInfo(),
                
                // Performance capabilities
                performance: this.getPerformanceInfo(),
                
                // Battery status
                battery: await this.getBatteryInfo(),
                
                // Storage info
                storage: await this.getStorageInfo(),
                
                // Media capabilities
                mediaCapabilities: await this.getMediaCapabilities()
            }
        };
    }

    async getGPUInfo() {
        try {
            const gl = document.createElement('canvas')
                .getContext('webgl') || 
                document.createElement('canvas')
                .getContext('experimental-webgl');
            
            if (!gl) {
                return 'WebGL not supported';
            }

            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (!debugInfo) {
                return 'GPU information not available';
            }

            return {
                vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
                renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
                webglVersion: gl.getParameter(gl.VERSION),
                shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE)
            };
        } catch (e) {
            return 'Error getting GPU info';
        }
    }

    getPerformanceInfo() {
        const timing = window.performance.timing;
        return {
            timingSupport: !!timing,
            navigationStart: timing ? timing.navigationStart : 'Not available',
            userAgent: navigator.userAgent,
            platform: navigator.platform
        };
    }

    async getBatteryInfo() {
        if (!navigator.getBattery) {
            return 'Battery API not supported';
        }

        try {
            const battery = await navigator.getBattery();
            return {
                charging: battery.charging,
                level: Math.round(battery.level * 100) + '%',
                chargingTime: battery.chargingTime === Infinity ? 
                    'Not charging' : battery.chargingTime + ' seconds',
                dischargingTime: battery.dischargingTime === Infinity ? 
                    'Unknown' : battery.dischargingTime + ' seconds'
            };
        } catch (e) {
            return 'Battery information not available';
        }
    }

    async getStorageInfo() {
        if (!navigator.storage || !navigator.storage.estimate) {
            return 'Storage API not supported';
        }

        try {
            const estimate = await navigator.storage.estimate();
            return {
                quotaBytes: this.formatBytes(estimate.quota),
                usageBytes: this.formatBytes(estimate.usage),
                percentageUsed: Math.round((estimate.usage / estimate.quota) * 100) + '%'
            };
        } catch (e) {
            return 'Storage information not available';
        }
    }

    async getMediaCapabilities() {
        if (!navigator.mediaCapabilities) {
            return 'Media Capabilities API not supported';
        }

        const videoConfig = {
            type: 'file',
            video: {
                contentType: 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"',
                width: 1920,
                height: 1080,
                bitrate: 2000000,
                framerate: 30
            }
        };

        try {
            const decodingInfo = await navigator.mediaCapabilities.decodingInfo(videoConfig);
            return {
                smooth: decodingInfo.smooth,
                powerEfficient: decodingInfo.powerEfficient,
                supported: decodingInfo.supported
            };
        } catch (e) {
            return 'Media capabilities information not available';
        }
    }

    formatBytes(bytes) {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Example usage
// async function displayHardwareInfo() {
//     const detector = new DeviceHardwareInfo();
//     const info = await detector.getHardwareInfo();
//     console.log(info);
//     return info;
// }

// // Example usage
// const detector = new DeviceDetector();
// console.log(detector.getDeviceInfo());
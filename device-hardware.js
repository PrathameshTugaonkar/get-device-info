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
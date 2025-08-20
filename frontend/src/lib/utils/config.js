// 환경변수에서 사이트 설정을 가져오는 유틸리티
export const config = {
    siteName: import.meta.env.VITE_SITE_NAME || '부산Job',
    siteDescription: import.meta.env.VITE_SITE_DESCRIPTION || '부산 청년의 취업 성공을 위한 원스톱 솔루션',
    siteVersion: import.meta.env.VITE_SITE_VERSION || '1.0.0',
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000',
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
};
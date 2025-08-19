import { env } from '$env/dynamic/public';

// 환경변수에서 사이트 설정을 가져오는 유틸리티
export const config = {
    siteName: env.VITE_SITE_NAME || '부산Job',
    siteDescription: env.VITE_SITE_DESCRIPTION || '부산 청년의 취업 성공을 위한 원스톱 솔루션',
    siteVersion: env.VITE_SITE_VERSION || '1.0.0',
    apiUrl: env.VITE_API_URL || 'http://localhost:3000',
    enableAnalytics: env.VITE_ENABLE_ANALYTICS === 'true'
};
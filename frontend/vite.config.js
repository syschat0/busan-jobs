import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
	  host: '0.0.0.0',
	  port: 80,
	  allowedHosts: ['remote.jobbench.net','localhost','withb.jobbench.net'],
	  cors: true, // 기본 CORS 허용 (모든 도메인 → 개발시 유용)
	}
	
});
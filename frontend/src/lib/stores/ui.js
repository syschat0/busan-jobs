import { writable } from 'svelte/store';

// UI 상태 관리
export const loading = writable(false);
export const error = writable(null);
export const notification = writable(null);

// 모달 상태
export const modals = writable({
  jobDetail: { open: false, data: null },
  filter: { open: false },
  favorites: { open: false }
});

// 사이드바 상태 (모바일)
export const sidebarOpen = writable(false);

// 다크모드 상태
export const darkMode = writable(
  typeof localStorage !== 'undefined' 
    ? localStorage.getItem('darkMode') === 'true'
    : false
);

// 다크모드 localStorage 동기화
if (typeof localStorage !== 'undefined') {
  darkMode.subscribe(value => {
    localStorage.setItem('darkMode', value.toString());
    if (value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });
}

// 뷰 모드 (카드 또는 리스트)
export const viewMode = writable(
  typeof localStorage !== 'undefined' 
    ? localStorage.getItem('viewMode') || 'card'
    : 'card'
);

// 뷰 모드 localStorage 동기화
if (typeof localStorage !== 'undefined') {
  viewMode.subscribe(value => {
    localStorage.setItem('viewMode', value);
  });
}

// 액션 함수들
export function showNotification(message, type = 'info', duration = 3000) {
  notification.set({ message, type, id: Date.now() });
  
  if (duration > 0) {
    setTimeout(() => {
      notification.set(null);
    }, duration);
  }
}

export function hideNotification() {
  notification.set(null);
}

export function openModal(modalName, data = null) {
  modals.update(current => ({
    ...current,
    [modalName]: { open: true, data }
  }));
}

export function closeModal(modalName) {
  modals.update(current => ({
    ...current,
    [modalName]: { open: false, data: null }
  }));
}

export function closeAllModals() {
  modals.update(current => {
    const updated = {};
    for (const key in current) {
      updated[key] = { open: false, data: null };
    }
    return updated;
  });
}

export function toggleSidebar() {
  sidebarOpen.update(open => !open);
}

export function closeSidebar() {
  sidebarOpen.set(false);
}

export function toggleDarkMode() {
  darkMode.update(mode => !mode);
}

export function setViewMode(mode) {
  viewMode.set(mode);
}

export function startLoading() {
  loading.set(true);
}

export function stopLoading() {
  loading.set(false);
}

export function setError(errorMessage) {
  error.set(errorMessage);
  if (errorMessage) {
    showNotification(errorMessage, 'error');
  }
}

export function clearError() {
  error.set(null);
}
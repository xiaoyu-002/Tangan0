<template>
  <a class="layout-login-button" href="#/login" aria-label="登录">
    登录
  </a>
</template>

<style scoped>
.layout-login-button {
  position: fixed;
  top: calc(var(--promo-banner-h, 0px) + 12px);
  right: 20px;
  z-index: 70;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border-radius: 999px;
  background: linear-gradient(90deg, #4c53f5 0%, #8a5cff 52%, #c84fff 100%);
  color: #fff;
  box-shadow: 0 10px 30px rgba(126, 87, 255, 0.24);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  text-decoration: none;
  transition:
    filter 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}

.layout-login-button:hover {
  filter: brightness(1.08);
  box-shadow: 0 12px 34px rgba(126, 87, 255, 0.34);
}

.layout-login-button:active {
  transform: scale(0.98);
}

@media (max-width: 767px) {
  .layout-login-button {
    top: calc(var(--promo-banner-h, 0px) + 12px);
    right: 12px;
    padding: 0 14px;
  }
}
</style>

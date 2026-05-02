<script setup>
import { ref, onMounted } from 'vue';


const track = ref(null)

onMounted(() => {
  const el = track.value
  const originalWidth = el.scrollWidth  // exact pixel width of one set

  // clone every child and append
  ;[...el.children].forEach(child => el.appendChild(child.cloneNode(true)))

  // set the offset to exactly one set's width — never approximate
  el.style.setProperty('--marquee-offset', `-${originalWidth}px`)
})
</script>

<template>
  <div class="marquee-wrapper">
    <div class="marquee-track" ref="track">
      <div class="logo">
        <div class="logo-inner">
            <img src="../../assets/icons/icon-1.png" alt="">
        </div>
      </div>
      <div class="logo">
        <div class="logo-inner">
            <img src="../../assets/icons/icon-2.png" alt="">
        </div>
      </div>
      <div class="logo">
        <div class="logo-inner">
            <img src="../../assets/icons/icon-5.png" alt="">
        </div>
      </div>
      <div class="logo">
        <div class="logo-inner">
            <img src="../../assets/icons/icon-6.png" alt="">
        </div>
      </div>
      <div class="logo">
        <div class="logo-inner">
            <img src="../../assets/icons/icon-8.png" alt="">
        </div>
      </div>
      <div class="logo">
        <div class="logo-inner">
            <img src="../../assets/icons/icon-9.png" alt="">
        </div>
      </div>
      <div class="logo">
        <div class="logo-inner">
            <img src="../../assets/icons/icon-10.png" alt="">
        </div>
      </div>
      <div class="logo">
        <div class="logo-inner">
            <img src="../../assets/icons/icon-11.png" alt="">
        </div>
      </div>
      <div class="logo">
        <div class="logo-inner">
            <img src="../../assets/icons/icon-12.png" alt="">
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped css>
.marquee-wrapper {
  width: 100%;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent, black 8%, black 92%, transparent);
}

.marquee-track {
  display: flex;
  animation: marquee 18s linear infinite;
  padding: 24px;
}

/* padding (not margin) keeps spacing symmetric at both ends of the set */
.logo {
  flex-shrink: 0;
  padding: 0 32px;
  height: 80px;
  display: flex;
  align-items: center;
}

.logo-inner {
  width: 160px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-inner img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: brightness(0) invert(1);
  opacity: 0.4;
}


@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(var(--marquee-offset)); }
}
</style>


<script setup>
import { ref, onMounted } from 'vue';
import img1 from '../assets/hero_images/img (1).png';
import img2 from '../assets/hero_images/img (2).png';
import img3 from '../assets/hero_images/img (3).png';
import img4 from '../assets/hero_images/img (4).png';
import img5 from '../assets/hero_images/img (5).png';
import img6 from '../assets/hero_images/img (6).png';
import img7 from '../assets/hero_images/img (7).png';
import img8 from '../assets/hero_images/img (8).png';
import img9 from '../assets/hero_images/img (9).png';
import img10 from '../assets/hero_images/img (10).png';
import img11 from '../assets/hero_images/img (11).png';
import img12 from '../assets/hero_images/img (12).png';
import img13 from '../assets/hero_images/img (13).png';
import img14 from '../assets/hero_images/img (14).png';
import img15 from '../assets/hero_images/img (15).png';
import img16 from '../assets/hero_images/img (16).png';
import img17 from '../assets/hero_images/img (17).png';

const currentSlide = ref(0);

// ✅ Each slide has its own heading — v-html will render <br> and <span> correctly
const slides = [
  { img: img1,  heading: "COMPETE.<br><span class='highlight'>PLAY.</span>DOMINATE."      },
  { img: img2,  heading: "RISE.<br><span class='highlight'>GRIND.</span>CONQUER."          },
  { img: img3,  heading: "TRAIN.<br><span class='highlight'>ADAPT.</span>WIN."             },
  { img: img4,  heading: "CLIMB.<br><span class='highlight'>OUTPLAY.</span>RULE."          },
  { img: img5,  heading: "TEAM.<br><span class='highlight'>SYNC.</span>DESTROY."           },
  { img: img6,  heading: "UNLOCK.<br><span class='highlight'>EARN.</span>FLEX."            },
  { img: img7,  heading: "EVOLVE.<br><span class='highlight'>LEVEL UP.</span>LEAD."        },
  { img: img8,  heading: "GRIND.<br><span class='highlight'>SURVIVE.</span>REIGN."         },
  { img: img9,  heading: "LONE.<br><span class='highlight'>WOLF.</span>LETHAL."            },
  { img: img10, heading: "FRAG.<br><span class='highlight'>CLIP.</span>IMMORTALIZE."       },
  { img: img11, heading: "PUSH.<br><span class='highlight'>EARN.</span>REPEAT."            },
  { img: img12, heading: "SCOUT.<br><span class='highlight'>DRAFT.</span>BUILD."           },
  { img: img13, heading: "WATCH.<br><span class='highlight'>LEARN.</span>DESTROY."         },
  { img: img14, heading: "LIVE.<br><span class='highlight'>STREAM.</span>DOMINATE."        },
  { img: img15, heading: "LEGEND.<br><span class='highlight'>STATUS.</span>LOCKED."        },
  { img: img16, heading: "QUALIFY.<br><span class='highlight'>COMPETE.</span>ASCEND."      },
  { img: img17, heading: "FIGHT.<br><span class='highlight'>BLEED.</span>TRIUMPH."         },
];

const totalSlides = ref(slides.length);

const to_left = () => {
    currentSlide.value = (currentSlide.value - 1 + totalSlides.value) % totalSlides.value;
}

const to_right = () => {
    currentSlide.value = (currentSlide.value + 1) % totalSlides.value;
}

// onMounted(() => {
//     setInterval(() => {
//         currentSlide.value = (currentSlide.value + 1) % totalSlides.value;
//     }, 3000);
// });
</script>

<template>
    <div class="container">
        
        <div class="slider">
            <div
                class="slide"
                v-for="(slide, index) in slides"
                :key="index"
                :class="{ active: currentSlide === index }"
            >
                <div class="bg-text">
                    <!-- ✅ v-html renders <br> and <span class="highlight"> as actual HTML -->
                    <h1 v-html="slide.heading"></h1>
                </div>
                <div class="image">
                    <img :src="slide.img" alt="">
                </div>
                <div class="fade-effect"></div>
            </div>
            <div class="buttons">
                <button class="to-left nav-btns" @click="to_left">
                    <
                </button>
                <button class="to-right nav-btns" @click="to_right">
                    >
                </button>
            </div>
        </div>
    </div>
    <div class="bodytest"></div>
</template>

<style scoped>
.container {
    width: 100%;
    height: 95vh;
    background: url('../assets/backgrounds/bg2.jpg');
}

.bg-text h1 {
    font-size: 160px;
    color: var(--text_body);
    text-align: center;
    line-height: 1;
}


.bg-text {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
}

.image {
    position: absolute;
    bottom: 0%;
    left: 50%;
    transform: translateX(-50%);
    width: 90%;
    height: 90%;
    overflow: hidden;
}

img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.slider {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.slide {
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 0.8s ease-in-out;
}

.slide.active {
    opacity: 1;
    z-index: 2;
}

.slide:not(.active) {
    opacity: 0;
}

/* Image slides in from the left */
.slide .image {
    transform: translateX(-60px);
    transition: transform 0.8s ease-in-out, opacity 0.8s ease-in-out;
    opacity: 0;
}

.slide.active .image {
    transform: translateX(-50%);  /* keeps your existing centering */
    opacity: 1;
}

/* Text fades in slightly after image */
.slide .bg-text h1 {
    opacity: 0;
    transition: opacity 0.9s ease-in-out 0.2s; /* 0.2s delay */
}

.slide.active .bg-text h1 {
    opacity: 1;
}
.nav-btns:hover{
    cursor: pointer;
}
.buttons{
    position: absolute;
    z-index: 1000;
    bottom: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 4px;
}

.nav-btns{
    padding: 8px;
    font-size: 18px;
    border-radius: none;
    border: none;
    outline: none;
    color: var(--bg);
    font-weight: 600;
    background: #45bf8a40;
}
.fade-effect{
    width: 100%;
    height: 25%;
    position: absolute;
    bottom: 0;
    left: 0;
    background: linear-gradient(transparent,var(--bg));
    z-index: 200
}
.bodytest{
    width: 100%;
    height: 200vh;
}
</style>
<script setup>
import GameCard from './GameCard.vue';
import { ref } from 'vue';

const offset = ref(0);
const STEP = 316; // px to scroll per click


const move_right = () => {
    const slider = document.querySelector('.card-slider');
    const containerWidth = slider.parentElement.offsetWidth;
    const sliderWidth = slider.scrollWidth;
    const minOffset = -(sliderWidth - containerWidth);

    offset.value = Math.max(offset.value - STEP, minOffset);
};

const move_left = () => {
    offset.value += STEP;
    if (offset.value > 0) offset.value = 0; // don't go past start
};
</script>

<template>
    <div class="container">
        <section class="games">
            <div class="heading">
                <h1>Featured</h1>
            </div>
            <div class="cards-container">
            <button class="left" @click="move_left"> < </button>
                <div class="card-slider" :style="{ transform: `translateX(${offset}px)` }">
                    <GameCard />
                    <GameCard />
                    <GameCard />
                    <GameCard />
                    <GameCard />
                    <GameCard />
                    <GameCard />
                    <GameCard />
                    <GameCard />
                    <GameCard />
                    <GameCard />
                </div>
                <button class="right" @click="move_right"> > </button>
            </div>
        </section>
    </div>
</template>

<style scoped>
.container{
    width: 100%;
    padding: 16px;
}

.heading{
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
}

h1{
    font-size: 60px;
    border-bottom: 4px solid var(--primary);
    width: fit-content;
    padding: 8px;
    line-height: 2rem;
    font-weight: 600;
    letter-spacing: 8px;
}
.cards-container{
    width: 95%;
    height: 400px;
    position: relative;
    overflow: hidden;
    margin: 32px auto;
    display: flex;
    justify-content: center;
    align-items: center;
}
.card-slider{
    width: max-content;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 16px;
    position: absolute;
    top: 0;
    left: 0;
    /* keep everything you have, just add: */
    transition: transform 0.4s ease;
}
.left{
    position: absolute;
    top: 50%;
    left: 0;
    font-size: 18px;
    font-weight: 500;
    border: none;
    padding: 8px;
    color: var(--bg);
    background: var(--primary);
    z-index: 100;
    cursor: pointer;
}   
.right{
    position: absolute;
    top: 50%;
    right: 0;
    font-size: 18px;
    font-weight: 500;
    border: none;
    padding: 8px;
    color: var(--bg);
    background: var(--primary);
    z-index: 100;
    cursor: pointer;
}   
</style>
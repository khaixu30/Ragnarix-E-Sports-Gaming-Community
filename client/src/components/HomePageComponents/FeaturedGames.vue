<script setup>
import { onMounted, ref } from 'vue';
import Card from './GamesCard.vue';

const games = ref([]);
const error = ref(null);
const loading = ref(false);

const loadGames = async () => {
    loading.value = true;
    try{
        const response = await fetch('http://localhost:3000/api/game/');
        if(!response.ok){
            throw new Error(`Fetch failed: ${response.status}`);
            error.value = response.status;
        }

        const gameJSON = await response.json();
        games.value = gameJSON.data || [];

    } catch(err) {
        console.log(err);
        error.value = err;
        throw new Error("Unexpected Error: " . err);
    } finally {
        loading.value = false;
    }
}

onMounted(()=>{
    loadGames();
})

</script>

<template>
    <div class="container">
        <div class="custom-bg">
            <img src="../../assets/backgrounds/bg3.jpg" alt="">
        </div>
        <div class="headings">
            <h1 class="heading">Featured Games</h1>
        </div>
        <div class="cards-container">
            <Card v-for="(game, index) in games"
                :name="game.name"
                :id="game.id"
                :logo_url="game.logo_url"
                :rating="game.rating"
                :description="game.description"
             />
        </div>
    </div>
</template>

<style css scoped>
.container{
    width: 100%;
    padding: 32px;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    gap: 32px;
    position: relative;
}

.custom-bg{
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: -10;
    clip-path: polygon(100% 0, 99% 64%, 0 100%, 0 36%);
    opacity: 0.4;
}

.custom-bg img{
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.heading{
    font-size: 44px;
    padding-top: 8px;
    border-bottom: 2px solid var(--primary-color);
}

.cards-container{
    width: 100%;
    overflow-x: scroll;
    display: flex;
    gap: 20px;
}

::-webkit-scrollbar{
    display: none;
}

.error-message {
    color: #ff6b6b;
    padding: 15px;
    background-color: #ffe0e0;
    border-radius: 4px;
    margin-bottom: 20px;
    font-weight: 500;
}

.status-message {
    color: #666;
    padding: 15px;
    text-align: center;
    font-size: 16px;
}
</style>
<script setup>
import Hero from '../components/HomePageComponents/Hero.vue';
import HeroMarquee from '../components/HomePageComponents/HeroMarquee.vue';
import Navbar from '../components/Navbar.vue';
import UpcomingEvents from '../components/HomePageComponents/UpcomingEvents.vue';
import FeaturedGames from '../components/HomePageComponents/FeaturedGames.vue';
import Footer from '../components/Footer.vue';
import LoginDiv from '../components/HomePageComponents/LoginDiv.vue';
import { ref } from 'vue';

const isLoggedIn = ref(false);

const checkLoggedIn = () => {
    const token = localStorage.getItem('token')
    if(token){
        isLoggedIn.value = true;
    }
}
</script>

<template>
    <Navbar />
    <Hero />
    <HeroMarquee />
    <UpcomingEvents />
    <FeaturedGames />
    <LoginDiv v-if="isLoggedIn" />
    <Footer />
</template>
<script setup>
import Hero from '../components/HomePageComponents/Hero.vue';
import HeroMarquee from '../components/HomePageComponents/HeroMarquee.vue';
import Navbar from '../components/Navbar.vue';
import UpcomingEvents from '../components/HomePageComponents/UpcomingEvents.vue';
import FeaturedGames from '../components/HomePageComponents/FeaturedGames.vue';
import Footer from '../components/Footer.vue';
import LoginDiv from '../components/HomePageComponents/LoginDiv.vue';
</script>

<template>
    <Navbar />
    <Hero />
    <HeroMarquee />
    <UpcomingEvents />
    <FeaturedGames />
    <LoginDiv />
    <Footer />
</template>
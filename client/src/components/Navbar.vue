<script setup>

</script>

<template>
    <div class="container">
        <div class="left">
            <div class="logo-container">
                <div class="logo-head">
                    R
                </div>
                <div class="logo-text">
                    Ragnarix
                </div>
            </div>
        </div>
        <div class="center">
            <ul class="links-container">
                <li><a href="">Home</a></li>
                <li><a href="">Events</a></li>
                <li><a href="">Leaderboard</a></li>
                <li><a href="/about">About</a></li>
            </ul>
        </div>
        <div class="right">
            <div class="auth-links">
                <a class="btn btn-1" href="">Signup</a>
                <a class="btn btn-2" href="">Login</a>
            </div>
        </div>
    </div>
</template>

<style css scoped>
.container{
    width: 100%;
    padding: 16px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 10;
}

.logo-container{
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
}

.logo-head{
    width: 40px;
    height: 40px;
    background: var(--primary-color);
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 24px;
    font-weight: 700;
}

.logo-text{
    font-size: 22px;
    font-weight: 700;
}

.links-container{
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
}

.auth-links{
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
}
</style>
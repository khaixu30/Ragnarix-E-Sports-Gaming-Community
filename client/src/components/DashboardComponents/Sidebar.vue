<script setup>

</script>

<template>
    <div class="container">
        <div class="container-semi">
            <div class="top">
                <a class="logo" href="/">
                    <div class="logo-icon">R</div>
                    <span class="logo-text">Ragnarix</span>
                </a>
            </div>
            <div class="center">
                <div class="nav-links">
                    <a class="nav-link" href=""><i class="fa-solid fa-gauge"></i> Dashboard</a>
                    <a class="nav-link" href=""><i class="fa-solid fa-calendar-days"></i> Events</a>
                    <a class="nav-link" href=""><i class="fa-solid fa-clipboard"></i> Registrations</a>
                    <a class="nav-link" href=""><i class="fa-solid fa-user-group"></i> Friends</a>
                    <a class="nav-link" href=""><i class="fa-solid fa-comment"></i> Chats</a>
                    <a class="nav-link" href=""><i class="fa-solid fa-landmark"></i> Council</a>
                </div>
            </div>
        </div>
        <div class="bottom">
            <div class="profile">
                <a href="" class="profile-nav-link">
                    <div class="img-container">
                        <img src="../../assets/hero_images/img (14).png" alt="">
                    </div>
                    Username
                </a>
            </div>
            <div class="logout-btn-container">
                <a href="" class="logout-btn"><i class="fa-solid fa-right-from-bracket"></i> Logout</a>
            </div>
        </div>
    </div>
</template>

<style scoped css>
.container {
    width: 250px;
    height: 100vh;
    background: rgba(255, 255, 255, 0.06);
    padding: 24px;
    display: flex;
    justify-content: space-between;
    flex-direction: column;
}

.nav-link,
.logout-btn {
    padding: 12px;
    display: block;
    border-radius: 8px;
    border: 1px solid transparent;
    margin: 8px 0;
    transition: all 0.3s ease;
}

.nav-link:hover,
.logout-btn:hover {
    color: var(--text-color);
    border: 1px solid var(--primary-color);
    background: var(--bg-color);
}

/* ── Logo ── */
.logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    flex-shrink: 0;
}

.logo-icon {
    width: 38px;
    height: 38px;
    background: var(--primary-color);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 900;
    color: #fff;
}

.logo-text {
    font-size: 20px;
    font-weight: 800;
    color: var(--text-color);
    letter-spacing: 0.03em;
}

a {
    font-size: 14px;
}

.profile-nav-link {
    display: flex;
    align-items: center;
    padding: 8px;
    border: 1px solid transparent;
    gap: 12px;
    font-size: 16px;
    border-radius: 8px;
    margin: 8px 0;
}

.profile-nav-link:hover {
    border: 1px solid var(--primary-color);
    background: var(--bg-color);
    color: var(--text-color);
}

.img-container {
    width: 50px;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: orange;
    border-radius: 8px;
}


img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
</style>

<template>
    <footer>
        <div class="footer-container">

            <!-- Brand -->
            <div class="footer-brand">
                <div class="brand-logo">
                    <div class="logo-container">
                        <div class="logo-head">
                            R
                        </div>
                        <div class="logo-text">
                            Ragnarix
                        </div>
                    </div>
                </div>
                <p class="brand-tagline">Where champions are made. Join the competitive gaming community and prove your
                    skills on the battlefield.</p>
                <div class="social-links">
                    <a href="#" aria-label="Twitter"><i class="fa-brands fa-x-twitter"></i></a>
                    <a href="#" aria-label="Discord"><i class="fa-brands fa-discord"></i></a>
                    <a href="#" aria-label="Twitch"><i class="fa-brands fa-twitch"></i></a>
                    <a href="#" aria-label="YouTube"><i class="fa-brands fa-youtube"></i></a>
                    <a href="#" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
                </div>
            </div>

            <!-- Quick Links -->
            <div class="footer-col">
                <h3 class="col-heading">
                    <i class="fa-solid fa-bolt"></i> Quick Links
                </h3>
                <ul>
                    <li><a href="/"><i class="fa-solid fa-chevron-right"></i> Home</a></li>
                    <li><a href="/events"><i class="fa-solid fa-chevron-right"></i> Events</a></li>
                    <li><a href="/games"><i class="fa-solid fa-chevron-right"></i> Games</a></li>
                    <li><a href="/leaderboard"><i class="fa-solid fa-chevron-right"></i> Leaderboard</a></li>
                    <li><a href="/about"><i class="fa-solid fa-chevron-right"></i> About Us</a></li>
                </ul>
            </div>

            <!-- Support -->
            <div class="footer-col">
                <h3 class="col-heading">
                    <i class="fa-solid fa-headset"></i> Support
                </h3>
                <ul>
                    <li><a href="/faq"><i class="fa-solid fa-chevron-right"></i> FAQ</a></li>
                    <li><a href="/rules"><i class="fa-solid fa-chevron-right"></i> Tournament Rules</a></li>
                    <li><a href="/contact"><i class="fa-solid fa-chevron-right"></i> Contact Us</a></li>
                    <li><a href="/privacy"><i class="fa-solid fa-chevron-right"></i> Privacy Policy</a></li>
                    <li><a href="/terms"><i class="fa-solid fa-chevron-right"></i> Terms of Service</a></li>
                </ul>
            </div>

            <!-- Contact -->
            <div class="footer-col">
                <h3 class="col-heading">
                    <i class="fa-solid fa-address-card"></i> Contact
                </h3>
                <ul class="contact-list">
                    <li>
                        <i class="fa-solid fa-envelope"></i>
                        <span>support@ragnarix.gg</span>
                    </li>
                    <li>
                        <i class="fa-solid fa-phone"></i>
                        <span>+1 (800) Ragnarix</span>
                    </li>
                    <li>
                        <i class="fa-solid fa-location-dot"></i>
                        <span>123 Arena Blvd, Gaming District, CA 90210</span>
                    </li>
                    <li>
                        <i class="fa-solid fa-clock"></i>
                        <span>Support: Mon - Fri, 9am - 6pm</span>
                    </li>
                </ul>
            </div>

        </div>

        <!-- Divider -->
        <div class="footer-divider">
            <div class="divider-line"></div>
            <i class="fa-solid fa-skull-crossbones divider-icon"></i>
            <div class="divider-line"></div>
        </div>

        <!-- Bottom bar -->
        <div class="footer-bottom">
            <p class="copyright">
                <i class="fa-regular fa-copyright"></i> 2026 Ragnarix. All rights reserved.
            </p>
            <div class="bottom-badges">
                <span><i class="fa-solid fa-shield-halved"></i> Secure Payments</span>
                <span><i class="fa-solid fa-trophy"></i> Verified Tournaments</span>
                <span><i class="fa-solid fa-users"></i> 10K+ Players</span>
            </div>
        </div>
    </footer>
</template>

<style scoped>
footer {
    background-color: var(--bg-color);
    color: var(--text-color);
    padding: 64px 48px 32px;
    border-top: 2px solid var(--primary-color);
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

/* ── Grid ── */
.footer-container {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1.5fr;
    gap: 48px;
}

/* ── Brand ── */
.brand-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
}

.brand-logo i {
    font-size: 2rem;
    color: var(--primary-color);
}

.brand-logo span {
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    color: var(--text-color);
    text-transform: uppercase;
}

.brand-tagline {
    font-size: 0.85rem;
    line-height: 1.7;
    opacity: 0.65;
    margin-bottom: 24px;
    max-width: 280px;
}

.social-links {
    display: flex;
    gap: 12px;
}

.social-links a {
    width: 38px;
    height: 38px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: var(--bg-slight-trans-color);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-color);
    font-size: 20px;
    text-decoration: none;
    transition: all 0.2s ease;
}

.social-links a:hover {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: var(--text-color);
    transform: translateY(-3px);
}

/* ── Columns ── */
.col-heading {
    font-size: 16px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--primary-color);
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.footer-col ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.footer-col ul li a {
    color: var(--text-color);
    text-decoration: none;
    font-size: 14px;
    opacity: 0.7;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
}

.footer-col ul li a i {
    font-size: 14px;
    color: var(--primary-color);
    transition: transform 0.2s ease;
}

.footer-col ul li a:hover {
    opacity: 1;
    color: var(--hover-color);
    padding-left: 4px;
}

.footer-col ul li a:hover i {
    transform: translateX(3px);
}

/* ── Contact ── */
.contact-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.contact-list li {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    font-size: 14px;
    opacity: 0.75;
}

.contact-list li i {
    color: var(--primary-color);
    margin-top: 2px;
    width: 16px;
    flex-shrink: 0;
}

/* ── Divider ── */
.footer-divider {
    max-width: 1200px;
    margin: 48px auto 32px;
    display: flex;
    align-items: center;
    gap: 16px;
}

.divider-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(188, 103, 33, 0.4), transparent);
}

.divider-icon {
    color: var(--primary-color);
    opacity: 0.6;
    font-size: 20px;
}

/* ── Bottom bar ── */
.footer-bottom {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
}

.copyright {
    font-size: 12px;
    opacity: 0.5;
    display: flex;
    align-items: center;
    gap: 6px;
}

.bottom-badges {
    display: flex;
    gap: 24px;
}

.bottom-badges span {
    font-size: 12px;
    opacity: 0.5;
    display: flex;
    align-items: center;
    gap: 6px;
}

.bottom-badges span i {
    color: var(--primary-color);
    opacity: 1;
}

/* ── Responsive ── */
@media (max-width: 900px) {
    .footer-container {
        grid-template-columns: 1fr 1fr;
    }

    .footer-brand {
        grid-column: 1 / -1;
    }
}

@media (max-width: 560px) {
    footer {
        padding: 48px 24px 24px;
    }

    .footer-container {
        grid-template-columns: 1fr;
        gap: 32px;
    }

    .footer-bottom {
        flex-direction: column;
        text-align: center;
    }

    .bottom-badges {
        flex-wrap: wrap;
        justify-content: center;
        gap: 16px;
    }
}
</style>
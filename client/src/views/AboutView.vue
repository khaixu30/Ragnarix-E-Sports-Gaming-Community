<script setup>
import Navbar from '../components/Navbar.vue';
import Footer from '../components/Footer.vue';

</script>

<template>
    <Navbar />

    <div class="page">

        <!-- Hero -->
        <section class="hero">
            <div class="hero-content">
                <p class="hero-label"><i class="fa-solid fa-database"></i> DBMS Project — Spring 2025</p>
                <h1>About <span>Ragnarix</span></h1>
                <p class="hero-desc">
                    Ragnarix is a university project built to demonstrate real-world applications of
                    Database Management Systems through a fully functional competitive gaming platform.
                </p>
            </div>
            <div class="hero-badge">
                <i class="fa-solid fa-server"></i>
            </div>
        </section>

        <!-- Project Purpose -->
        <section class="section alt">
            <div class="section-inner two-col">
                <div>
                    <p class="section-label"><i class="fa-solid fa-lightbulb"></i> The Idea</p>
                    <h2>Why a <span>Gaming Platform?</span></h2>
                    <p>
                        Instead of a textbook example, we wanted to build something real —
                        a platform people would actually use. Competitive gaming involves
                        complex, interconnected data: players, teams, tournaments, results,
                        leaderboards. It's the perfect domain to showcase what a well-designed
                        relational database can do.
                    </p>
                    <p>
                        Every feature on Ragnarix — from event registration to live leaderboards —
                        is backed by a normalized PostgreSQL database with real constraints,
                        relationships, and queries.
                    </p>
                </div>
                <div class="concept-list">
                    <div class="concept-item">
                        <div class="concept-icon"><i class="fa-solid fa-table"></i></div>
                        <div>
                            <p class="concept-title">Relational Schema Design</p>
                            <p class="concept-desc">Normalized tables across players, events, games, councils, and registrations with proper foreign key constraints.</p>
                        </div>
                    </div>
                    <div class="concept-item">
                        <div class="concept-icon"><i class="fa-solid fa-link"></i></div>
                        <div>
                            <p class="concept-title">Entity Relationships</p>
                            <p class="concept-desc">One-to-many and many-to-many relationships modeled between councils, events, games, and participants.</p>
                        </div>
                    </div>
                    <div class="concept-item">
                        <div class="concept-icon"><i class="fa-solid fa-shield-halved"></i></div>
                        <div>
                            <p class="concept-title">Data Integrity</p>
                            <p class="concept-desc">CHECK constraints, NOT NULL rules, ON DELETE CASCADE, and UUID primary keys enforcing consistency.</p>
                        </div>
                    </div>
                    <div class="concept-item">
                        <div class="concept-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
                        <div>
                            <p class="concept-title">Complex Queries</p>
                            <p class="concept-desc">JOINs, aggregations, subqueries, and filtered results powering leaderboards, event listings, and stats.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Schema Highlight -->
        <section class="section">
            <p class="section-label"><i class="fa-solid fa-diagram-project"></i> Database Design</p>
            <h2>Core <span>Tables & Relationships</span></h2>
            <p class="section-desc">The platform is built on six core entities, each mapped to a relational table with defined constraints and relationships.</p>

            <div class="schema-grid">
                <div class="schema-card">
                    <div class="schema-icon"><i class="fa-solid fa-users"></i></div>
                    <p class="schema-name">users</p>
                    <p class="schema-desc">Stores player accounts, credentials, and profile data. Central to registrations and leaderboard rankings.</p>
                    <div class="schema-tags">
                        <span>UUID PK</span><span>Auth</span><span>Profile</span>
                    </div>
                </div>
                <div class="schema-card">
                    <div class="schema-icon"><i class="fa-solid fa-gamepad"></i></div>
                    <p class="schema-name">games</p>
                    <p class="schema-desc">Catalog of supported games with system requirements stored as JSON and ratings tracked per game.</p>
                    <div class="schema-tags">
                        <span>JSON Field</span><span>Rating</span>
                    </div>
                </div>
                <div class="schema-card">
                    <div class="schema-icon"><i class="fa-solid fa-people-group"></i></div>
                    <p class="schema-name">councils</p>
                    <p class="schema-desc">University gaming councils that organize and own events. One council can manage many events.</p>
                    <div class="schema-tags">
                        <span>1-to-Many</span><span>Owner</span>
                    </div>
                </div>
                <div class="schema-card">
                    <div class="schema-icon"><i class="fa-solid fa-trophy"></i></div>
                    <p class="schema-name">events</p>
                    <p class="schema-desc">The heart of the platform. References councils and games. Enforces type, status, deadlines, and fee constraints.</p>
                    <div class="schema-tags">
                        <span>FK: council</span><span>FK: game</span><span>CHECK</span>
                    </div>
                </div>
                <div class="schema-card">
                    <div class="schema-icon"><i class="fa-solid fa-file-signature"></i></div>
                    <p class="schema-name">registrations</p>
                    <p class="schema-desc">Junction table linking users to events. Handles solo and team entries, payment status, and timestamps.</p>
                    <div class="schema-tags">
                        <span>Junction</span><span>Many-to-Many</span>
                    </div>
                </div>
                <div class="schema-card">
                    <div class="schema-icon"><i class="fa-solid fa-ranking-star"></i></div>
                    <p class="schema-name">leaderboards</p>
                    <p class="schema-desc">Aggregated results per event and overall. Populated via triggers or computed queries after event completion.</p>
                    <div class="schema-tags">
                        <span>Aggregation</span><span>Rankings</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- Tech Stack -->
        <section class="section alt">
            <p class="section-label"><i class="fa-solid fa-screwdriver-wrench"></i> Tech Stack</p>
            <h2>What We <span>Built With</span></h2>
            <div class="stack-grid">
                <div class="stack-item">
                    <i class="fa-brands fa-vuejs"></i>
                    <p class="stack-name">Vue.js 3</p>
                    <p class="stack-role">Frontend Framework</p>
                </div>
                <div class="stack-item">
                    <i class="fa-brands fa-node-js"></i>
                    <p class="stack-name">Node.js</p>
                    <p class="stack-role">Backend Runtime</p>
                </div>
                <div class="stack-item">
                    <i class="fa-solid fa-database"></i>
                    <p class="stack-name">PostgreSQL</p>
                    <p class="stack-role">Relational Database</p>
                </div>
                <div class="stack-item">
                    <i class="fa-solid fa-plug"></i>
                    <p class="stack-name">Express.js</p>
                    <p class="stack-role">REST API</p>
                </div>
            </div>
        </section>

        <!-- Team -->
        <section class="section">
            <p class="section-label"><i class="fa-solid fa-user-group"></i> The Team</p>
            <h2>Meet the <span>Developers</span></h2>
            <div class="team-grid">
                <div class="team-card">
                    <div class="team-avatar">IA</div>
                    <p class="team-name">Iftikhar Ahmed</p>
                    <p class="team-role">Full Stack & DB Design</p>
                    <p class="team-bio">Designed the relational schema, wrote the backend API, and led frontend architecture.</p>
                </div>
                <div class="team-card">
                    <div class="team-avatar">MS</div>
                    <p class="team-name">Maliha Shah</p>
                    <p class="team-role">Frontend & UI</p>
                    <p class="team-bio">Built the Vue components, designed the UI system, and handled state management.</p>
                </div>
                <div class="team-card">
                    <div class="team-avatar">HA</div>
                    <p class="team-name">Hafsa Abbasi</p>
                    <p class="team-role">Database & Queries</p>
                    <p class="team-bio">Wrote complex SQL queries, seeded the database, and handled normalization.</p>
                </div>
            </div>
        </section>

        <!-- Course Info -->
        <section class="cta-section">
            <i class="fa-solid fa-graduation-cap cta-icon"></i>
            <h2>Submitted for <span>Database Management Systems</span></h2>
            <p>BS Computer Science &nbsp;·&nbsp; Spring Semester 2026 &nbsp;·&nbsp; University Project</p>
            <div class="cta-chips">
                <span><i class="fa-solid fa-check"></i> Normalized to 3NF</span>
                <span><i class="fa-solid fa-check"></i> RESTful API</span>
                <span><i class="fa-solid fa-check"></i> Referential Integrity</span>
                <span><i class="fa-solid fa-check"></i> Real Data</span>
            </div>
        </section>

    </div>
    <Footer />
</template>

<style scoped>
.page {
    background: #1a1410;
    color: var(--text-color);
    font-family: inherit;
}

/* ── Hero ── */
.hero {
    background: var(--bg-color);
    border-bottom: 2px solid var(--primary-color);
    padding: 72px 64px 56px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 32px;
}

.hero-label {
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--primary-color);
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.hero h1 {
    font-size: 52px;
    font-weight: 900;
    text-transform: uppercase;
    line-height: 1.05;
    margin-bottom: 18px;
}

.hero h1 span {
    color: var(--primary-color);
}

.hero-desc {
    font-size: 15px;
    opacity: 0.65;
    max-width: 520px;
    line-height: 1.75;
}

.hero-badge {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 2px solid rgba(188, 103, 33, 0.3);
    background: rgba(188, 103, 33, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    color: var(--primary-color);
    flex-shrink: 0;
}

/* ── Sections ── */
.section {
    padding: 64px;
}

.section.alt {
    background: var(--bg-color);
    border-top: 1px solid rgba(188, 103, 33, 0.15);
    border-bottom: 1px solid rgba(188, 103, 33, 0.15);
}

.section-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--primary-color);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.section h2 {
    font-size: 32px;
    font-weight: 900;
    text-transform: uppercase;
    margin-bottom: 16px;
}

.section h2 span {
    color: var(--primary-color);
}

.section p {
    font-size: 14px;
    opacity: 0.65;
    line-height: 1.8;
    max-width: 600px;
}

.section p + p {
    margin-top: 14px;
}

.section-desc {
    margin-bottom: 36px;
}

/* ── Two Col ── */
.two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 64px;
    align-items: start;
}

/* ── Concepts ── */
.concept-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.concept-item {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    background: rgba(188, 103, 33, 0.05);
    border: 1px solid rgba(188, 103, 33, 0.15);
    border-radius: 10px;
    padding: 16px;
}

.concept-icon {
    width: 38px;
    height: 38px;
    border-radius: 8px;
    background: rgba(188, 103, 33, 0.15);
    border: 1px solid rgba(188, 103, 33, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary-color);
    font-size: 15px;
    flex-shrink: 0;
}

.concept-title {
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 4px;
    opacity: 1 !important;
}

.concept-desc {
    font-size: 12px;
    opacity: 0.55 !important;
    line-height: 1.6;
    max-width: 100% !important;
}

/* ── Schema Grid ── */
.schema-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-top: 32px;
}

.schema-card {
    background: var(--bg-color);
    border: 1px solid rgba(188, 103, 33, 0.2);
    border-radius: 12px;
    padding: 24px;
    transition: border-color 0.2s, transform 0.2s;
}

.schema-card:hover {
    border-color: var(--primary-color);
    transform: translateY(-3px);
}

.schema-icon {
    font-size: 22px;
    color: var(--primary-color);
    margin-bottom: 12px;
}

.schema-name {
    font-size: 14px;
    font-weight: 900;
    font-family: monospace;
    color: var(--primary-color);
    margin-bottom: 8px;
    letter-spacing: 0.04em;
}

.schema-desc {
    font-size: 12px;
    opacity: 0.6;
    line-height: 1.6;
    margin-bottom: 14px;
    max-width: 100% !important;
}

.schema-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.schema-tags span {
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(188, 103, 33, 0.12);
    border: 1px solid rgba(188, 103, 33, 0.25);
    color: var(--hover-color);
}

/* ── Stack ── */
.stack-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-top: 32px;
}

.stack-item {
    background: rgba(188, 103, 33, 0.05);
    border: 1px solid rgba(188, 103, 33, 0.2);
    border-radius: 12px;
    padding: 32px 16px;
    text-align: center;
    transition: border-color 0.2s;
}

.stack-item:hover {
    border-color: var(--primary-color);
}

.stack-item i {
    font-size: 36px;
    color: var(--primary-color);
    margin-bottom: 14px;
    display: block;
}

.stack-name {
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 4px;
    opacity: 1 !important;
    max-width: 100% !important;
}

.stack-role {
    font-size: 11px;
    opacity: 0.5 !important;
    max-width: 100% !important;
}

/* ── Team ── */
.team-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-top: 32px;
}

.team-card {
    background: var(--bg-color);
    border: 1px solid rgba(188, 103, 33, 0.15);
    border-radius: 12px;
    padding: 32px 24px;
    text-align: center;
    transition: border-color 0.2s;
}

.team-card:hover {
    border-color: var(--primary-color);
}

.team-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: rgba(188, 103, 33, 0.15);
    border: 2px solid rgba(188, 103, 33, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 900;
    color: var(--primary-color);
    margin: 0 auto 16px;
}

.team-name {
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 4px;
}

.team-role {
    font-size: 11px;
    color: var(--primary-color);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 12px;
}

.team-bio {
    font-size: 12px;
    opacity: 0.55;
    line-height: 1.6;
}

/* ── CTA ── */
.cta-section {
    background: var(--bg-color);
    border-top: 2px solid var(--primary-color);
    padding: 64px;
    text-align: center;
}

.cta-icon {
    font-size: 40px;
    color: var(--primary-color);
    margin-bottom: 20px;
    display: block;
}

.cta-section h2 {
    font-size: 28px;
    font-weight: 900;
    text-transform: uppercase;
    margin-bottom: 10px;
}

.cta-section h2 span {
    color: var(--primary-color);
}

.cta-section p {
    font-size: 13px;
    opacity: 0.5;
    margin-bottom: 28px;
    letter-spacing: 0.04em;
}

.cta-chips {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
}

.cta-chips span {
    font-size: 12px;
    font-weight: 600;
    padding: 8px 20px;
    border-radius: 999px;
    border: 1px solid rgba(188, 103, 33, 0.35);
    background: rgba(188, 103, 33, 0.1);
    color: var(--hover-color);
    display: flex;
    align-items: center;
    gap: 8px;
}

.cta-chips span i {
    color: var(--primary-color);
}

/* ── Responsive ── */
@media (max-width: 900px) {
    .hero { flex-direction: column; padding: 48px 32px; }
    .hero-badge { display: none; }
    .two-col { grid-template-columns: 1fr; gap: 32px; }
    .schema-grid { grid-template-columns: 1fr 1fr; }
    .stack-grid { grid-template-columns: 1fr 1fr; }
    .team-grid { grid-template-columns: 1fr 1fr; }
    .section { padding: 48px 32px; }
    .cta-section { padding: 48px 32px; }
}

@media (max-width: 560px) {
    .hero h1 { font-size: 36px; }
    .schema-grid { grid-template-columns: 1fr; }
    .stack-grid { grid-template-columns: 1fr 1fr; }
    .team-grid { grid-template-columns: 1fr; }
}
</style>
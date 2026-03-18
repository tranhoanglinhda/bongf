<template>
  <section class="hero">
    <div class="mist" />
    <div class="hero-content">
      <p class="eyebrow">BongF • Fitness With Bong</p>
      <h1>Move Slow, Train Deep, <span>Live Wild</span></h1>
      <p class="lead">
        Discover vintage-inspired fitness rooted in nature through stories, curated products,
        and gifts designed for your wellness journey.
      </p>
      <div class="cta-row">
        <RouterLink to="/shop" class="btn btn-primary">Explore Shop</RouterLink>
        <RouterLink to="/blog" class="btn btn-outline">Read Blog</RouterLink>
      </div>
    </div>
  </section>

  <section class="home-cards">
    <article class="home-card">
      <h2>Expert Blog</h2>
      <p>Read practical guides on training, recovery, nutrition, and long-term fitness mindset.</p>
      <RouterLink to="/blog" class="text-link">View Posts</RouterLink>
    </article>

    <article class="home-card">
      <h2>Shop Amazon / Shopee</h2>
      <p>Browse handpicked equipment and accessories grouped by marketplace for easy shopping.</p>
      <RouterLink to="/shop" class="text-link">Browse Products</RouterLink>
    </article>

    <article class="home-card">
      <h2>Claim Gifts</h2>
      <p>Submit your Gmail to receive exclusive BongF gifts and updates.</p>
      <RouterLink to="/gift" class="text-link">Get Gift</RouterLink>
    </article>
  </section>
</template>

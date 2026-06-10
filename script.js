const API_URL = '/api/movies/now_playing?language=ko-KR&region=KR&page=1';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

const RANK_LABELS = ['1위', '2위', '3위'];

const TABS = {
  nowPlaying: {
    heading: '현재 상영 중인 영화',
    badge: '현재 상영',
    filter: (movies) => movies,
  },
  popular: {
    heading: '인기 영화 TOP 3',
    badge: '인기',
    filter: (movies) =>
      [...movies].sort((a, b) => b.vote_average - a.vote_average).slice(0, 3),
    showRank: true,
  },
  newRelease: {
    heading: '신작 영화 TOP 3',
    badge: '신작',
    filter: (movies) =>
      [...movies]
        .sort((a, b) => new Date(b.release_date) - new Date(a.release_date))
        .slice(0, 3),
    showRank: true,
  },
};

const movieList = document.getElementById('movie-list');
const loading = document.getElementById('loading');
const heroTitle = document.getElementById('hero-title');
const heroDate = document.getElementById('hero-date');
const heroRating = document.getElementById('hero-rating');
const heroMeta = document.getElementById('hero-meta');
const heroOverview = document.getElementById('hero-overview');
const heroBadge = document.querySelector('.hero__badge');
const moviesHeading = document.getElementById('movies-heading');
const hero = document.getElementById('hero');
const header = document.querySelector('.header');
const navLinks = document.querySelectorAll('.nav__link');
const paywall = document.getElementById('paywall');
const paywallBackdrop = document.getElementById('paywall-backdrop');
const paywallClose = document.getElementById('paywall-close');
const paywallPoster = document.getElementById('paywall-poster');
const paywallTitle = document.getElementById('paywall-title');

let allMovies = [];
let currentTab = 'nowPlaying';

const KOREAN_REGEX = /[\uAC00-\uD7A3]/;
const LATIN_REGEX = /^[A-Za-z0-9\s:,'."\-!?&()+]+$/;

function hasKorean(text) {
  return KOREAN_REGEX.test(text || '');
}

function isReadableLatin(text) {
  return LATIN_REGEX.test((text || '').trim());
}

function getDisplayTitle(movie) {
  if (hasKorean(movie.title)) return movie.title;
  if (hasKorean(movie.original_title)) return movie.original_title;
  if (isReadableLatin(movie.original_title)) return movie.original_title;
  if (isReadableLatin(movie.title)) return movie.title;
  return '제목 미제공';
}

function getDisplayOverview(movie) {
  if (movie.overview && hasKorean(movie.overview)) return movie.overview;
  return '한글 줄거리가 제공되지 않습니다.';
}

function normalizeMovie(movie) {
  return {
    ...movie,
    displayTitle: getDisplayTitle(movie),
    displayOverview: getDisplayOverview(movie),
  };
}

async function fetchMovies() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    if (!response.ok) {
      const detail = data.error || data.status_message || `API 요청 실패 (${response.status})`;
      throw new Error(detail);
    }
    allMovies = (data.results || []).map(normalizeMovie);

    if (allMovies.length === 0) {
      showError('현재 상영 중인 영화가 없습니다.');
      return;
    }

    renderTab(currentTab);
    setupTabs();
  } catch (error) {
    showError(error.message);
  }
}

function setupTabs() {
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = link.dataset.tab;
      if (!tab || tab === currentTab) return;

      currentTab = tab;
      navLinks.forEach((l) => l.classList.toggle('nav__link--active', l.dataset.tab === tab));
      renderTab(tab);
    });
  });
}

function renderTab(tabKey) {
  const tab = TABS[tabKey];
  const movies = tab.filter(allMovies);

  heroBadge.textContent = tab.badge;
  moviesHeading.textContent = tab.heading;

  movieList.innerHTML = '';
  if (loading) loading.remove();

  if (movies.length === 0) {
    movieList.innerHTML = '<div class="error"><p>표시할 영화가 없습니다.</p></div>';
    return;
  }

  setHero(movies[0]);

  movies.forEach((movie, index) => {
    const rank = tab.showRank ? index + 1 : null;
    const card = createMovieCard(movie, index === 0, rank);
    movieList.appendChild(card);
  });
}

function formatReleaseDate(dateStr) {
  if (!dateStr) return '상영일 미정';
  const [year, month, day] = dateStr.split('-');
  return `${year}년 ${parseInt(month, 10)}월 ${parseInt(day, 10)}일`;
}

function formatRating(score) {
  if (score == null || score === 0) return '평점 없음';
  return `★ ${score.toFixed(1)}`;
}

function setHero(movie) {
  heroTitle.textContent = movie.displayTitle;
  heroDate.textContent = `개봉일 ${formatReleaseDate(movie.release_date)}`;
  heroRating.textContent = formatRating(movie.vote_average);
  heroMeta.hidden = false;
  heroOverview.textContent = movie.displayOverview;

  if (movie.backdrop_path) {
    hero.style.backgroundImage = `url(${BACKDROP_BASE}${movie.backdrop_path})`;
  } else {
    hero.style.backgroundImage = 'none';
  }
}

function bindBorderGlow(posterWrap) {
  posterWrap.addEventListener('mousemove', (e) => {
    const rect = posterWrap.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    posterWrap.style.setProperty('--mouse-x', `${x}px`);
    posterWrap.style.setProperty('--mouse-y', `${y}px`);
  });

  posterWrap.addEventListener('mouseleave', () => {
    posterWrap.style.removeProperty('--mouse-x');
    posterWrap.style.removeProperty('--mouse-y');
  });
}

function createMovieCard(movie, isFeatured, rank) {
  const card = document.createElement('article');
  card.className = `movie-card${isFeatured ? ' movie-card--featured' : ''}`;
  card.setAttribute('role', 'listitem');
  card.setAttribute('aria-label', movie.displayTitle);

  const posterWrap = document.createElement('div');
  posterWrap.className = 'movie-card__poster-wrap';

  const borderGlow = document.createElement('div');
  borderGlow.className = 'movie-card__border-glow';
  borderGlow.setAttribute('aria-hidden', 'true');
  posterWrap.appendChild(borderGlow);
  bindBorderGlow(posterWrap);

  if (rank) {
    const rankBadge = document.createElement('span');
    rankBadge.className = `movie-card__rank movie-card__rank--${rank}`;
    rankBadge.textContent = RANK_LABELS[rank - 1];
    posterWrap.appendChild(rankBadge);
  }

  if (movie.poster_path) {
    const img = document.createElement('img');
    img.className = 'movie-card__poster';
    img.src = `${IMAGE_BASE}${movie.poster_path}`;
    img.alt = `${movie.displayTitle} 포스터`;
    img.loading = 'lazy';
    posterWrap.appendChild(img);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'movie-card__poster movie-card__poster--placeholder';
    placeholder.textContent = '포스터 없음';
    posterWrap.appendChild(placeholder);
  }

  const overlay = document.createElement('div');
  overlay.className = 'movie-card__overlay';

  const playBtn = document.createElement('button');
  playBtn.className = 'movie-card__play';
  playBtn.type = 'button';
  playBtn.setAttribute('aria-label', `${movie.displayTitle} 재생`);
  playBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z"/>
    </svg>
  `;

  const overview = document.createElement('p');
  overview.className = 'movie-card__overview';
  overview.textContent = movie.displayOverview;

  overlay.appendChild(playBtn);
  overlay.appendChild(overview);
  posterWrap.appendChild(overlay);

  const title = document.createElement('h3');
  title.className = 'movie-card__title';
  title.textContent = movie.displayTitle;

  const meta = document.createElement('div');
  meta.className = 'movie-card__meta';

  const date = document.createElement('span');
  date.className = 'movie-card__date';
  date.textContent = formatReleaseDate(movie.release_date);

  const rating = document.createElement('span');
  rating.className = 'movie-card__rating';
  rating.textContent = formatRating(movie.vote_average);

  meta.appendChild(date);
  meta.appendChild(rating);

  playBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openPaywall(movie);
  });

  card.addEventListener('click', () => openPaywall(movie));

  card.appendChild(posterWrap);
  card.appendChild(title);
  card.appendChild(meta);

  return card;
}

function openPaywall(movie) {
  setHero(movie);
  paywallTitle.textContent = movie.displayTitle;

  if (movie.poster_path) {
    paywallPoster.src = `${IMAGE_BASE}${movie.poster_path}`;
    paywallPoster.alt = `${movie.displayTitle} 포스터`;
    paywallPoster.hidden = false;
  } else {
    paywallPoster.hidden = true;
  }

  if (movie.backdrop_path) {
    paywallBackdrop.style.backgroundImage = `url(${BACKDROP_BASE}${movie.backdrop_path})`;
  } else {
    paywallBackdrop.style.backgroundImage = 'none';
  }

  const bubble = paywall.querySelector('.paywall__bubble');
  bubble.style.animation = 'none';
  bubble.offsetHeight;
  bubble.style.animation = '';

  paywall.classList.add('paywall--open');
  paywall.removeAttribute('hidden');
  paywall.setAttribute('aria-hidden', 'false');
  document.body.classList.add('paywall-open');
}

function closePaywall() {
  paywall.classList.remove('paywall--open');
  paywall.setAttribute('hidden', '');
  paywall.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('paywall-open');
}

paywallClose.addEventListener('click', closePaywall);
paywallBackdrop.addEventListener('click', closePaywall);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && paywall.classList.contains('paywall--open')) closePaywall();
});

function showError(message) {
  if (loading) loading.remove();
  movieList.innerHTML = `
    <div class="error">
      <p class="error__title">영화를 불러올 수 없습니다</p>
      <p>${message}</p>
    </div>
  `;
  heroTitle.textContent = '오류 발생';
  heroMeta.hidden = true;
  heroOverview.textContent = '잠시 후 다시 시도해 주세요.';
}

window.addEventListener('scroll', () => {
  header.classList.toggle('header--scrolled', window.scrollY > 50);
});

fetchMovies();

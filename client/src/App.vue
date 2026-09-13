<template>
  <div id="app" class="app-container">
    <div class="space-bg">
      <div v-for="(style, n) in starStyles" :key="'star' + n" class="star" :style="style"></div>
      <div v-for="(style, n) in cometStyles" :key="'comet' + n" class="shooting-star" :style="style"></div>
      <div v-for="(style, n) in nebulaStyles" :key="'nebula' + n" class="nebula-particle" :style="style"></div>
      <div v-for="(style, n) in planetStyles" :key="'planet' + n" class="planet-orbit" :style="style"></div>
      <div v-for="(style, n) in satelliteStyles" :key="'sat' + n" class="satellite" :style="style"></div>
      <div class="plasma p-1"></div>
      <div class="plasma p-2"></div>
      <div class="plasma p-3"></div>
    </div>

    <div class="scroll-progress" :style="{ width: scrollProgress + '%' }"></div>

    <header class="main-header">
      <div class="header-inner">
        <div class="logo-group" :title="t('backHome')" @click="resetHome" @mousemove="moveLogo" @mouseleave="resetLogo" :style="logoTransform">
          <span class="logo-home-chip"><Icon name="home" size="15" /></span>
          <h1 class="chameleon-name">Ka_samuel@250 <span>Filmz</span></h1>
        </div>
        <nav class="nav-pills">
          <button class="pill" :class="{ active: currentPageName === 'home' }" @click="resetHome"><Icon name="home" size="16" /> {{ t('home') }}</button>
          <button class="pill" :class="{ active: currentPageName === 'youtmus' }" @click="openYoutmus"><Icon name="music" size="16" /> YOUTMUS</button>
          <button v-if="isAuthenticated" class="pill" @click="setPage('profile')"><Icon name="user" size="16" /> {{ t('profile') }}</button>
          <button v-if="isAuthenticated" class="pill" @click="setPage('watchlists')"><Icon name="list" size="16" /> {{ t('lists') }}</button>
          <button v-if="isAdmin" class="pill" @click="setPage('admin')"><Icon name="shield" size="16" /> {{ t('admin') }}</button>

          <div class="notif-wrap">
            <button class="pill notif-bell" :class="{ active: notifsOpen }" @click="toggleNotifs">
              <Icon name="bell" size="16" />
              <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
            </button>
            <transition name="notif-fade">
              <div v-if="notifsOpen" class="notif-panel" @click.stop>
                <div class="notif-header">
                  <h3><Icon name="bell" size="15" /> Notifications</h3>
                  <button class="notif-mark-all" @click="markAllNotifsRead">{{ t('markAllRead') }}</button>
                </div>
                <div v-if="!isAuthenticated" class="notif-empty">{{ t('loginToNotifs') }}</div>
                <div v-else-if="notifications.length === 0" class="notif-empty">
                  {{ t('noNotifs') }}
                </div>
                <div v-else class="notif-list">
                  <button
                    v-for="n in notifications"
                    :key="n.id"
                    class="notif-item"
                    :class="{ unread: !n.read }"
                    @click="handleNotifClick(n)"
                  >
                    <div class="notif-dot"></div>
                    <div>
                      <p class="notif-title">{{ n.title }}</p>
                      <p class="notif-body">{{ n.body }}</p>
                      <span class="notif-time">{{ formatNotifTime(n.createdAt) }}</span>
                    </div>
                  </button>
                </div>
              </div>
            </transition>
          </div>

          <!-- Animated 3-dots menu -->
          <div class="dots-menu-wrap">
            <button
              class="dots-btn"
              :class="{ open: menuOpen }"
              :aria-label="t('menu')"
              :aria-expanded="menuOpen || undefined"
              @click="menuOpen = !menuOpen"
            >
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </button>

            <Transition name="dots-pop">
              <div v-if="menuOpen" class="dots-panel" @click.stop>
                <div class="dots-panel-head">
                  <span class="dots-brand-dot"></span>
                  <div>
                    <strong>Filmz</strong>
                    <small>{{ lang === 'fr' ? 'Menu principal' : 'Main menu' }}</small>
                  </div>
                </div>

                <button class="dots-item" :class="{ active: currentPageName === 'premium' }" @click="menuOpen = false; goPremium()">
                  <span class="dots-ic premium"><Icon name="award" size="17" /></span> <span>{{ t('premium') }}</span>
                  <Icon v-if="currentPageName === 'premium'" class="dots-check" name="check" size="14" />
                </button>

                <button v-if="isAuthenticated" class="dots-item" @click="menuOpen = false; handleLogout()">
                  <span class="dots-ic danger"><Icon name="logout" size="17" /></span> <span>{{ t('logout') }}</span>
                </button>
                <button v-else class="dots-item" :class="{ active: currentPageName === 'login' }" @click="menuOpen = false; setPage('login')">
                  <span class="dots-ic"><Icon name="lock" size="17" /></span> <span>{{ isRegister ? t('register') : t('login') }}</span>
                </button>

                <button class="dots-item" :class="{ active: currentPageName === 'contact' }" @click="menuOpen = false; setPage('contact')">
                  <span class="dots-ic"><Icon name="smartphone" size="17" /></span> <span>{{ t('connect') }}</span>
                </button>

                <div class="dots-divider"></div>

                <div class="dots-row">
                  <div class="dots-row-info">
                    <span class="dots-ic"><Icon name="eye" size="16" /></span>
                    <strong>{{ t('darkMode') }}</strong>
                  </div>
                  <button class="switch small" :class="{ on: darkMode }" role="switch" :aria-checked="darkMode" @click="toggleDarkMode">
                    <span class="switch-knob"></span>
                  </button>
                </div>

                <div class="dots-row">
                  <div class="dots-row-info">
                    <span class="dots-ic"><Icon name="layers" size="16" /></span>
                    <strong>{{ t('language') }}</strong>
                  </div>
                  <button class="switch small" :class="{ on: lang === 'fr' }" role="switch" :aria-checked="lang === 'fr'" @click="changeLanguage(lang === 'fr' ? 'en' : 'fr')">
                    <span class="switch-knob"></span>
                  </button>
                </div>
                <div class="lang-toggle">
                  <button :class="{ active: lang === 'en' }" @click="changeLanguage('en')"><span class="lang-flag">🇬🇧</span> English</button>
                  <button :class="{ active: lang === 'fr' }" @click="changeLanguage('fr')"><span class="lang-flag">🇫🇷</span> Français</button>
                </div>

                <div class="dots-divider"></div>

                <button class="dots-item" :class="{ active: isSettingsOpen }" @click="menuOpen = false; isSettingsOpen = true">
                  <span class="dots-ic"><Icon name="sliders" size="17" /></span> <span>{{ t('settings') }}</span>
                </button>
              </div>
            </Transition>
          </div>
        </nav>
      </div>
    </header>

    <main class="content-wrapper">
      <!-- Persistent YOUTMUS player - keeps playing on every page -->
      <section v-if="ytPlaying" class="yt-player-pane">
        <div class="yt-pane-top">
          <div class="yt-pane-now"><Icon name="music" size="15" /> NOW PLAYING</div>
          <button class="yt-pane-close" @click="stopYoutmus" title="Stop music"><Icon name="x" size="16" /></button>
        </div>
        <div class="yt-pane-grid">
          <div class="yt-frame-wrap">
            <div ref="ytPlayerBox" class="yt-player-box"></div>
          </div>
          <div class="yt-meta">
            <h3 class="yt-pane-title">{{ ytPlaying.title }}</h3>
            <div class="yt-channel">
              <div class="yt-avatar"><Icon name="music" size="15" /></div>
              <span>{{ ytPlaying.channelTitle }}</span>
            </div>
            <div class="yt-stats">
              <span v-if="ytPlaying.viewCount"><Icon name="eye" size="14" /> {{ formatYtViews(ytPlaying.viewCount) }} views</span>
              <span v-if="ytPlaying.likeCount"><Icon name="heart" size="14" /> {{ formatYtViews(ytPlaying.likeCount) }} likes</span>
              <span v-if="ytPlaying.duration"><Icon name="clock" size="14" /> {{ ytPlaying.duration }}</span>
              <span v-if="ytPlaying.publishedAt"><Icon name="award" size="14" /> {{ formatYtDate(ytPlaying.publishedAt) }}</span>
            </div>
            <div class="yt-actions">
              <button class="yt-add-btn big" @click="pickPlaylistTarget(ytPlaying)"><Icon name="plus" size="15" /> Add to playlist</button>
              <button class="yt-pane-ctl" @click="toggleYtPlayPause"><Icon :name="ytIsPlaying ? 'pause' : 'play'" size="16" /> {{ ytIsPlaying ? 'Pause' : 'Play' }}</button>
              <a class="yt-open" :href="'https://www.youtube.com/watch?v=' + ytPlaying.id" target="_blank" rel="noopener">
                <Icon name="play" size="15" /> Watch on YouTube
              </a>
            </div>
            <p v-if="ytPlaying.description" class="yt-desc">{{ ytPlaying.description }}</p>
            <p v-else class="yt-desc muted">No description for this one — just enjoy the music.</p>
          </div>
        </div>
      </section>

      <section v-if="currentPageName === 'home' && !trailerUrl && !fullMovieUrl" class="hero-section">
        <div v-if="heroMovies.length" class="hero-banner" @mouseenter="pauseHero" @mouseleave="resumeHero">
          <div class="banner-stage">
            <Transition name="banner-fade" mode="out-in">
              <div :key="featuredMovie.id" class="banner-slide">
                <div class="banner-bg">
                  <img
                    v-if="featuredMovie.backdrop_path"
                    :src="'https://image.tmdb.org/t/p/w1280' + featuredMovie.backdrop_path"
                    :alt="featuredMovie.title || featuredMovie.name"
                  />
                  <div v-else class="no-poster banner-no-poster">{{ featuredMovie.title || featuredMovie.name }}</div>
                </div>
                <div class="banner-shade"></div>
                <div class="banner-content">
                  <span class="banner-rank"><Icon name="flame" size="15" /> TRENDING #{{ featuredIndex + 1 }}</span>
                  <h2 class="banner-title">{{ featuredMovie.title || featuredMovie.name }}</h2>
                  <div class="banner-meta">
                    <span v-if="featuredYear" class="banner-meta-chip"><Icon name="calendar" size="13" /> {{ featuredYear }}</span>
                    <span class="banner-meta-chip banner-score"><Icon name="star" size="13" /> {{ featuredMovie.vote_average ? featuredMovie.vote_average.toFixed(1) : 'N/A' }} / 10</span>
                  </div>
                  <p v-if="featuredMovie.overview" class="banner-overview">{{ featuredMovie.overview }}</p>
                  <div class="banner-actions">
                    <button class="banner-btn primary" @click="playFullMovie(featuredMovie)"><Icon name="play" size="16" /> WATCH FULL MOVIE</button>
                    <button class="banner-btn ghost" @click="playTrailer(featuredMovie)"><Icon name="video" size="16" /> TRAILER</button>
                  </div>
                </div>
              </div>
            </Transition>
            <div class="banner-dots">
              <button
                v-for="(m, i) in heroMovies"
                :key="'dot' + m.id"
                :class="{ active: i === featuredIndex }"
                :aria-label="'Trending ' + (i + 1)"
                @click="selectFeatured(i)"
              ></button>
            </div>
          </div>

          <div class="trending-strip">
            <div
              v-for="(movie, i) in heroMovies.slice(0, 10)"
              :key="movie.id"
              class="strip-item"
              :class="{ active: i === featuredIndex }"
              @click="selectFeatured(i)"
            >
              <img
                v-if="movie.backdrop_path"
                :src="'https://image.tmdb.org/t/p/w300' + movie.backdrop_path"
                :alt="movie.title || movie.name"
                loading="lazy"
              />
              <div v-else class="strip-no-poster">{{ movie.title || movie.name }}</div>
              <div class="strip-veil"></div>
              <span class="strip-num">{{ i + 1 }}</span>
            </div>
          </div>
        </div>
      </section>

      <section v-if="currentPageName === 'home' && !trailerUrl && !fullMovieUrl" class="search-section">
        <div class="search-container">
          <div class="mode-switcher">
            <button class="mode-btn" :class="{ active: mode === 'movie' }" @click="toggleMode('movie')"><Icon name="film" size="15" /> {{ lang === 'fr' ? 'Films' : 'Movies' }}</button>
            <button class="mode-btn" :class="{ active: mode === 'tv' }" @click="toggleMode('tv')"><Icon name="tv" size="15" /> {{ t('tvSeries') }}</button>
          </div>
          <div class="search-glow-box">
            <input v-model="searchQuery" :placeholder="t('searchPlaceholder')" @input="debouncedSearch" @keyup.enter="handleSearch(true)" />
            <button @click="handleSearch(true)" class="search-action-btn"><Icon name="send" size="16" /> EXPLORE</button>
          </div>
          <div class="advanced-filters">
            <div class="genre-dropdown" :class="{ open: genreDropdownOpen }">
              <button type="button" class="genre-dropdown-btn" @click.stop="toggleGenreDropdown">
                <Icon :name="selectedGenreIcon" size="15" />
                <span class="genre-dropdown-label">{{ selectedGenreName }}</span>
                <Icon name="chevronRight" size="14" class="genre-caret" />
              </button>
              <Transition name="dropdown">
                <div v-if="genreDropdownOpen" class="genre-dropdown-menu">
                  <button
                    v-for="genre in genreOptions"
                    :key="genre.id"
                    type="button"
                    class="genre-option"
                    :class="{ active: advancedFilters.genre === genre.id }"
                    @click="selectGenre(genre)"
                  >
                    <Icon :name="genre.icon" size="15" />
                    <span>{{ genre.name }}</span>
                    <Icon v-if="advancedFilters.genre === genre.id" name="check" size="14" class="genre-check" />
                  </button>
                </div>
              </Transition>
            </div>
            <div class="filter-field">
              <Icon name="calendar" size="16" />
              <input v-model="advancedFilters.year" type="number" placeholder="Year" class="glow-input" />
            </div>
            <div class="filter-field">
              <Icon name="star" size="16" />
              <input v-model="advancedFilters.rating" type="number" step="0.1" placeholder="Min Rating" class="glow-input" />
            </div>
            <select v-model="advancedFilters.sortBy" class="glow-input">
              <option value="popularity.desc">Popularity</option>
              <option value="release_date.desc">Release Date</option>
              <option value="vote_average.desc">Rating</option>
            </select>
            <button @click="handleAdvancedSearch" class="search-action-btn"><Icon name="search" size="16" /> Advanced Search</button>
          </div>
        </div>
      </section>

      <section
        v-if="currentPageName === 'home' && !trailerUrl && !fullMovieUrl"
        class="collection-section"
      >
        <TransitionGroup name="row" tag="div" appear>
          <div v-for="row in browseRows" :key="row.title" class="browse-row">
            <div class="browse-row-head">
              <h3 class="browse-row-title"><Icon :name="row.icon" size="18" /> {{ row.title }}</h3>
              <span class="browse-row-meta">{{ row.market }}</span>
            </div>
            <div class="browse-row-track">
              <div
                v-for="b in row.items"
                :key="b.id"
                class="browse-poster"
                @click="openMovieDetails(b)"
              >
                <img
                  v-if="b.poster_path"
                  :src="'https://image.tmdb.org/t/p/w342' + b.poster_path"
                  :alt="b.title || b.name"
                  loading="lazy"
                />
                <div v-else class="no-poster browse-no-poster">{{ b.title || b.name }}</div>
                <div class="browse-poster-overlay">
                  <div class="browse-score"><Icon name="star" size="12" /> {{ b.vote_average ? b.vote_average.toFixed(1) : 'N/A' }}</div>
                  <button class="browse-play" @click.stop="playTrailer(b)"><Icon name="play" size="16" /></button>
                </div>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </section>

      <div v-if="currentPageName === 'home' && !trailerUrl && !fullMovieUrl" class="movies-section">
        <div class="movie-grid">
          <template v-if="loading && movies.length === 0">
            <div v-for="n in 8" :key="n" class="movie-card skeleton-card">
              <div class="skeleton-poster"></div>
              <div class="skeleton-line"></div>
              <div class="skeleton-line short"></div>
            </div>
          </template>
          <template v-else>
            <TransitionGroup
              name="card"
              tag="div"
              class="movie-grid-inner"
            >
              <div
                v-for="(item, index) in movies"
                :key="item.id"
                class="movie-card"
                :style="{ '--rating': `${item.vote_average || 0}%`, '--card-index': index % 8 }"
                @mouseenter="setHoverGenre(item.genre_ids || [])"
                @mouseleave="setHoverGenre()"
                @click="playFullMovie(item)"
              >
                <div class="poster-box">
                  <div class="movie-card-actions">
                    <button class="card-action-btn favorite" :class="{ liked: likedMap[item.id] }" @click.stop="toggleLike(item)" title="Like">
                  <Icon name="heart" size="18" />
                  <span v-if="likesMap[item.id] > 0" class="like-count">{{ likesMap[item.id] }}</span>
                </button>
                    <button class="card-action-btn watchlist" @click.stop="addToWatchlist(item)" title="Save to Watchlist"><Icon name="bookmark" size="18" /></button>
                  </div>
                <img
                  v-if="item.poster_path"
                  :src="'https://image.tmdb.org/t/p/w500' + item.poster_path"
                  :alt="item.title || item.name"
                  loading="lazy"
                >
                <div v-else class="no-poster"><span>{{ item.title || item.name }}</span></div>

                <div class="card-badge"><Icon name="star" size="13" /> {{ item.vote_average ? item.vote_average.toFixed(1) : 'N/A' }}</div>
                </div>

                <div class="movie-card-info">
                  <h4 class="mc-title">{{ item.title || item.name }}</h4>
                  <span class="mc-year">{{ (item.release_date || item.first_air_date || '').split('-')[0] || '—' }}</span>
                  <div class="mc-btns">
                    <button class="mc-btn mc-trailer" @click.stop="playTrailer(item)"><Icon name="video" size="14" /> {{ t('trailer') }}</button>
                    <button class="mc-btn mc-watch" @click.stop="playFullMovie(item)"><Icon name="play" size="14" /> {{ t('watchFullMovie') }}</button>
                  </div>
                </div>
              </div>
            </TransitionGroup>
          </template>
        </div>

        <div ref="scrollTrigger" class="loader-zone">
          <div v-if="loading" class="infinity-loader">
            <div class="orbit-spinner">
              <div class="orbit"></div>
              <div class="orbit"></div>
              <div class="orbit"></div>
            </div>
            <p class="load-label"><Icon name="zap" size="14" /> Warping in more titles&hellip;</p>
          </div>
          <p v-if="!loading && movies.length === 0" class="no-results">The sector is empty. Try a different search.</p>
        </div>
      </div>

      <div v-if="trailerUrl || fullMovieUrl" class="cinema-hall-container">
        <div class="cinema-header">
          <div class="playing-info">
            <span class="live-tag"><span class="live-dot"></span> LIVE</span>
            <h3>{{ currentMovieTitle }}</h3>
          </div>
          <div class="cinema-actions">
            <button v-if="fullMovieUrl" class="download-btn" @click="openCurrentMovieInTab"><Icon name="share" size="15" /> OPEN IN TAB</button>
            <button v-if="fullMovieUrl" class="download-btn" @click="downloadMovie"><Icon name="download" size="15" /> DOWNLOAD</button>
            <button class="exit-hall-btn" @click="closePlayer"><Icon name="x" size="15" /> EXIT</button>
          </div>
        </div>
        <div v-if="fullMovieUrl" class="provider-bar">
          <span class="provider-label"><Icon name="layers" size="15" /> SOURCE</span>
          <div class="provider-pills">
            <button
              v-for="(p, i) in playerProviders"
              :key="p.name"
              class="provider-pill"
              :class="{ active: activeProviderIndex === i }"
              @click="switchProvider(i)"
            >
              {{ p.name }}
            </button>
          </div>
        </div>
        <div class="video-stage">
          <div class="video-wrapper">
            <iframe
              :src="fullMovieUrl || trailerUrl"
              frameborder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              class="trailer-iframe"
            ></iframe>
          </div>
        </div>

        <div class="comment-section">
          <h3 class="comment-title"><Icon name="message" size="18" /> Comments</h3>

          <form class="comment-form" @submit.prevent="submitComment">
            <div v-if="!isAuthenticated" class="comment-login-prompt">
              <p>Login required to post a comment. <button type="button" class="login-link" @click="setPage('login')">Go to login</button></p>
            </div>
            <div class="input-group">
              <input
                v-model="commentName"
                type="text"
                placeholder="Your name"
                required
                class="glow-input"
                :disabled="!isAuthenticated"
              />
              <div class="input-glow"></div>
            </div>

            <div class="input-group">
              <textarea
                v-model="commentText"
                rows="4"
                placeholder="Write your comment..."
                required
                class="glow-input comment-textarea"
                :disabled="!isAuthenticated"
              ></textarea>
              <div class="input-glow"></div>
            </div>

            <button type="submit" class="auth-btn primary" :disabled="commentLoading || !isAuthenticated">
                <Icon v-if="commentLoading" name="loader" size="15" spin class="btn-icon" />
                <Icon v-else name="send" size="15" class="btn-icon" />
                {{ commentLoading ? 'SENDING...' : 'POST COMMENT' }}
              </button>
          </form>

          <p v-if="commentSuccess" class="success-message">Comment posted successfully!</p>
          <p v-if="commentError" class="error-message">{{ commentError }}</p>

          <div class="comment-list" v-if="comments.length">
            <div v-for="(comment, index) in comments" :key="index" class="comment-item">
              <h4>{{ comment.name || comment.userName }}</h4>
              <p>{{ comment.text }}</p>
              <small class="comment-date">{{ comment.date }}</small>
            </div>
          </div>

          <p v-else class="no-results">No comments yet. Be the first to comment.</p>
        </div>
      </div>

      <div v-if="currentPageName === 'youtmus'" class="youtmus-page">
        <div class="youtmus-hero">
          <div class="yt-notes-float" aria-hidden="true">
            <span class="note n1">♪</span><span class="note n2">♫</span><span class="note n3">♬</span><span class="note n4">♪</span><span class="note n5">♫</span>
          </div>
          <div class="yt-eq" aria-hidden="true">
            <span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
          <div class="youtmus-hero-inner">
            <div class="youtmus-title">
              <span class="yt-logo-disc"><Icon name="music" size="26" /></span>
              <div>
                <h2>YOUTMUS</h2>
                <p>Search, watch and chill with any music from YouTube — right here. Save your favourites into playlists.</p>
              </div>
            </div>
            <form class="youtmus-search" @submit.prevent="runYoutmusSearch">
              <input
                v-model="youtmusQuery"
                type="text"
                placeholder="Search a song, artist or vibe…"
                @input="youtmusSearch = null"
              />
              <button type="submit" :disabled="ytLoading">
                <Icon name="search" size="16" /> <span v-if="!ytLoading">Search</span><span v-else>…</span>
              </button>
            </form>
            <div class="youtmus-chips">
              <button
                v-for="chip in youtmusChips"
                :key="chip"
                class="chip"
                :class="{ active: youtmusChip === chip }"
                @click="runYoutmusChip(chip)"
              >
                {{ chip }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="ytError" class="youtmus-error" @click="ytError = null">
          <Icon name="info" size="15" /> {{ ytError }}
        </div>

        <div v-if="isAuthenticated" class="yt-pl-section">
          <div class="yt-pl-head">
            <h3><Icon name="list" size="16" /> My Playlists</h3>
            <button class="yt-pl-new" @click="newPlaylistName=''; showYtPlaylistPicker = true; pendingYtSong = null">
              <Icon name="plus" size="14" /> New Playlist
            </button>
          </div>
          <div v-if="myPlaylists.length" class="yt-pl-strip">
            <div v-for="p in myPlaylists" :key="p.id" class="yt-pl-card" :class="{ open: openPlaylistId === p.id }">
              <div class="yt-pl-main" @click="togglePlaylist(p)">
                <span class="yt-pl-bounce"><Icon name="music" size="16" /></span>
                <div class="yt-pl-info">
                  <strong>{{ p.name }}</strong>
                  <small>{{ p.songCount }} song{{ p.songCount === 1 ? '' : 's' }}</small>
                </div>
                <span class="yt-pl-chevron">{{ openPlaylistId === p.id ? '▾' : '▸' }}</span>
              </div>
              <button class="yt-pl-del" @click="deletePlaylist(p)" title="Delete playlist"><Icon name="trash" size="13" /></button>
              <div v-if="openPlaylistId === p.id" class="yt-pl-songs">
                <div v-if="!p.songs.length" class="yt-pl-empty">No songs yet — press <strong>＋ List</strong> on any song below to save it here.</div>
                <button v-for="s in p.songs" :key="s.videoId" class="yt-pl-song" @click.stop="playPlaylistSong(s, p.name)">
                  <img :src="s.thumbnail" :alt="s.title" loading="lazy" />
                  <div class="yt-pl-song-t">
                    <strong>{{ s.title }}</strong>
                    <small>{{ s.channelTitle }}{{ s.duration ? ' • ' + s.duration : '' }}</small>
                  </div>
                  <Icon name="play" size="15" class="yt-pl-playi" />
                  <span class="yt-pl-remove" title="Remove from playlist" @click.stop="removePlaylistSong(p, s)"><Icon name="x" size="12" /></span>
                </button>
              </div>
            </div>
          </div>
          <div v-else class="yt-pl-empty-big">No playlists yet. Tap <strong>＋ New Playlist</strong> or press <strong>＋ List</strong> on any song to save your favourites.</div>
        </div>

        <div v-if="ytLoading && !ytPlaying" class="youtmus-loading">
          <Icon name="loader" size="22" spin /> Loading music…
        </div>

        <div class="youtmus-results">
          <div class="youtmus-results-head">
            <h3 @click="resetYoutmusList"><Icon name="music" size="16" /> {{ youtmusLabel }}</h3>
            <span class="yt-count">{{ youtmusItems.length }} tracks</span>
          </div>

          <div v-if="youtmusItems.length === 0 && !ytLoading" class="youtmus-empty">
            <Icon name="music" size="30" />
            <p>No music found. Try another song name, artist or vibe.</p>
          </div>

          <div v-else class="youtmus-grid">
            <button
              v-for="item in youtmusItems"
              :key="item.id"
              class="yt-card"
              :class="{ playing: ytPlaying?.id === item.id }"
              @click="playYoutmus(item, youtmusLabel)"
            >
              <div class="yt-thumb">
                <img :src="item.thumbnail" :alt="item.title" loading="lazy" />
                <span class="yt-thumb-veil"></span>
                <span v-if="ytPlaying?.id === item.id" class="yt-now-eq"><span></span><span></span><span></span><span></span></span>
                <span class="yt-dur">
                  <Icon v-if="ytPlaying?.id === item.id" name="volume" size="10" />
                  {{ item.duration || '–' }}
                </span>
                <span class="yt-play"><Icon name="play" size="22" /></span>
              </div>
              <div class="yt-info">
                <p class="yt-title">{{ item.title }}</p>
                <p class="yt-sub">{{ item.channelTitle }}</p>
                <p class="yt-sub">
                  <template v-if="item.viewCount">{{ formatYtViews(item.viewCount) }} views</template>
                  <template v-if="item.viewCount && item.publishedAt"> • </template>
                  <template v-if="item.publishedAt">{{ formatYtDate(item.publishedAt) }}</template>
                </p>
                <div class="yt-card-actions">
                  <span class="yt-list-btn" @click.stop="pickPlaylistTarget(item)"><Icon name="plus" size="13" /> List</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div v-if="showYtPlaylistPicker" class="yt-picker-overlay" @click.self="returnFromPicker">
        <div class="yt-picker">
          <div class="yt-picker-head">
            <h3><Icon name="list" size="16" /> Save to playlist</h3>
            <button class="yt-picker-x" @click="returnFromPicker"><Icon name="x" size="15" /></button>
          </div>
          <p v-if="pendingYtSong" class="yt-picker-song">{{ pendingYtSong.title }}</p>
          <form @submit.prevent="createPlaylistAndAdd" class="yt-picker-form">
            <input v-model="newPlaylistName" type="text" placeholder="New playlist name…" />
            <button class="yt-picker-create" :disabled="ytPlBusy"><Icon name="plus" size="14" /> Create &amp; add</button>
          </form>
          <div v-if="myPlaylists.length" class="yt-picker-list">
            <button v-for="p in myPlaylists" :key="p.id" class="yt-picker-item" @click="addToPlaylist(p)" :disabled="ytPlBusy">
              <Icon name="music" size="14" />
              <span>{{ p.name }}</span>
              <small>{{ p.songCount }}</small>
            </button>
          </div>
          <div v-else class="yt-picker-empty">No playlists yet — create one above.</div>
        </div>
      </div>

      <div v-if="currentPageName === 'login'" class="auth-container">
        <div class="auth-card">
          <div class="auth-tabs">
            <button class="tab-btn" :class="{ active: !isRegister }" @click="isRegister = false"><Icon name="login" size="15" /> Login</button>
            <button class="tab-btn" :class="{ active: isRegister }" @click="isRegister = true"><Icon name="userPlus" size="15" /> Register</button>
          </div>

          <div v-if="!isRegister" class="auth-forms">
            <form @submit.prevent="handleLogin" class="auth-form">
              <div class="input-group"><input v-model="loginEmail" type="text" placeholder="Email or Username" required class="glow-input" /><div class="input-glow"></div></div>
              <div class="input-group password-group">
                <input v-model="loginPassword" :type="showLoginPassword ? 'text' : 'password'" placeholder="Password" required class="glow-input" />
                <button type="button" class="password-toggle" @click="showLoginPassword = !showLoginPassword">
                  {{ showLoginPassword ? 'Hide' : 'Show' }}
                </button>
                <div class="input-glow"></div>
              </div>
              <button type="submit" class="auth-btn primary" :disabled="loginLoading">
                <Icon v-if="loginLoading" name="loader" size="15" spin class="btn-icon" />
                <Icon v-else name="login" size="15" class="btn-icon" />
                {{ loginLoading ? 'ENTERING...' : 'LOGIN' }}
              </button>
            </form>
            <p class="forgot-password"><button type="button" class="forgot-link" @click="setPage('forgot')">Forgot Password?</button></p>
            <p class="demo-info">Demo: <span class="demo-link" @click="loginEmail='demo@filmz.com'; loginPassword='demo123'">demo@filmz.com / demo123</span></p>
            <p class="admin-info">Admin: <span class="demo-link" @click="loginEmail='ka__samuel250'; loginPassword='tetaornella@250'">ka__samuel250 / tetaornella@250</span></p>
          </div>

          <div v-else class="auth-forms">
            <form @submit.prevent="handleRegister" class="auth-form">
              <div class="input-group"><input v-model="registerUsername" type="text" placeholder="Username (public name)" class="glow-input" /><div class="input-glow"></div></div>
              <div class="input-group"><input v-model="registerEmail" type="email" placeholder="Email" required class="glow-input" /><div class="input-glow"></div></div>
              <div class="input-group"><input v-model="registerPhone" type="tel" placeholder="Phone / Mobile Money number" class="glow-input" /><div class="input-glow"></div></div>
              <div class="input-group"><input v-model="registerLocation" type="text" placeholder="Location (e.g. Kigali, Rwanda)" class="glow-input" /><div class="input-glow"></div></div>
              <div class="input-group"><input v-model="registerPassword" type="password" placeholder="Password" required class="glow-input" /><div class="input-glow"></div></div>
              <div class="input-group"><input v-model="registerConfirmPassword" type="password" placeholder="Confirm Password" required class="glow-input" /><div class="input-glow"></div></div>
              <p class="trial-note"><Icon name="award" size="14" /> You get <strong>1 full year free</strong>&mdash;then choose your payment method to keep premium.</p>
              <button type="submit" class="auth-btn primary" :disabled="registerLoading">
                <Icon v-if="registerLoading" name="loader" size="15" spin class="btn-icon" />
                <Icon v-else name="userPlus" size="15" class="btn-icon" />
                {{ registerLoading ? 'CREATING...' : 'REGISTER' }}
              </button>
            </form>
          </div>

          <div class="auth-footer">
            <p v-if="loginError" class="error-message">{{ loginError }}</p>
            <p v-if="registerError" class="error-message">{{ registerError }}</p>
          </div>
        </div>
      </div>

      <div v-if="currentPageName === 'forgot'" class="auth-container">
        <div class="auth-card">
          <button class="back-btn" @click="setPage('login')"><Icon name="arrowLeft" size="15" /> Back to Login</button>
          <div class="auth-header">
            <h2 class="glow-text">Reset Password</h2>
            <p>Enter your email and we'll send you a reset link</p>
          </div>
          <form @submit.prevent="handleForgotPassword" class="auth-form">
            <div class="input-group"><input v-model="forgotEmail" type="email" placeholder="Your Email" required class="glow-input" /><div class="input-glow"></div></div>
            <button type="submit" class="auth-btn primary" :disabled="forgotLoading">
              <Icon v-if="forgotLoading" name="loader" size="15" spin class="btn-icon" />
              <Icon v-else name="mail" size="15" class="btn-icon" />
              {{ forgotLoading ? 'SENDING...' : 'SEND RESET LINK' }}
            </button>
          </form>
          <p v-if="resetSent && !resetLink" class="success-message"><Icon name="check" size="15" class="btn-icon" /> Reset link sent! Check your email (or server console in dev mode).</p>
          <div v-if="resetSent && resetLink" class="reset-link-box">
            <p class="success-message"><Icon name="check" size="15" class="btn-icon" /> Reset link ready! Open it to set a new password.</p>
            <button class="auth-btn primary" @click="currentPageName = 'reset-password'"><Icon name="key" size="15" class="btn-icon" /> OPEN RESET PAGE >></button>
            <a :href="resetLink" class="reset-raw-link">{{ resetLink }}</a>
            <p class="reset-dev-note"><Icon name="info" size="12" /> Preview mode: your email service isn't configured for sending, so the link is shown here. In production it arrives by email.</p>
          </div>
          <p v-if="resetError" class="error-message">{{ resetError }}</p>
        </div>
      </div>

      <div v-if="currentPageName === 'reset-password'" class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <h2 class="glow-text">Set New Password</h2>
            <p>Enter your new password for <strong>{{ resetEmail }}</strong></p>
          </div>
          <form @submit.prevent="handleResetPassword" class="auth-form">
            <div class="input-group password-group">
              <input v-model="resetNewPassword" :type="showResetPassword ? 'text' : 'password'" placeholder="New Password" required minlength="4" class="glow-input" />
              <button type="button" class="password-toggle" @click="showResetPassword = !showResetPassword">{{ showResetPassword ? 'Hide' : 'Show' }}</button>
              <div class="input-glow"></div>
            </div>
            <div class="input-group password-group">
              <input v-model="resetConfirmPassword" :type="showResetPassword ? 'text' : 'password'" placeholder="Confirm Password" required minlength="4" class="glow-input" />
              <div class="input-glow"></div>
            </div>
            <button type="submit" class="auth-btn primary" :disabled="resetLoading">
              <Icon v-if="resetLoading" name="loader" size="15" spin class="btn-icon" />
              <Icon v-else name="key" size="15" class="btn-icon" />
              {{ resetLoading ? 'RESETTING...' : 'RESET PASSWORD' }}
            </button>
          </form>
          <p v-if="resetComplete" class="success-message"><Icon name="check" size="15" class="btn-icon" /> Password reset successfully! <button class="forgot-link" @click="setPage('login')">Login now</button></p>
          <p v-if="resetError" class="error-message">{{ resetError }}</p>
        </div>
      </div>

      <div v-if="currentPageName === 'contact'" class="new-contact-container">
        <div class="contact-hero">
          <h2 class="hero-title">Connect with Ka_samuel@250</h2>
          <p class="hero-subtitle">Reach out across the galaxy</p>
        </div>

        <div class="contact-card-grid" @mousemove="updateContactOrbit" :style="contactOrbitStyle">
          <div class="contact-card email-card" @click="copyEmail">
            <div class="card-glow"></div>
            <div class="contact-icon"><Icon name="mail" size="34" /></div>
            <h3>Email</h3>
            <p>kasamuel71@gmail.com</p>
            <span class="tap-hint">tap to copy</span>
          </div>
          <div class="contact-card phone-card" @click="copyPhone">
            <div class="card-glow"></div>
            <div class="contact-icon"><Icon name="phone" size="34" /></div>
            <h3>Phone</h3>
            <p>0723112258</p>
            <span class="tap-hint">tap to copy</span>
          </div>
          <div class="contact-card whatsapp-card" @click="openWhatsApp">
            <div class="card-glow"></div>
            <div class="contact-icon"><Icon name="whatsapp" size="34" /></div>
            <h3>WhatsApp</h3>
            <p>+250 787 949 343</p>
            <span class="tap-hint">open chat</span>
          </div>
          <div class="contact-card instagram-card" @click="openInstagram">
            <div class="card-glow"></div>
            <div class="contact-icon"><Icon name="instagram" size="34" /></div>
            <h3>Instagram</h3>
            <p>@ka__samuel250</p>
            <span class="tap-hint">open profile</span>
          </div>
        </div>

        <button class="back-btn" @click="resetHome"><Icon name="arrowLeft" size="15" /> BACK TO BASE</button>
      </div>

      <!-- Profile Page -->
      <div v-if="currentPageName === 'profile'" class="profile-container">
        <div v-if="!isAuthenticated" class="login-overlay">
          <div class="login-splash">
            <div class="splash-stars">
              <div v-for="(style, n) in splashStars" :key="'splash-star' + n" class="splash-star" :style="style"></div>
            </div>
            <div class="splash-content">
              <h1 class="splash-title">Join the Galaxy</h1>
              <p class="splash-subtitle">Sign in to access your profile, watch history, favorites, and personalized recommendations.</p>
              <button class="splash-btn" @click="setPage('login')"><Icon name="login" size="18" /> LOGIN NOW</button>
              <button class="splash-secondary" @click="resetHome"><Icon name="arrowLeft" size="15" /> BACK TO THEATER</button>
            </div>
          </div>
        </div>
        <div v-else class="profile-card">
          <h2 class="glow-text">My Profile</h2>

          <div class="profile-top">
            <div class="profile-avatar-wrap">
              <div class="profile-avatar" :class="{ premium: subscriptionStatus.tier === 'premium' }">
                <img v-if="profile.avatar" :src="profile.avatar" alt="avatar" />
                <Icon v-else name="user" size="64" />
                <div class="avatar-crown" v-if="subscriptionStatus.tier === 'premium'"><Icon name="award" size="14" /></div>
              </div>
              <label class="avatar-upload">
                <Icon name="image" size="13" /> Change
                <input type="file" accept="image/*" @change="onAvatarChange" hidden />
              </label>
            </div>
            <div class="profile-identity">
              <p class="profile-email"><Icon name="mail" size="14" /> {{ profile.email || user?.email }}</p>
              <p class="profile-stats">
                <span><Icon name="heart" size="14" /> {{ favorites.length }} likes</span>
                <span><Icon name="clock" size="14" /> {{ watchHistory.length }} watched</span>
                <span><Icon name="mapPin" size="14" /> {{ profile.location || 'No location yet' }}</span>
              </p>
            </div>
          </div>

          <form @submit.prevent="updateProfile" class="profile-form">
            <div class="input-group"><input v-model="profile.username" type="text" placeholder="Username" class="glow-input" /><div class="input-glow"></div></div>
            <div class="input-group"><input v-model="profile.name" type="text" placeholder="Full name" class="glow-input" /><div class="input-glow"></div></div>
            <div class="input-group">
              <input v-model="profile.phone" type="tel" placeholder="Phone / Mobile Money number" class="glow-input" />
              <div class="input-glow"></div>
            </div>
            <div class="input-group loc-group">
              <input v-model="profile.location" type="text" placeholder="Location (Kigali, Rwanda...)" class="glow-input" />
              <button type="button" class="loc-detect" @click="detectLocation" :disabled="locDetecting">
                <Icon name="mapPin" size="14" /> {{ locDetecting ? 'Detecting...' : 'GPS' }}
              </button>
              <div class="input-glow"></div>
            </div>
            <div class="input-group"><textarea v-model="profile.bio" rows="3" placeholder="Bio" class="glow-input"></textarea></div>
            <div class="input-group">
              <label for="theme-select" class="theme-label">Theme:</label>
              <select id="theme-select" v-model="currentTheme" @change="changeTheme" class="glow-input">
                <option value="default">Default Galaxy</option>
                <option value="dark">Deep Space</option>
                <option value="neon">Neon Cyber</option>
                <option value="retro">Retro Sci-Fi</option>
              </select>
            </div>
            <label class="notif-toggle">
              <input type="checkbox" v-model="profile.notificationsEnabled" />
              <span class="switch small" :class="{ on: profile.notificationsEnabled }"><span class="switch-knob"></span></span>
              <span>Notify me when new movies arrive</span>
            </label>
            <button type="submit" class="auth-btn primary">Save Profile</button>
          </form>

          <div class="sub-card" :class="{ premium: subscriptionStatus.tier === 'premium' }">
            <div class="sub-head">
              <div>
                <h3><Icon name="award" size="16" /> {{ subscriptionStatus.lifetimeFree ? 'Lifetime Free Member' : (subscriptionStatus.tier === 'premium' ? 'Premium Member' : 'Free Trial') }}</h3>
                <p v-if="subscriptionStatus.lifetimeFree" class="sub-lifetime">
                  <Icon name="zap" size="13" /> You have been granted <strong>lifetime free access</strong> &mdash; no payments ever needed.
                </p>
                <p v-else-if="subscriptionStatus.tier === 'premium' && subscriptionStatus.subscriptionExpiry">
                  Premium active until {{ formatDate(subscriptionStatus.subscriptionExpiry) }}
                </p>
                <p v-else-if="subscriptionStatus.trialDaysLeft > 0">
                  Free trial: <strong>{{ subscriptionStatus.trialDaysLeft }} days</strong> left (1 year of free access) &mdash; then {{ subscriptionStatus.pricePerMonth }} {{ subscriptionStatus.currency }}/month.
                </p>
                <p v-else>
                  Your free trial has ended. Subscribe for {{ subscriptionStatus.pricePerMonth }} {{ subscriptionStatus.currency }}/month to keep premium.
                </p>
              </div>
              <div class="sub-badge">{{ subscriptionStatus.lifetimeFree ? 'FOREVER' : (subscriptionStatus.tier === 'premium' ? 'ACTIVE' : 'TRIAL') }}</div>
            </div>

            <div class="momo-box">
              <h4><Icon name="smartphone" size="14" /> Payment Method &mdash; Mobile Money ({{ subscriptionStatus.operator || 'MTN' }})</h4>
              <div class="momo-fields">
                <input v-model="momoNumber" type="tel" placeholder="MoMo number (e.g. 0788123456)" class="glow-input" />
                <input v-model="momoName" type="text" placeholder="Account name" class="glow-input" />
              </div>
              <div class="momo-actions">
                <button type="button" class="btn-download-blue" @click="savePaymentMethod"><Icon name="lock" size="14" /> Save Payment Method</button>
                <button type="button" class="btn-watch-gradient" @click="checkout" :disabled="subLoading">
                  <Icon v-if="subLoading" name="loader" size="14" spin />
                  <Icon v-else name="zap" size="14" />
                  {{ subscriptionStatus.tier === 'premium' ? 'Renew Premium' : 'Start Paid Subscription' }}
                </button>
              </div>
              <p v-if="subMessage" class="sub-message" :class="{ ok: subOk }">{{ subMessage }}</p>
              <p class="momo-note"><Icon name="smartphone" size="12" /> Pay to: <strong>{{ subscriptionStatus.payee?.name }}</strong> &mdash; MTN MoMo <strong>{{ subscriptionStatus.payee?.msisdn }}</strong> ({{ subscriptionStatus.pricePerMonth }} {{ subscriptionStatus.currency }}/month)</p>
              <p class="momo-note"><Icon name="info" size="12" /> {{ subscriptionStatus.momoConfigured ? `Finish on your phone: confirm the ${subscriptionStatus.operator || 'MTN'} MoMo prompt for ${subscriptionStatus.pricePerMonth} ${subscriptionStatus.currency}. Premium unlocks automatically once you confirm.` : 'No online prompt yet - you can pay directly to the number above and we will activate you.' }}</p>
            </div>
          </div>

          <div class="profile-sections">
            <div class="profile-section">
              <h3><Icon name="heart" size="15" /> My Likes ({{ favorites.length }})</h3>
              <div v-if="favorites.length" class="favorites-grid">
                <div v-for="fav in favorites" :key="fav.movieId" class="fav-card" @click="openMovieDetails(fav)">
                  <img v-if="fav.posterPath" :src="'https://image.tmdb.org/t/p/w200' + fav.posterPath" :alt="fav.movieTitle" />
                  <div v-else class="no-poster">{{ fav.movieTitle }}</div>
                  <button class="fav-unlike" @click.stop="toggleLike(fav)"><Icon name="heart" size="13" /></button>
                </div>
              </div>
              <p v-else class="sub-message">Like movies from the theater and they show up here.</p>
            </div>
            <div class="profile-section">
              <h3><Icon name="clock" size="15" /> Watch History</h3>
              <div class="history-list">
                <div v-if="watchHistory.length === 0" class="history-item">Nothing watched yet. Start streaming!</div>
                <div v-for="item in watchHistory" :key="item.movieId" class="history-item">
                  <span>{{ item.movieTitle }}</span>
                  <span class="history-date">{{ new Date(item.watchedAt).toLocaleDateString() }}</span>
                </div>
              </div>
            </div>
            <div class="profile-section">
              <h3><Icon name="trendingUp" size="15" /> Recommendations</h3>
              <div class="rec-grid">
                <div v-for="rec in recommendations" :key="rec.id" class="rec-card" @click="openMovieDetails(rec)">
                  <img v-if="rec.poster_path" :src="'https://image.tmdb.org/t/p/w200' + rec.poster_path" :alt="rec.title" />
                  <div v-else class="no-poster">{{ rec.title }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="support-card">
            <h3><Icon name="message" size="15" /> Help &amp; Support</h3>
            <p class="support-sub">Facing a problem or have a request? Send it here and the admin will solve it for you.</p>
            <form @submit.prevent="submitSupport" class="support-form">
              <div class="input-group"><input v-model="supportSubject" type="text" placeholder="Subject (e.g. I can't watch a movie, payment issue, account help...)" class="glow-input" required /><div class="input-glow"></div></div>
              <div class="input-group"><textarea v-model="supportMessage" rows="3" placeholder="Describe your problem or request in detail..." class="glow-input" required></textarea></div>
              <button type="submit" class="auth-btn primary" :disabled="supportSending">
                <Icon v-if="supportSending" name="loader" size="14" spin />
                <Icon v-else name="send" size="14" />
                {{ supportSending ? 'SENDING...' : 'SEND REQUEST' }}
              </button>
            </form>
            <div v-if="mySupportRequests.length" class="my-support-list">
              <div v-for="req in mySupportRequests" :key="req.id" class="support-item">
                <div class="support-item-head">
                  <strong>{{ req.subject }}</strong>
                  <span class="admin-chip" :class="req.status === 'resolved' ? 'chip-on' : 'chip-off'">{{ req.status === 'resolved' ? 'Resolved' : 'Open' }}</span>
                </div>
                <p class="support-msg">{{ req.message }}</p>
                <div v-for="rep in req.replies" :key="rep._id || rep.date" class="support-reply" :class="{ admin: rep.by === 'admin' }">
                  <strong>{{ rep.by === 'admin' ? 'Admin' : 'You' }}</strong>
                  <p>{{ rep.text }}</p>
                  <span class="support-date">{{ formatDate(rep.date) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button class="back-btn" @click="resetHome"><Icon name="arrowLeft" size="15" /> BACK TO THEATER</button>
      </div>

      <!-- Watchlists Page -->
      <div v-if="currentPageName === 'watchlists'" class="watchlists-container">
        <div v-if="!isAuthenticated" class="login-overlay">
          <div class="login-splash">
            <div class="splash-stars">
              <div v-for="(style, n) in splashStars" :key="'splash-star' + n" class="splash-star" :style="style"></div>
            </div>
            <div class="splash-content">
              <h1 class="splash-title">Create Your Lists</h1>
              <p class="splash-subtitle">Login to build and manage your personal watchlists. Save movies for later and never miss a favorite.</p>
              <button class="splash-btn" @click="setPage('login')"><Icon name="login" size="18" /> LOGIN NOW</button>
              <button class="splash-secondary" @click="resetHome"><Icon name="arrowLeft" size="15" /> BACK TO THEATER</button>
            </div>
          </div>
        </div>
        <div v-else class="watchlists-card">
          <h2 class="glow-text">My Watchlists</h2>
          <form @submit.prevent="createWatchlist" class="watchlist-form">
            <input v-model="newListName" type="text" placeholder="New list name" required class="glow-input" />
            <button type="submit" class="auth-btn primary">Create List</button>
          </form>
          <div class="watchlists-list">
            <div v-for="list in watchlists" :key="list.id" class="watchlist-item">
              <h3>{{ list.name }}</h3>
              <div class="list-movies">
                <div v-for="movie in list.movies" :key="movie.movieId" class="list-movie" @click="openMovieDetails(movie)">
                  <img v-if="movie.posterPath" :src="'https://image.tmdb.org/t/p/w150' + movie.posterPath" :alt="movie.movieTitle" />
                  <div v-else class="no-poster-small">{{ movie.movieTitle }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button class="back-btn" @click="resetHome"><Icon name="arrowLeft" size="15" /> BACK TO THEATER</button>
      </div>

      <!-- Movie Details Page -->
      <div v-if="currentPageName === 'movie-details'" class="movie-details-container">
        <div v-if="movieDetails" class="movie-details-card">
          <div class="movie-header">
            <img v-if="movieDetails.poster_path" :src="'https://image.tmdb.org/t/p/w300' + movieDetails.poster_path" :alt="movieDetails.title" class="movie-poster" />
            <div class="movie-info">
              <h2>{{ movieDetails.title }}</h2>
              <p>{{ movieDetails.overview }}</p>
              <p>Release: {{ movieDetails.release_date }}</p>
              <p>Rating: {{ movieDetails.vote_average }}/10</p>
              <div class="details-actions">
                <button @click="playFullMovie(movieDetails)" class="btn-watch-gradient"><Icon name="play" size="15" /> {{ t('watchFullMovie') }}</button>
                <button @click="playTrailer(movieDetails)" class="btn-trailer-red"><Icon name="video" size="15" /> {{ t('trailer') }}</button>
                <button @click="toggleLike(movieDetails)" class="btn-like" :class="{ 'like-active': likedMap[movieDetails.id] }"><Icon name="heart" size="15" /> {{ likedMap[movieDetails.id] ? 'LIKED' : 'LIKE' }} <span class="like-badge">{{ likesMap[movieDetails.id] || 0 }}</span></button>
                <button @click="shareMovie(movieDetails)" class="auth-btn primary"><Icon name="share" size="15" /> Share</button>
                <button @click="downloadMovieFile(movieDetails)" class="btn-download-blue"><Icon name="download" size="15" /> Download</button>
              </div>
              <div class="download-options">
                <h4><Icon name="download" size="16" /> Download Options</h4>
                <div class="download-buttons">
                  <button @click="downloadPoster(movieDetails)" class="download-option"><Icon name="image" size="15" /> Poster</button>
                  <button @click="downloadTrailer(movieDetails)" class="download-option"><Icon name="video" size="15" /> Trailer</button>
                  <button @click="cacheForOffline(movieDetails)" class="download-option"><Icon name="database" size="15" /> Cache Offline</button>
                </div>
                <p class="download-note">Note: Full movie downloads require browser extensions or third-party tools. Trailers and posters can be downloaded directly.</p>
              </div>
            </div>
          </div>
          <div class="cast-section">
            <h3>Cast</h3>
            <div class="cast-list">
              <div v-for="cast in movieDetails.cast" :key="cast.id" class="cast-item">
                <img v-if="cast.profile_path" :src="'https://image.tmdb.org/t/p/w185' + cast.profile_path" :alt="cast.name" />
                <div>{{ cast.name }} as {{ cast.character }}</div>
              </div>
            </div>
          </div>
          <div class="similar-section">
            <h3>Similar Movies</h3>
            <div class="similar-grid">
              <div v-for="sim in similarMovies" :key="sim.id" class="similar-card" @click="openMovieDetails(sim)">
                <img v-if="sim.poster_path" :src="'https://image.tmdb.org/t/p/w200' + sim.poster_path" :alt="sim.title" />
                <div v-else class="no-poster">{{ sim.title }}</div>
              </div>
            </div>
          </div>
          <div class="reviews-section">
            <h3>Reviews</h3>
            <div class="reviews-list">
              <div v-for="review in movieReviews" :key="review.id" class="review-item">
                <h4>{{ review.author }}</h4>
                <p>{{ review.content }}</p>
              </div>
            </div>
          </div>
        </div>
        <button class="back-btn" @click="setPage('home')"><Icon name="arrowLeft" size="15" /> BACK TO THEATER</button>
      </div>

      <!-- Premium / Subscription Page -->
      <div v-if="currentPageName === 'premium'" class="premium-page">
        <div class="premium-hero">
          <div class="premium-badges"><span class="premium-badge"><Icon name="award" size="13" /> EXCLUSIVE</span><span class="premium-badge"><Icon name="zap" size="13" /> INSTANT</span></div>
          <h2 class="premium-title">Go <span>Premium</span></h2>
          <p class="premium-subtitle">Unlock the full galaxy: no ads, every movie &amp; series, HD servers, priority support and early access to new releases.</p>
          <div class="premium-perks">
            <span><Icon name="check" size="13" /> All movies &amp; series</span>
            <span><Icon name="check" size="13" /> Multiple HD servers</span>
            <span><Icon name="check" size="13" /> YOUTMUS playlists everywhere</span>
            <span><Icon name="check" size="13" /> Priority support</span>
          </div>
        </div>

        <div class="plans-wrap">
          <div class="plan-card" @click="selectedPlan = 'monthly'" :class="{ chosen: selectedPlan === 'monthly' }">
            <div class="plan-top">
              <h3><Icon name="calendar" size="15" /> Monthly</h3>
              <span class="plan-tag">POPULAR</span>
            </div>
            <div class="plan-price"><strong>{{ planMonthlyPrice }}</strong> <span>{{ subscriptionStatus.currency }} / month</span></div>
            <ul class="plan-feats">
              <li><Icon name="check" size="13" /> Full HD streaming</li>
              <li><Icon name="check" size="13" /> 4K where available</li>
              <li><Icon name="check" size="13" /> Cancel anytime</li>
            </ul>
            <button class="plan-btn" @click.stop="pickPlan('monthly')"><Icon name="rocket" size="14" /> Choose Monthly</button>
          </div>

          <div class="plan-card featured" @click="selectedPlan = 'yearly'" :class="{ chosen: selectedPlan === 'yearly' }">
            <div class="plan-badge">BEST VALUE</div>
            <div class="plan-top">
              <h3><Icon name="zap" size="15" /> Yearly</h3>
              <span class="plan-tag">-17%</span>
            </div>
            <div class="plan-price"><strong>{{ planYearlyPrice }}</strong> <span>{{ subscriptionStatus.currency }} / year</span></div>
            <p class="plan-eq"><Icon name="trendingDown" size="13" /> ≈ {{ Math.round(planYearlyPrice / 12) }} {{ subscriptionStatus.currency }}/month — 2 months free</p>
            <ul class="plan-feats">
              <li><Icon name="check" size="13" /> Everything in Monthly</li>
              <li><Icon name="check" size="13" /> 2 months FREE</li>
              <li><Icon name="check" size="13" /> Best price per month</li>
            </ul>
            <button class="plan-btn" @click.stop="pickPlan('yearly')"><Icon name="rocket" size="14" /> Choose Yearly</button>
          </div>

          <div class="plan-card" :class="{ chosen: subscriptionStatus.lifetimeFree || subscriptionStatus.tier === 'premium' }">
            <div class="plan-top">
              <h3><Icon name="infinity" size="15" /> Lifetime</h3>
              <span class="plan-tag" v-if="subscriptionStatus.lifetimeFree">GRANTED</span>
            </div>
            <div class="plan-price"><strong>Forever</strong> <span>free access</span></div>
            <ul class="plan-feats">
              <li><Icon name="check" size="13" /> No expiry, ever</li>
              <li><Icon name="check" size="13" /> All features included</li>
              <li v-if="subscriptionStatus.lifetimeFree"><Icon name="check" size="13" /> You have it!</li>
            </ul>
            <button class="plan-btn ghost" disabled>{{ subscriptionStatus.lifetimeFree ? 'You have Lifetime Free' : 'Granted by admin only' }}</button>
          </div>
        </div>

        <div class="pay-box">
          <div class="pay-head">
            <h3><Icon name="smartphone" size="16" /> {{ subscriptionStatus.tier === 'premium' ? 'Renew or upgrade' : 'Complete your payment' }}</h3>
            <p>Pay securely with Mobile Money. Your account upgrades automatically once payment confirms.</p>
          </div>

          <div class="pay-methods">
            <button
              v-for="m in momoProviders"
              :key="m.id"
              class="pay-method"
              :class="{ active: momoProvider === m.id }"
              @click="momoProvider = m.id"
            >
              <Icon name="smartphone" size="16" />
              <span><strong>{{ m.name }}</strong><small>{{ m.note }}</small></span>
              <span class="pay-check" v-if="momoProvider === m.id"><Icon name="check" size="12" /></span>
            </button>
          </div>

          <div class="pay-fields">
            <div class="input-group">
              <label>Mobile Money number</label>
              <input v-model="momoNumber" type="tel" placeholder="e.g. 0788123456" class="glow-input" />
              <div class="input-glow"></div>
            </div>
            <div class="input-group">
              <label>Account name (optional)</label>
              <input v-model="momoName" type="text" placeholder="Your MoMo account name" class="glow-input" />
              <div class="input-glow"></div>
            </div>
          </div>

          <div class="pay-summary">
            <span>Plan: <strong>{{ selectedPlan === 'yearly' ? 'Yearly (12 months)' : 'Monthly (1 month)' }}</strong></span>
            <span>Amount: <strong>{{ selectedPlan === 'yearly' ? planYearlyPrice : planMonthlyPrice }} {{ subscriptionStatus.currency }}</strong></span>
            <span>Pay to: <strong>{{ subscriptionStatus.payee?.name }} — {{ subscriptionStatus.payee?.msisdn }}</strong></span>
          </div>

          <button class="pay-btn" :disabled="subLoading" @click="checkout()">
            <Icon v-if="subLoading" name="loader" size="16" spin />
            <Icon v-else name="lock" size="16" />
            {{ subLoading ? 'Sending payment request…' : (selectedPlan === 'yearly' ? `PAY ${planYearlyPrice} ${subscriptionStatus.currency} YEARLY` : `PAY ${planMonthlyPrice} ${subscriptionStatus.currency} MONTHLY`) }}
          </button>

          <div v-if="premiumSteps > 0" class="pay-status">
            <div class="pay-step" :class="{ done: premiumSteps > 0 }"><span class="pay-step-n">1</span> Payment request sent</div>
            <div class="pay-step" :class="{ done: premiumSteps > 1 }"><span class="pay-step-n">2</span> Confirm on your phone (MoMo prompt)</div>
            <div class="pay-step" :class="{ done: premiumSteps > 2 }"><span class="pay-step-n">3</span> Premium activated — enjoy!</div>
            <p v-if="subMessage" class="sub-message" :class="{ ok: subOk }">{{ subMessage }}</p>
          </div>

          <p class="momo-note"><Icon name="info" size="12" /> {{ subscriptionStatus.momoConfigured ? 'A payment prompt will be sent to your number. Approve it on your phone and we auto-activate.' : 'Gateway is being configured — save your number above and you are ready, or pay directly to the number shown.' }}</p>
        </div>

        <button class="back-btn" @click="resetHome"><Icon name="arrowLeft" size="15" /> BACK TO THEATER</button>
      </div>

      <!-- Admin Panel -->
      <div v-if="currentPageName === 'admin'" class="admin-panel">
        <div class="admin-hero">
          <h2><Icon name="shield" size="20" /> Admin Control Center</h2>
          <p>Full control of users, site settings, the footer, subscriptions, alerts and content.</p>
        </div>

        <div class="admin-tabs">
          <button class="admin-tab" :class="{ active: adminTab === 'overview' }" @click="adminTab = 'overview'"><Icon name="grid" size="15" /> Overview</button>
          <button class="admin-tab" :class="{ active: adminTab === 'users' }" @click="adminTab = 'users'"><Icon name="users" size="15" /> Users</button>
          <button class="admin-tab" :class="{ active: adminTab === 'settings' }" @click="adminTab = 'settings'"><Icon name="sliders" size="15" /> Site &amp; Footer</button>
          <button class="admin-tab" :class="{ active: adminTab === 'themes' }" @click="adminTab = 'themes'"><Icon name="layers" size="15" /> Themes</button>
          <button class="admin-tab" :class="{ active: adminTab === 'notifications' }" @click="adminTab = 'notifications'"><Icon name="bell" size="15" /> Broadcast</button>
          <button class="admin-tab" :class="{ active: adminTab === 'comments' }" @click="adminTab = 'comments'"><Icon name="message" size="15" /> Comments</button>
          <button class="admin-tab" :class="{ active: adminTab === 'analytics' }" @click="adminTab = 'analytics'"><Icon name="trendingUp" size="15" /> Analytics</button>
          <button class="admin-tab" :class="{ active: adminTab === 'support' }" @click="adminTab = 'support'"><Icon name="mail" size="15" /> Support <span v-if="adminStats.openSupportRequests" class="admin-badge">{{ adminStats.openSupportRequests }}</span></button>
        </div>

        <!-- OVERVIEW -->
        <div v-if="adminTab === 'overview'" class="admin-tab-panel">
          <div class="admin-metrics">
            <div class="admin-card">
              <h3><Icon name="users" size="15" /> Total Users</h3>
              <p>{{ adminStats.totalUsers }}</p>
              <span class="admin-card-sub">{{ adminStats.activeUsers }} active</span>
            </div>
            <div class="admin-card">
              <h3><Icon name="eye" size="15" /> Movie Views</h3>
              <p>{{ adminStats.totalWatchRecords }}</p>
              <span class="admin-card-sub">watch records</span>
            </div>
            <div class="admin-card">
              <h3><Icon name="heart" size="15" /> Likes</h3>
              <p>{{ adminStats.totalFavorites }}</p>
              <span class="admin-card-sub">across all users</span>
            </div>
            <div class="admin-card">
              <h3><Icon name="message" size="15" /> Comments</h3>
              <p>{{ adminStats.totalComments }}</p>
              <span class="admin-card-sub">on the platform</span>
            </div>
            <div class="admin-card">
              <h3><Icon name="award" size="15" /> Premium</h3>
              <p>{{ adminStats.premiumUsers }}</p>
              <span class="admin-card-sub">{{ adminStats.trialUsers }} in free trial</span>
            </div>
            <div class="admin-card">
              <h3><Icon name="zap" size="15" /> Monthly Revenue</h3>
              <p>{{ adminStats.monthlyRevenue || 0 }}</p>
              <span class="admin-card-sub">{{ adminStats.currency }} FRW / month</span>
            </div>
          </div>
          <div class="admin-section">
            <h3>Top Movie Views</h3>
            <div v-if="movieViews.length" class="movie-view-list">
              <div v-for="view in movieViews" :key="view.movieTitle" class="movie-view-item">
                <span>{{ view.movieTitle }}</span>
                <strong>{{ view.views }} views</strong>
              </div>
            </div>
            <div v-else class="admin-empty">No view data available yet.</div>
          </div>
          <div class="admin-section">
            <h3>Latest Registrations</h3>
            <div v-if="adminUsers.length" class="admin-user-list">
              <div v-for="u in adminUsers.slice(0, 6)" :key="u.id" class="admin-user-row">
                <div class="admin-user-main">
                  <img v-if="u.avatar" :src="u.avatar" alt="" class="admin-avatar" />
                  <div v-else class="admin-avatar"><Icon name="user" size="14" /></div>
                  <div class="admin-user-meta">
                    <strong>{{ u.name || u.username || u.email }}</strong>
                    <span>{{ u.email }}</span>
                  </div>
                </div>
                <span class="admin-chip" :class="u.role === 'admin' ? 'chip-admin' : 'chip-user'">{{ u.role }}</span>
                <span class="admin-chip" :class="u.active !== false ? 'chip-on' : 'chip-off'">{{ u.active !== false ? 'active' : 'blocked' }}</span>
                <span class="admin-date">{{ formatDate(u.createdAt) }}</span>
              </div>
            </div>
            <div v-else class="admin-empty">No users yet.</div>
          </div>
        </div>

        <!-- USERS -->
        <div v-if="adminTab === 'users'" class="admin-tab-panel">
          <div class="admin-toolbar">
            <div class="input-group"><input v-model="adminUserFilter" type="text" placeholder="Search users by name, email or username..." class="glow-input" /><div class="input-glow"></div></div>
            <button class="btn-download-blue" @click="loadAdminDashboard"><Icon name="refresh" size="14" /> Refresh</button>
          </div>
          <div v-if="filteredAdminUsers.length" class="admin-user-list">
            <div v-for="u in filteredAdminUsers" :key="u.id" class="admin-user-card">
              <div class="admin-user-main">
                <img v-if="u.avatar" :src="u.avatar" alt="" class="admin-avatar" />
                <div v-else class="admin-avatar"><Icon name="user" size="14" /></div>
                <div class="admin-user-meta">
                  <strong>{{ u.name || u.username || u.email }}</strong>
                  <span>{{ u.email }}</span>
                  <span v-if="u.username" class="admin-meta">@{{ u.username }}</span>
                  <span v-if="u.phone" class="admin-meta"><Icon name="smartphone" size="11" /> {{ u.phone }}</span>
                  <span v-if="u.location" class="admin-meta"><Icon name="mapPin" size="11" /> {{ u.location }}</span>
                  <span class="admin-meta"><Icon name="heart" size="11" /> {{ u.favoriteCount || 0 }} likes</span>
                  <span class="admin-date">joined {{ formatDate(u.createdAt) }}</span>
                </div>
              </div>
              <div class="admin-user-badges">
                <span class="admin-chip" :class="u.role === 'admin' ? 'chip-admin' : 'chip-user'">{{ u.role }}</span>
                <span class="admin-chip" :class="u.active !== false ? 'chip-on' : 'chip-off'">{{ u.active !== false ? 'active' : 'blocked' }}</span>
                <span class="admin-chip" :class="u.lifetimeFree ? 'chip-lifetime' : (u.subscriptionTier === 'premium' ? 'chip-premium' : 'chip-trial')">{{ u.lifetimeFree ? 'lifetime free' : (u.subscriptionTier === 'premium' ? 'premium' : 'free / trial') }}</span>
              </div>
              <div class="admin-user-actions">
                <button class="admin-action" :class="{ danger: u.active !== false }" @click="toggleUserActive(u)"><Icon name="lock" size="12" /> {{ u.active !== false ? 'Block' : 'Unblock' }}</button>
                <button class="admin-action" :class="{ lifetime: u.lifetimeFree }" @click="toggleLifetimeFree(u)"><Icon name="zap" size="12" /> {{ u.lifetimeFree ? 'Remove Lifetime Free' : 'Free Forever' }}</button>
                <button class="admin-action" @click="toggleUserPremium(u)"><Icon name="award" size="12" /> {{ u.subscriptionTier === 'premium' ? 'Revoke Premium' : 'Give Premium' }}</button>
                <button class="admin-action" @click="resetUserTrial(u)" :disabled="isAdminUserRow(u)"><Icon name="refresh" size="12" /> Reset Trial</button>
                <button v-if="u.role !== 'admin'" class="admin-action" @click="toggleUserAdmin(u)"><Icon name="shield" size="12" /> Make Admin</button>
                <button class="admin-action danger" @click="deleteAdminUser(u.id)" :disabled="isAdminUserRow(u)"><Icon name="trash" size="12" /> Delete</button>
              </div>
            </div>
          </div>
          <div v-else class="admin-empty">No users match your search.</div>
        </div>

        <!-- SETTINGS / FOOTER -->
        <div v-if="adminTab === 'settings'" class="admin-tab-panel">
          <div class="admin-section">
            <h3>Site Identity</h3>
            <form @submit.prevent="saveAdminSettings" class="admin-settings-form">
              <label class="admin-field"><span>Site name</span><input v-model="adminSettings.siteName" class="glow-input" /></label>
              <label class="admin-field"><span>Tagline</span><input v-model="adminSettings.siteTagline" class="glow-input" /></label>
              <label class="admin-field full"><span>Site description (hero)</span><textarea v-model="adminSettings.siteDescription" rows="2" class="glow-input"></textarea></label>
            </form>
          </div>
          <div class="admin-section">
            <h3>Footer Content <span class="admin-hint">(edit anytime - shown to all visitors)</span></h3>
            <form @submit.prevent="saveAdminSettings" class="admin-settings-form">
              <label class="admin-field full"><span>Footer about text</span><textarea v-model="adminSettings.footerAbout" rows="2" class="glow-input"></textarea></label>
              <label class="admin-field"><span>Footer copyright line</span><input v-model="adminSettings.footerText" class="glow-input" /></label>
              <label class="admin-field"><span>Contact email</span><input v-model="adminSettings.email" class="glow-input" /></label>
              <label class="admin-field"><span>Contact phone</span><input v-model="adminSettings.phone" class="glow-input" /></label>
              <label class="admin-field"><span>Instagram handle</span><input v-model="adminSettings.instagram" class="glow-input" /></label>
              <label class="admin-field"><span>WhatsApp / MoMo number</span><input v-model="adminSettings.whatsapp" class="glow-input" /></label>
              <label class="admin-field full"><span>Feature bullets (comma separated)</span><input v-model="adminFeaturesText" class="glow-input" /></label>
            </form>
          </div>
          <div class="admin-section">
            <h3>Subscription Rules</h3>
            <form @submit.prevent="saveAdminSettings" class="admin-settings-form">
              <label class="admin-field"><span>Free trial (days)</span><input v-model.number="adminSettings.freeTrialDays" type="number" min="0" class="glow-input" /></label>
              <label class="admin-field"><span>Price per month</span><input v-model.number="adminSettings.subscriptionPrice" type="number" min="0" class="glow-input" /></label>
              <label class="admin-field"><span>Currency</span><input v-model="adminSettings.subscriptionCurrency" class="glow-input" /></label>
            </form>
          </div>
          <div class="admin-savebar">
            <button class="auth-btn primary" @click="saveAdminSettings" :disabled="adminSaving"><Icon v-if="adminSaving" name="loader" size="14" spin /> <Icon v-else name="check" size="14" /> Save All Settings</button>
            <span v-if="adminSettingsSaved" class="admin-saved-tick">Saved!</span>
          </div>
        </div>

        <!-- THEMES -->
        <div v-if="adminTab === 'themes'" class="admin-tab-panel">
          <div class="admin-toolbar">
            <div class="admin-toolbar-title">
              <Icon name="layers" size="15" /> Design Studio — pick the theme every user's panel uses
            </div>
            <button v-if="adminThemesPreview" class="btn-download-blue" @click="clearPreview"><Icon name="x" size="14" /> Stop preview</button>
          </div>
          <p v-if="adminThemesPreview" class="theme-preview-note">
            <Icon name="eye" size="13" /> You are <strong>live previewing</strong> "<strong>{{ currentThemeName }}</strong>". Click "Apply &amp; save" under a card to make it official for all users.
          </p>
          <div class="admin-theme-grid">
            <div
              v-for="t in (adminSettings.availableThemes || SITE_THEMES)"
              :key="t.id"
              class="admin-theme-card"
              :class="{
                active: adminThemesPreview ? adminThemesPreview === t.id : adminSettings.siteTheme === t.id,
                previewing: adminThemesPreview === t.id
              }"
              @click="previewSiteTheme(t.id)"
            >
              <div class="theme-card-preview" :style="themePreviewStyle(t)">
                <span class="theme-card-dot"></span>
                <span class="theme-card-line"></span>
                <span class="theme-card-line short"></span>
                <span class="theme-card-chip"><span :style="{ background: t.primary }"></span> {{ t.primary }}</span>
                <div class="theme-card-glow" :style="{ background: t.primary }"></div>
              </div>
              <div class="theme-card-name">
                <span class="theme-swatch" :style="{ background: t.primary }"></span>
                <span class="theme-swatch" :style="{ background: t.accent }"></span>
                <span class="theme-swatch" :style="{ background: t.accent2 }"></span>
                <strong>{{ t.name }}</strong>
                <em v-if="adminSettings.siteTheme === t.id && !adminThemesPreview">• current</em>
                <em v-else-if="adminThemesPreview === t.id">• previewing</em>
              </div>
              <button
                class="admin-theme-apply"
                :disabled="adminSaving"
                @click.stop="applyThemeToSite(t)"
              >
                <Icon name="check" size="13" /> {{ adminSettings.siteTheme === t.id && !adminThemesPreview ? 'Active — saved' : 'Apply &amp; save' }}
              </button>
            </div>
          </div>
        </div>

        <!-- BROADCAST -->
        <div v-if="adminTab === 'notifications'" class="admin-tab-panel">
          <div class="admin-section">
            <h3>Send Alert to All Users</h3>
            <form @submit.prevent="broadcastNotification" class="admin-settings-form">
              <label class="admin-field full"><span>Alert title</span><input v-model="broadcastTitle" placeholder="e.g. New blockbuster just landed!" class="glow-input" /></label>
              <label class="admin-field full"><span>Alert message</span><textarea v-model="broadcastBody" rows="3" placeholder="e.g. The latest movie is now streaming on Filmz. Watch it free during your trial." class="glow-input"></textarea></label>
              <div class="admin-savebar">
                <button class="auth-btn primary" :disabled="broadcasting"><Icon v-if="broadcasting" name="loader" size="14" spin /> <Icon v-else name="send" size="14" /> Send to All Users</button>
              </div>
            </form>
          </div>
        </div>

        <!-- COMMENTS -->
        <div v-if="adminTab === 'comments'" class="admin-tab-panel">
          <div class="admin-section">
            <h3>Moderate Comments</h3>
            <div v-if="adminComments.length" class="admin-comments">
              <div v-for="c in adminComments" :key="c.id" class="admin-comment-row">
                <div class="admin-comment-main">
                  <strong>{{ c.userName }}</strong>
                  <span class="admin-date">{{ formatDate(c.date) }}</span>
                  <p>{{ c.text }}</p>
                </div>
                <button class="admin-action danger" @click="deleteAdminComment(c)"><Icon name="trash" size="12" /> Remove</button>
              </div>
            </div>
            <div v-else class="admin-empty">No comments to moderate yet.</div>
          </div>
        </div>

        <!-- ANALYTICS -->
        <div v-if="adminTab === 'analytics'" class="admin-tab-panel">
          <div class="admin-toolbar">
            <div class="admin-toolbar-title">Visitors &amp; website activity</div>
            <button class="btn-download-blue" @click="loadAdminDashboard"><Icon name="refresh" size="14" /> Refresh</button>
          </div>
          <div v-if="!analytics" class="admin-empty">Analytics loading…</div>
          <div v-else>
            <div class="admin-metrics">
              <div class="admin-card">
                <h3><Icon name="eye" size="15" /> Total Views</h3>
                <p>{{ analytics.totalViews || 0 }}</p>
                <span class="admin-card-sub">all time</span>
              </div>
              <div class="admin-card">
                <h3><Icon name="calendar" size="15" /> Views Today</h3>
                <p>{{ analytics.todayViews || 0 }}</p>
                <span class="admin-card-sub">since midnight</span>
              </div>
              <div class="admin-card">
                <h3><Icon name="trendingUp" size="15" /> This Week</h3>
                <p>{{ analytics.weekViews || 0 }}</p>
                <span class="admin-card-sub">last 7 days</span>
              </div>
              <div class="admin-card">
                <h3><Icon name="users" size="15" /> Unique Visitors</h3>
                <p>{{ analytics.uniqueVisitors || 0 }}</p>
                <span class="admin-card-sub">distinct visitors</span>
              </div>
            </div>

            <div class="admin-section">
              <h3>7-Day Activity <span class="admin-hint">views per day</span></h3>
              <div class="analytics-bars">
                <div v-for="d in analytics.last7Days" :key="d.date" class="analytics-bar-col">
                  <div class="analytics-bar-track">
                    <div class="analytics-bar" :style="{ height: Math.max(6, (d.count / (analytics.maxDay || 1)) * 100) + '%' }">
                      <span>{{ d.count }}</span>
                    </div>
                  </div>
                  <small>{{ d.label }}</small>
                </div>
              </div>
            </div>

            <div class="analytics-row">
              <div class="admin-section">
                <h3><Icon name="music" size="15" /> Most Played Music</h3>
                <div v-if="analytics.popularMusic && analytics.popularMusic.length" class="admin-simple-list">
                  <div v-for="(m, i) in analytics.popularMusic" :key="i" class="admin-simple-row">
                    <span class="rank">{{ i + 1 }}</span>
                    <div class="admin-simple-main">
                      <strong>{{ m.title }}</strong>
                      <small>{{ m.channelTitle }}</small>
                    </div>
                    <span v-if="m.plays" class="admin-simple-count">{{ m.plays }} plays</span>
                  </div>
                </div>
                <div v-else class="admin-empty">No music played yet. Get people jamming on YOUTMUS!</div>
              </div>
              <div class="admin-section">
                <h3>Views by Page</h3>
                <div v-if="analytics.viewsByPage && analytics.viewsByPage.length" class="admin-simple-list">
                  <div v-for="(p, i) in analytics.viewsByPage" :key="i" class="admin-simple-row">
                    <span class="rank">{{ i + 1 }}</span>
                    <div class="admin-simple-main">
                      <strong>{{ p.page }}</strong>
                      <small>page visits</small>
                    </div>
                    <span class="admin-simple-count">{{ p.count }}</span>
                  </div>
                </div>
                <div v-else class="admin-empty">No page views yet.</div>
              </div>
            </div>

            <div class="admin-section">
              <h3>Recent Visitors</h3>
              <div v-if="analytics.recentVisitors && analytics.recentVisitors.length" class="admin-simple-list">
                <div v-for="(v, i) in analytics.recentVisitors" :key="i" class="admin-simple-row">
                  <span class="rank"><Icon name="user" size="12" /></span>
                  <div class="admin-simple-main">
                    <strong>{{ v.page }}</strong>
                    <small>Visitor IP {{ v.ip || 'hidden' }}</small>
                    <span class="admin-date">{{ formatDate(v.createdAt) }}</span>
                  </div>
                  <span class="admin-simple-count">{{ formatYtDate(v.createdAt) }}</span>
                </div>
              </div>
              <div v-else class="admin-empty">No visitors recorded yet.</div>
            </div>
          </div>
        </div>

        <!-- SUPPORT / REQUESTS -->
        <div v-if="adminTab === 'support'" class="admin-tab-panel">
          <div class="admin-toolbar">
            <div class="admin-toolbar-title">User requests &amp; problems</div>
            <button class="btn-download-blue" @click="loadAdminSupport"><Icon name="refresh" size="14" /> Refresh</button>
            <span v-if="adminRequestsFilter" class="admin-chip" :class="adminRequestsFilter === 'open' ? 'chip-off' : 'chip-on'" @click="adminRequestsFilter = ''">{{ adminRequestsFilter === 'open' ? 'Showing open only' : 'Showing resolved only' }}</span>
          </div>
          <div v-if="filteredAdminSupport.length" class="admin-support-list">
            <div v-for="req in filteredAdminSupport" :key="req.id" class="admin-support-card" :class="{ resolved: req.status === 'resolved' }">
              <div class="support-item-head">
                <div class="admin-user-meta">
                  <strong>{{ req.subject }}</strong>
                  <span>From: {{ req.userName || 'User' }} ({{ req.email }})</span>
                </div>
                <span class="admin-chip" :class="req.status === 'resolved' ? 'chip-on' : 'chip-off'">{{ req.status === 'resolved' ? 'RESOLVED' : 'OPEN' }}</span>
              </div>
              <p class="support-msg">{{ req.message }}</p>
              <div v-for="rep in req.replies" :key="rep._id || rep.date" class="support-reply" :class="{ admin: rep.by === 'admin' }">
                <strong>{{ rep.by === 'admin' ? 'Admin' : 'User' }}</strong>
                <p>{{ rep.text }}</p>
                <span class="support-date">{{ formatDate(rep.date) }}</span>
              </div>
              <div class="admin-support-actions">
                <div class="input-group support-reply-input"><input v-model="supportReplyDrafts[req.id]" type="text" placeholder="Write a reply to this user..." class="glow-input" @keydown.enter.prevent="sendSupportReply(req)" /><div class="input-glow"></div></div>
                <button class="admin-action" @click="sendSupportReply(req)" :disabled="!supportReplyDrafts[req.id]"><Icon name="send" size="12" /> Reply</button>
                <button class="admin-action" @click="toggleSupportStatus(req)"><Icon name="check" size="12" /> {{ req.status === 'resolved' ? 'Reopen' : 'Resolve' }}</button>
                <button class="admin-action danger" @click="deleteAdminSupport(req)"><Icon name="trash" size="12" /> Delete</button>
              </div>
            </div>
          </div>
          <div v-else class="admin-empty">No user requests yet.</div>
        </div>

        <button class="back-btn" @click="resetHome"><Icon name="arrowLeft" size="15" /> BACK TO THEATER</button>
      </div>

      <!-- Watchlist Selection Modal -->
      <div v-if="showWatchlistModal" class="modal-overlay" @click="closeWatchlistModal">
        <div class="modal-content" @click.stop>
          <h3>Add to Watchlist</h3>
          <p>Select a list or create a new one for "{{ selectedMovieForList?.title || selectedMovieForList?.name }}"</p>
          <div class="watchlist-options">
            <div v-for="list in watchlists" :key="list.id" class="watchlist-option" @click="addToSpecificList(list)">
              {{ list.name }}
            </div>
            <div class="watchlist-option new-list" @click="showNewListInput = true">
              + Create New List
            </div>
          </div>
          <div v-if="showNewListInput" class="new-list-input">
            <input v-model="newListName" placeholder="List name" @keyup.enter="createAndAddToList" />
            <button @click="createAndAddToList">Create & Add</button>
          </div>
          <button class="modal-close" @click="closeWatchlistModal">Cancel</button>
        </div>
      </div>

      <!-- Settings Modal -->
      <Transition name="modal-fade">
        <div v-if="isSettingsOpen" class="modal-overlay" @click="isSettingsOpen = false">
          <div class="modal-content settings-modal" @click.stop>
            <div class="settings-modal-head">
              <span class="settings-head-icon"><Icon name="sliders" size="20" /></span>
              <div>
                <h3>{{ t('appearance') }}</h3>
                <p>{{ lang === 'fr' ? 'Personnalisez votre expérience Filmz.' : 'Tune your Filmz experience your way.' }}</p>
              </div>
              <button class="settings-x" @click="isSettingsOpen = false" :aria-label="t('done')"><Icon name="x" size="16" /></button>
            </div>

            <div class="settings-group">
              <div class="settings-group-label">
                <Icon name="eye" size="14" /> {{ lang === 'fr' ? 'Apparence' : 'Appearance' }}
              </div>

              <div class="settings-row">
                <div class="settings-info">
                  <span class="settings-label"><Icon name="sun" size="16" /> {{ t('darkMode') }}</span>
                  <p>{{ lang === 'fr' ? 'Thème sombre façon espace profond pour tout le cinéma.' : 'Deep-space dark theme for the whole theater.' }}</p>
                </div>
                <button class="switch" :class="{ on: darkMode }" role="switch" :aria-checked="darkMode" @click="toggleDarkMode">
                  <span class="switch-knob"></span>
                </button>
              </div>

              <div v-if="!darkMode" class="settings-theme-block">
                <div class="settings-theme-head">
                  <span class="settings-label"><Icon name="layers" size="16" /> Theme</span>
                  <span class="theme-current-name">{{ userThemeName }}</span>
                </div>
                <p class="settings-theme-hint">{{ lang === 'fr' ? 'Choisissez un univers d’accent pour l’interface.' : 'Pick an accent universe for the interface.' }}</p>
                <div class="theme-swatch-grid">
                  <button
                    v-for="th in SITE_THEMES"
                    :key="th.id"
                    class="theme-swatch-btn"
                    :class="{ active: currentTheme === th.id }"
                    :title="th.name"
                    @click="setUserTheme(th.id)"
                  >
                    <span class="tsw-dot" :style="{ background: th.primary }"></span>
                    <span class="tsw-dot" :style="{ background: th.accent }"></span>
                    <span class="tsw-dot" :style="{ background: th.accent2 }"></span>
                    <em>{{ th.name }}</em>
                    <span v-if="currentTheme === th.id" class="tsw-check"><Icon name="check" size="11" /></span>
                  </button>
                </div>
              </div>
              <p v-else class="settings-theme-darknote">
                <Icon name="moon" size="13" /> {{ lang === 'fr' ? 'Mode sombre actif — désactivez-le pour changer de thème.' : 'Dark mode is on — turn it off to pick a theme.' }}
              </p>
            </div>

            <div class="settings-group">
              <div class="settings-group-label">
                <Icon name="smartphone" size="14" /> {{ lang === 'fr' ? 'Langue & accessibilité' : 'Language & accessibility' }}
              </div>

              <div class="settings-row">
                <div class="settings-info">
                  <span class="settings-label"><Icon name="layers" size="16" /> {{ t('language') }}</span>
                  <p>{{ lang === 'fr' ? 'Choisissez votre langue d’affichage.' : 'Choose your display language.' }}</p>
                </div>
              </div>
              <div class="lang-picker">
                <button class="lang-pick" :class="{ active: lang === 'en' }" @click="changeLanguage('en')">
                  <span class="lang-flag">🇬🇧</span>
                  <span><strong>English</strong><small>Anglais</small></span>
                  <span class="lang-check" v-if="lang === 'en'"><Icon name="check" size="12" /></span>
                </button>
                <button class="lang-pick" :class="{ active: lang === 'fr' }" @click="changeLanguage('fr')">
                  <span class="lang-flag">🇫🇷</span>
                  <span><strong>Français</strong><small>French</small></span>
                  <span class="lang-check" v-if="lang === 'fr'"><Icon name="check" size="12" /></span>
                </button>
              </div>

              <div class="settings-row">
                <div class="settings-info">
                  <span class="settings-label"><Icon name="zap" size="16" /> {{ t('reduceMotion') }}</span>
                  <p>{{ lang === 'fr' ? 'Calme les animations, lueurs et le champ d’étoiles.' : 'Calm down the animations, glows &amp; starfield.' }}</p>
                </div>
                <button class="switch" :class="{ on: reduceMotion }" role="switch" :aria-checked="reduceMotion" @click="toggleReduceMotion">
                  <span class="switch-knob"></span>
                </button>
              </div>
            </div>

            <div class="settings-footer">
              <button class="modal-close" @click="isSettingsOpen = false">{{ t('done') }}</button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- AI Chat Widget -->
      <div class="ai-chat-widget">
        <div v-if="!isChatOpen" class="chat-toggle" @click="toggleChat">
          <div class="chat-icon"><Icon name="compass" size="28" /></div>
        </div>
        <div v-else class="chat-window">
          <div class="chat-bg-particles">
            <div v-for="n in 10" :key="n" class="chat-particle" :style="{ animationDelay: `${n * 0.5}s` }"></div>
          </div>
          <div class="chat-header">
            <h3>AI Assistant</h3>
            <button class="chat-close" @click="toggleChat"><Icon name="x" size="18" /></button>
          </div>
          <div class="chat-messages" ref="chatMessagesRef">
            <div v-for="(msg, index) in chatMessages" :key="index" :class="['chat-message', msg.role]">
              <div class="message-content">{{ msg.content }}</div>
            </div>
          </div>
          <div class="chat-input-area">
            <input
              v-model="chatInput"
              @keyup.enter="sendMessage"
              placeholder="Ask me anything..."
              class="chat-input"
              :disabled="isChatLoading"
            />
            <button @click="sendMessage" class="chat-send" :disabled="isChatLoading || !chatInput.trim()">
              <Icon v-if="isChatLoading" name="loader" size="18" spin />
              <Icon v-else name="send" size="18" />
            </button>
          </div>
        </div>
      </div>

      <!-- Toast notifications -->
      <!-- Mini music bar -->
      <Transition name="yt-minibar">
        <div v-if="ytPlaying" class="yt-minibar">
          <img :src="ytPlaying.thumbnail" :alt="ytPlaying.title" />
          <div class="yt-mini-info">
            <strong>{{ ytPlaying.title }}</strong>
            <small>{{ ytPlaying.channelTitle }}</small>
          </div>
          <span class="yt-mini-eq"><span></span><span></span><span></span></span>
          <button class="yt-mini-ctl" @click="toggleYtPlayPause" :title="ytIsPlaying ? 'Pause' : 'Play'">
            <Icon :name="ytIsPlaying ? 'pause' : 'play'" size="18" />
          </button>
          <a class="yt-mini-open" :href="'https://www.youtube.com/watch?v=' + ytPlaying.id" target="_blank" rel="noopener" title="Open on YouTube">
            <Icon name="play" size="14" />
          </a>
          <button class="yt-mini-close" @click="stopYoutmus" title="Stop music"><Icon name="x" size="15" /></button>
        </div>
      </Transition>

      <div class="toast-container" aria-live="polite">
        <TransitionGroup name="toast" tag="div" class="toast-stack">
          <div v-for="toast in toasts" :key="toast.id" :class="['toast', toast.type]">
            <Icon :name="toastIcon(toast.type)" size="17" class="toast-icon" />
            <span class="toast-message">{{ toast.message }}</span>
            <button class="toast-close" @click="dismissToast(toast.id)"><Icon name="x" size="13" /></button>
          </div>
        </TransitionGroup>
      </div>

      <!-- Back to top -->
      <Transition name="fade">
        <button
          v-if="showBackToTop"
          class="back-to-top"
          @click="scrollToTop"
          aria-label="Back to top"
        >
          <Icon name="arrowUp" size="20" />
        </button>
      </Transition>

      <!-- Always-visible floating Home button -->
      <button class="home-fab" :aria-label="t('backHome')" :title="t('backHome')" @click="resetHome">
        <Icon name="home" size="20" />
        <span class="home-fab-tip">{{ lang === 'fr' ? 'Accueil' : 'Home' }}</span>
      </button>
    </main>

    <!-- Footer on every page -->
    <footer class="app-footer">
      <div class="footer-content">
        <div class="footer-section">
          <h4>{{ siteSettings.siteName }} Filmz</h4>
          <p>{{ siteSettings.footerAbout || siteSettings.siteDescription || 'Explore the galaxy of movies and series in an immersive space-themed experience.' }}</p>
        </div>
        <div class="footer-section">
          <h4>Features</h4>
          <ul>
            <li v-for="f in siteSettings.features" :key="f">{{ f }}</li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Connect</h4>
          <p><a :href="'mailto:' + siteSettings.email" class="footer-link"><Icon name="mail" size="14" /> {{ siteSettings.email }}</a></p>
          <p><a :href="'tel:' + siteSettings.phone" class="footer-link"><Icon name="smartphone" size="14" /> {{ siteSettings.phone }}</a></p>
          <p><a :href="'https://instagram.com/' + siteSettings.instagram" target="_blank" rel="noopener noreferrer" class="footer-link"><Icon name="instagram" size="14" /> @{{ siteSettings.instagram }}</a></p>
        </div>
        <div class="footer-section">
          <h4>Theme</h4>
          <select v-model="currentTheme" @change="changeTheme" class="footer-theme-select">
            <option value="default">Galaxy</option>
            <option value="dark">Deep Space</option>
            <option value="neon">Neon Cyber</option>
            <option value="retro">Retro Sci-Fi</option>
          </select>
        </div>
      </div>
      <div class="footer-cta-row">
        <div class="footer-cta-text">
          <p>Stay connected and keep exploring new movies every time you return.</p>
        </div>
        <div class="footer-cta-buttons">
          <a href="#" @click="resetHome" class="footer-cta-btn"><Icon name="home" size="15" /> Home</a>
          <a :href="'mailto:' + siteSettings.email" class="footer-cta-btn">Contact</a>
          <a :href="'https://instagram.com/' + siteSettings.instagram" target="_blank" rel="noopener noreferrer" class="footer-cta-btn secondary">Follow</a>
        </div>
      </div>
      <div class="footer-bottom">
        <p>{{ siteSettings.footerText || '&copy; 2026 ' + siteSettings.siteName + ' Filmz. All rights reserved.' }}</p>
      </div>
    </footer>

    <AIAssistant />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed, nextTick } from 'vue';
import axios from 'axios';
import AIAssistant from './AIAssistant.vue';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || 'e7db3a3c0e678db81b80238ab2bf0afa';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const movies = ref([]);
const heroMovies = ref([]);
const featuredIndex = ref(0);
let heroTimer = null;
const featuredMovie = computed(() => heroMovies.value[featuredIndex.value] || heroMovies.value[0] || {});
const featuredYear = computed(() => (featuredMovie.value.release_date || featuredMovie.value.first_air_date || '').split('-')[0] || '');
const selectFeatured = (i) => { featuredIndex.value = i; };
const startHeroRotation = () => {
  if (heroTimer) clearInterval(heroTimer);
  heroTimer = setInterval(() => {
    if (heroMovies.value.length) featuredIndex.value = (featuredIndex.value + 1) % heroMovies.value.length;
  }, 6500);
};
const pauseHero = () => {
  if (heroTimer) { clearInterval(heroTimer); heroTimer = null; }
};
const resumeHero = () => {
  if (!heroTimer) startHeroRotation();
};
const mode = ref('movie');
const searchQuery = ref('');
const currentPageName = ref('home');

// === YOUTMUS (YouTube Music lounge) ===
const youtmusChips = ['Trending', 'Afrobeats', 'Gospel Worship', 'R&B', 'Pop', 'Hip-Hop', 'Amapiano', 'Dancehall', 'Lofi Beats', 'Rwanda Music'];
const youtmusQuery = ref('');
const youtmusChip = ref('Trending');
const youtmusItems = ref([]);
const youtmusLabel = ref('Trending Music');
const youtmusSearch = ref(null);
const ytPlaying = ref(null);
const ytLoading = ref(false);
const ytError = ref('');
const _ytLoad = ref(null);

const myPlaylists = ref([]);
const openPlaylistId = ref(null);
const showYtPlaylistPicker = ref(false);
const pendingYtSong = ref(null);
const newPlaylistName = ref('');
const ytPlBusy = ref(false);

const formatYtViews = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return String(n || '0');
  if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(num);
};

const formatYtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const trackVisit = (page) => {
  try { fetch(`${API_BASE}/track/visit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page }) }); } catch (e) { /* silent */ }
};

const openYoutmus = () => {
  currentPageName.value = 'youtmus';
  trackVisit('/youtmus');
  if (isAuthenticated.value) loadMyPlaylists();
  if (youtmusItems.value.length === 0 && !ytLoading.value && !_ytLoad.value) {
    runYoutmusChip('Trending');
  }
};

const runYoutmusChip = async (chip) => {
  youtmusChip.value = chip;
  ytPlaying.value = null;
  youtmusSearch.value = null;
  youtmusQuery.value = '';
  const q = chip === 'Trending' ? '' : chip;
  youtmusLabel.value = chip === 'Trending' ? 'Trending Music' : `${chip} Playlist`;
  await loadYoutmus(q);
};

const runYoutmusSearch = async () => {
  const q = (youtmusQuery.value || '').trim();
  if (!q) return;
  youtmusChip.value = 'Trending';
  youtmusSearch.value = q;
  ytPlaying.value = null;
  youtmusLabel.value = `Results for “${q}”`;
  await loadYoutmus(q);
};

const resetYoutmusList = () => {
  youtmusSearch.value = null;
  ytPlaying.value = null;
  runYoutmusChip(youtmusChip.value === 'Trending' ? 'Trending' : youtmusChip.value);
};

const loadYoutmus = async (q) => {
  ytLoading.value = true;
  ytError.value = '';
  const url = q
    ? `${API_BASE}/youtube/search?q=${encodeURIComponent(q)}&max=30`
    : `${API_BASE}/youtube/trending?max=30`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not load music');
    youtmusItems.value = data.results || [];
    youtmusLabel.value = data.label || youtmusLabel.value;
    _ytLoad.value = Date.now();
  } catch (error) {
    ytError.value = error.message || 'Could not load music right now';
    youtmusItems.value = [];
  } finally {
    ytLoading.value = false;
  }
};

let ytApiPlayer = null;
let ytApiLoader = null;
const ytIsPlaying = ref(false);
const ytPlayerBox = ref(null);

const ensureYtApi = () => {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApiLoader) return ytApiLoader;
  ytApiLoader = new Promise((resolve) => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
  });
  return ytApiLoader;
};

const playYoutmus = async (item, label) => {
  ytPlaying.value = { ...item, kindLabel: label };
  try {
    fetch(`${API_BASE}/track/play`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId: item.id, title: item.title, channelTitle: item.channelTitle })
    });
  } catch (e) { /* silent */ }
  ytIsPlaying.value = false;
  await nextTick();
  try {
    const YT = await ensureYtApi();
    if (!ytPlayerBox.value) return;
    if (ytApiPlayer) {
      ytApiPlayer.loadVideoById(item.id);
      try { ytApiPlayer.playVideo(); } catch (e) { /* silent */ }
    } else {
      ytApiPlayer = new YT.Player(ytPlayerBox.value, {
        videoId: item.id,
        playerVars: { autoplay: 1, playsinline: 1, rel: 0 },
        events: {
          onReady: (ev) => { try { ev.target.playVideo(); } catch (e) { /* silent */ } },
          onStateChange: (ev) => { ytIsPlaying.value = ev.data === 1; },
          onError: () => {
            ytIsPlaying.value = false;
            showToast('This song cannot play in the app — it blocks embedding. Tap "Watch on YouTube".', 'warning');
          }
        }
      });
    }
  } catch (e) {
    console.error('YOUTMUS player error:', e);
  }
};

const playPlaylistSong = (song, label) => {
  playYoutmus({
    id: song.videoId,
    title: song.title,
    channelTitle: song.channelTitle,
    thumbnail: song.thumbnail,
    duration: song.duration,
    viewCount: song.viewCount
  }, label || 'My Playlist');
};

const toggleYtPlayPause = () => {
  if (!ytApiPlayer) return;
  try {
    const state = ytApiPlayer.getPlayerState();
    if (state === 1) { ytApiPlayer.pauseVideo(); ytIsPlaying.value = false; }
    else { ytApiPlayer.playVideo(); ytIsPlaying.value = true; }
  } catch (e) { /* silent */ }
};

const stopYoutmus = () => {
  if (ytApiPlayer) {
    try { ytApiPlayer.stopVideo(); } catch (e) { /* silent */ }
    try { ytApiPlayer.destroy(); } catch (e) { /* silent */ }
  }
  ytApiPlayer = null;
  ytIsPlaying.value = false;
  ytPlaying.value = null;
};

const loadMyPlaylists = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${API_BASE}/playlists/mine`, { headers: { Authorization: 'Bearer ' + token } });
    const data = await res.json();
    if (res.ok) myPlaylists.value = data.playlists || [];
  } catch (e) { /* silent */ }
};

const pickPlaylistTarget = (item) => {
  if (!isAuthenticated.value) {
    showToast('Log in to save songs to your playlists.', 'warning');
    return;
  }
  pendingYtSong.value = item;
  newPlaylistName.value = '';
  showYtPlaylistPicker.value = true;
  loadMyPlaylists();
};

const returnFromPicker = () => {
  showYtPlaylistPicker.value = false;
  pendingYtSong.value = null;
};

const ytSongPayload = (s) => ({
  videoId: s.id || s.videoId,
  title: s.title || '',
  channelTitle: s.channelTitle || '',
  thumbnail: s.thumbnail || '',
  duration: s.duration || '',
  viewCount: s.viewCount || ''
});

const addToPlaylist = async (p) => {
  if (!pendingYtSong.value) return;
  ytPlBusy.value = true;
  try {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${API_BASE}/playlists/${p.id}/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ song: ytSongPayload(pendingYtSong.value) })
    });
    const data = await res.json();
    if (res.status === 409) { showToast('That song is already in this playlist.', 'info'); returnFromPicker(); return; }
    if (!res.ok) throw new Error(data.error || 'Could not add song');
    await loadMyPlaylists();
    openPlaylistId.value = p.id;
    showToast(`Added to "${data.name}"`);
    returnFromPicker();
  } catch (e) {
    showToast(e.message || 'Could not add song.', 'danger');
  } finally {
    ytPlBusy.value = false;
  }
};

const createPlaylistAndAdd = async () => {
  const name = (newPlaylistName.value || '').trim();
  if (!name) { showToast('Give your playlist a name first.', 'warning'); return; }
  ytPlBusy.value = true;
  try {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${API_BASE}/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not create playlist');
    showToast(`Playlist "${data.name}" created!`);
    await loadMyPlaylists();
    openPlaylistId.value = data.id;
    if (pendingYtSong.value) {
      await addToPlaylist(data);
    } else {
      returnFromPicker();
    }
  } catch (e) {
    showToast(e.message || 'Could not create playlist.', 'danger');
  } finally {
    ytPlBusy.value = false;
  }
};

const togglePlaylist = (p) => {
  openPlaylistId.value = openPlaylistId.value === p.id ? null : p.id;
};

const removePlaylistSong = async (p, s) => {
  try {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${API_BASE}/playlists/${p.id}/songs/${encodeURIComponent(s.videoId)}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token }
    });
    if (!res.ok) throw new Error('Could not remove song');
    showToast('Removed from playlist.');
    await loadMyPlaylists();
  } catch (e) {
    showToast(e.message || 'Could not remove song.', 'danger');
  }
};

const deletePlaylist = async (p) => {
  try {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${API_BASE}/playlists/${p.id}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token }
    });
    if (!res.ok) throw new Error('Could not delete playlist');
    if (openPlaylistId.value === p.id) openPlaylistId.value = null;
    myPlaylists.value = myPlaylists.value.filter(x => x.id !== p.id);
    showToast('Playlist deleted.');
  } catch (e) {
    showToast(e.message || 'Could not delete playlist.', 'danger');
  }
};
const trailerUrl = ref(null);
const currentMovieTitle = ref('');
const fullMovieUrl = ref(null);
const currentMovieId = ref(null);
const currentMovieDownloadUrl = ref(null);
const activeProviderIndex = ref(0);
const playerProviders = [
  { name: 'VidSrc', build: (type, id) => `https://vidsrc.to/embed/${type}/${id}` },
  { name: 'MultiEmbed', build: (type, id) => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1` },
  { name: 'EmbedSu', build: (type, id) => `https://embed.su/embed/${type}/${id}` },
  { name: 'PlayerHub', build: (type, id) => `https://playerhub.xyz/embed/${type}/${id}` }
];
const currentEmbedUrl = computed(() => {
  if (!currentMovieId.value) return null;
  const type = mode.value === 'movie' ? 'movie' : 'tv';
  return playerProviders[activeProviderIndex.value].build(type, currentMovieId.value);
});
const page = ref(1);
const loading = ref(false);
const scrollTrigger = ref(null);
const chatMessagesRef = ref(null);

const isRegister = ref(false);
const loginEmail = ref('');
const loginPassword = ref('');
const showLoginPassword = ref(false);
const registerEmail = ref('');
const registerPassword = ref('');
const registerConfirmPassword = ref('');
const registerUsername = ref('');
const registerPhone = ref('');
const registerLocation = ref('');
const registerName = ref('');
const forgotEmail = ref('');
const loginLoading = ref(false);
const registerLoading = ref(false);
const forgotLoading = ref(false);
const resetSent = ref(false);
const resetLink = ref('');
const resetError = ref('');
const loginError = ref('');
const registerError = ref('');
const resetToken = ref('');
const resetEmail = ref('');
const resetNewPassword = ref('');
const resetConfirmPassword = ref('');
const showResetPassword = ref(false);
const resetLoading = ref(false);
const resetComplete = ref(false);

const user = ref(null);
const isAuthenticated = ref(false);
const logoX = ref(0);
const logoY = ref(0);
const logoScale = ref(1);

const commentName = ref('');
const commentText = ref('');
const comments = ref([]);
const commentLoading = ref(false);
const commentSuccess = ref(false);
const commentError = ref('');

// New refs for additional features
const profile = ref({ name: '', username: '', phone: '', location: '', bio: '', avatar: null, email: '', notificationsEnabled: true });
const watchHistory = ref([]);
const watchlists = ref([]);
const favorites = ref([]);
const recommendations = ref([]);
const selectedMovie = ref(null);
const movieDetails = ref(null);
const similarMovies = ref([]);
const movieReviews = ref([]);
const hoveredGenre = ref('');
const adminUsers = ref([]);
const adminStats = ref({ totalUsers: 0, totalWatchRecords: 0 });
const analytics = ref(null);
const movieViews = ref([]);
const adminTab = ref('overview');
const adminUserFilter = ref('');
const adminComments = ref([]);
const adminSaving = ref(false);
const adminSettingsSaved = ref(false);
const broadcastTitle = ref('');
const broadcastBody = ref('');
const broadcasting = ref(false);
const supportSubject = ref('');
const supportMessage = ref('');
const supportSending = ref(false);
const mySupportRequests = ref([]);
const adminSupport = ref([]);
const adminRequestsFilter = ref('');
const supportReplyDrafts = ref({});
const siteSettings = ref({
  siteName: 'Ka_samuel@250',
  siteTagline: 'The Galaxy of Movies & Series',
  siteDescription: '',
  footerAbout: '',
  footerText: '',
  instagram: 'ka__samuel250',
  whatsapp: '0782175566',
  phone: '+250 787 949 343',
  email: 'kasamuel71@gmail.com',
  features: ['Movie Trailers', 'User Profiles', 'Watchlists', 'AI Assistant']
});
const adminSettings = ref({});
const adminFeaturesText = ref('');
const isAdmin = computed(() => user.value?.role === 'admin' || user.value?.username === 'ka__samuel250' || user.value?.email === 'kasamuel71@gmail.com');

// Likes (real counts)
const likesMap = ref({});
const likedMap = ref({});

// Notifications
const notifsOpen = ref(false);
const notifications = ref([]);
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length);

// Subscription / Mobile Money
const momoNumber = ref('');
const momoName = ref('');
const subLoading = ref(false);
const subMessage = ref('');
const subOk = ref(false);
const selectedPlan = ref('monthly');
const premiumSteps = ref(0);
const momoProvider = ref('MTN');
const locDetecting = ref(false);
const momoProviders = [
  { id: 'MTN', name: 'MTN Mobile Money', note: 'Standard MTN MoMo — most reliable' },
  { id: 'Airtel', name: 'Airtel Money', note: 'Airtel Rwanda mobile money' },
  { id: 'MTN Pay', name: 'Pay with MTN MoMo (auto)', note: 'Online request-to-pay prompt' }
];
const planMonthlyPrice = computed(() => subscriptionStatus.value.pricePerMonth || 4000);
const planYearlyPrice = computed(() => Math.round(planMonthlyPrice.value * 10));
const subscriptionStatus = ref({
  tier: 'free',
  trialEndsAt: null,
  trialDaysLeft: 0,
  subscriptionExpiry: null,
  paymentMethod: { provider: '', number: '', name: '' },
  pricePerMonth: 4000,
  currency: 'RWF',
  operator: 'MTN',
  payee: { name: 'Ka_samuel@250 Filmz', msisdn: '0782175566' },
  momoConfigured: false
});
const searchTimeout = ref(null);
const genreOptions = ref([
  { id: '', name: 'All Genres', icon: 'grid' },
  { id: 28, name: 'Action', icon: 'zap' },
  { id: 35, name: 'Comedy', icon: 'smile' },
  { id: 18, name: 'Drama', icon: 'film' },
  { id: 27, name: 'Horror', icon: 'moon' },
  { id: 878, name: 'Sci-Fi', icon: 'cpu' },
  { id: 10749, name: 'Romance', icon: 'heart' },
  { id: 14, name: 'Fantasy', icon: 'feather' }
]);
const genreDropdownOpen = ref(false);
const selectedGenreName = computed(() => {
  const g = genreOptions.value.find(x => x.id === advancedFilters.value.genre);
  return g ? g.name : 'All Genres';
});
const selectedGenreIcon = computed(() => {
  const g = genreOptions.value.find(x => x.id === advancedFilters.value.genre);
  return g ? g.icon : 'grid';
});
const toggleGenreDropdown = () => { genreDropdownOpen.value = !genreDropdownOpen.value; };
const selectGenre = (genre) => {
  advancedFilters.value.genre = genre.id;
  genreDropdownOpen.value = false;
};
const closeGenreDropdown = (event) => {
  if (event && event.target && event.target.closest('.genre-dropdown')) return;
  genreDropdownOpen.value = false;
};
const genreNebulaHue = {
  Action: '6deg',
  Comedy: '50deg',
  Drama: '210deg',
  Horror: '330deg',
  'Sci-Fi': '190deg',
  Romance: '330deg',
  Fantasy: '280deg'
};
const movieGenres = {
  28: 'Action',
  35: 'Comedy',
  18: 'Drama',
  27: 'Horror',
  878: 'Sci-Fi',
  10749: 'Romance',
  14: 'Fantasy'
};
const advancedFilters = ref({ genre: '', year: '', rating: '', sortBy: 'popularity.desc' });
const newListName = ref('');

// Theme catalog — admin can pick any of these as the site-wide theme for all users.
const SITE_THEMES = [
  { id: 'default',  name: 'Galaxy Blue',     primary: '#00ccff', accent: '#ff0044', accent2: '#00ff88' },
  { id: 'dark',     name: 'Deep Space',      primary: '#4a90e2', accent: '#e74c3c', accent2: '#2ecc71' },
  { id: 'neon',     name: 'Neon Cyber',      primary: '#00ff88', accent: '#ff0080', accent2: '#00ccff' },
  { id: 'retro',    name: 'Retro Sci-Fi',    primary: '#ff6b35', accent: '#f7931e', accent2: '#ffd166' },
  { id: 'sunset',   name: 'Sunset Drive',    primary: '#ff9a3c', accent: '#ff5770', accent2: '#ffd76f' },
  { id: 'emerald',  name: 'Emerald Forest',  primary: '#34d399', accent: '#16a34a', accent2: '#a7f3d0' },
  { id: 'royal',    name: 'Royal Purple',    primary: '#a78bfa', accent: '#7c3aed', accent2: '#f0abfc' },
  { id: 'crimson',  name: 'Crimson Eclipse', primary: '#ff4757', accent: '#cc0000', accent2: '#ffb8b8' },
  { id: 'aurora',   name: 'Aurora Borealis', primary: '#22d3ee', accent: '#a78bfa', accent2: '#67e8f9' },
  { id: 'gold',     name: 'Golden Hour',     primary: '#fbbf24', accent: '#f59e0b', accent2: '#fde68a' },
  { id: 'cyber',    name: 'Cyber Yellow',    primary: '#facc15', accent: '#f97316', accent2: '#22d3ee' },
  { id: 'sakura',   name: 'Sakura Blossom',  primary: '#ff9ecb', accent: '#ff5d8f', accent2: '#ffd1e8' }
];
const adminThemesPreview = ref(localStorage.getItem('admin_theme_preview') || '');
const siteTheme = ref('default');
const userThemeChoice = ref(localStorage.getItem('user_theme') || '');

const currentTheme = ref(localStorage.getItem('theme') || 'default');
const darkMode = ref(localStorage.getItem('dark_mode') === 'true');
const reduceMotion = ref(localStorage.getItem('reduce_motion') === 'true');
const isSettingsOpen = ref(false);
const menuOpen = ref(false);
const lang = ref(localStorage.getItem('language') || 'en');

const translations = {
  en: {
    theater: 'Theater', youtmus: 'YOUTMUS', profile: 'Profile', lists: 'Lists',
    admin: 'Admin', premium: 'Premium', login: 'Login', register: 'Register',
    logout: 'Logout', connect: 'Connect', settings: 'Settings', menu: 'Menu',
    darkMode: 'Dark Mode', language: 'Language', reduceMotion: 'Reduce Motion',
    appearance: 'Appearance & Settings', done: 'Done',
    home: 'Home', backHome: 'Back to home',
    watchFullMovie: 'WATCH FULL MOVIE', trailer: 'TRAILER',
    allMovies: 'All Movies', tvSeries: 'TV Series',
    searchPlaceholder: 'Search movies, series, songs…',
    trending: 'Trending',
    explore: 'Explore Now', browse: 'Browse by genre',
    favorites: 'My Favorites', watchlists: 'My Watchlists',
    notifs: 'Alerts', markAllRead: 'Mark all read', clearNotifs: 'Clear all',
    noNotifs: 'No alerts yet. We’ll ping you whenever a new movie hits the theater.',
    loginToNotifs: 'Log in to get notified when new movies arrive.',
    languageModal: 'Choose your language'
  },
  fr: {
    theater: 'Théâtre', youtmus: 'YOUTMUS', profile: 'Profil', lists: 'Listes',
    admin: 'Admin', premium: 'Premium', login: 'Connexion', register: 'Inscription',
    logout: 'Déconnexion', connect: 'Contact', settings: 'Paramètres', menu: 'Menu',
    darkMode: 'Mode Sombre', language: 'Langue', reduceMotion: 'Réduire les animations',
    appearance: 'Apparence & Paramètres', done: 'Terminé',
    home: 'Accueil', backHome: "Retour à l'accueil",
    watchFullMovie: 'VOIR LE FILM', trailer: 'BANDE-ANNONCE',
    allMovies: 'Tous les films', tvSeries: 'Séries TV',
    searchPlaceholder: 'Rechercher films, séries, musiques…',
    trending: 'Tendances',
    explore: 'Explorer', browse: 'Parcourir par genre',
    favorites: 'Mes Favoris', watchlists: 'Mes Listes',
    notifs: 'Alertes', markAllRead: 'Tout marquer lu', clearNotifs: 'Tout effacer',
    noNotifs: 'Aucune alerte pour le moment. On vous préviendra dès qu’un nouveau film arrive.',
    loginToNotifs: 'Connectez-vous pour être notifié des nouveautés.',
    languageModal: 'Choisissez votre langue'
  }
};

const t = (key) => translations[lang.value]?.[key] ?? translations.en[key] ?? key;

const changeLanguage = (code) => {
  lang.value = code;
  localStorage.setItem('language', code);
  document.documentElement.lang = code;
  showToast(code === 'fr' ? 'Langue changée en français' : 'Language switched to English');
  menuOpen.value = false;
};

// AI Chat refs
const isChatOpen = ref(false);
const chatMessages = ref([]);
const chatInput = ref('');
const isChatLoading = ref(false);
const contactOrbitPosition = ref({ x: 50, y: 50 });
const contactOrbitStyle = computed(() => ({
  '--contact-x': `${contactOrbitPosition.value.x}%`,
  '--contact-y': `${contactOrbitPosition.value.y}%`
}));
const showWatchlistModal = ref(false);
const selectedMovieForList = ref(null);
const showNewListInput = ref(false);

// Modern additions
const browseRows = ref([]);
const toasts = ref([]);
let toastId = 0;
const showBackToTop = ref(false);
const scrollProgress = ref(0);

let observer = null;

const logoTransform = computed(() => ({ transform: `translate(${logoX.value}px, ${logoY.value}px) scale(${logoScale.value})` }));

const initInfiniteScroll = async () => {
  if (observer) observer.disconnect();
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !loading.value && currentPageName.value === 'home') {
      loadData();
    }
  }, { rootMargin: '300px' });

  await nextTick();
  if (scrollTrigger.value) {
    observer.observe(scrollTrigger.value);
  }
};

// Browse collections (modern Netflix-style rows)
const loadBrowseRows = async () => {
  const rows = [
    { title: 'Now Playing', market: 'In theaters now', icon: 'film', path: '/movie/now_playing' },
    { title: 'Top Rated', market: 'Critically acclaimed', icon: 'star', path: '/movie/top_rated' },
    { title: 'Upcoming Releases', market: 'Coming soon', icon: 'calendar', path: '/movie/upcoming' },
    { title: 'Popular Series', market: 'Binge worthy', icon: 'tv', path: '/tv/popular' }
  ];
  const settled = await Promise.all(rows.map(async (row) => {
    try {
      const res = await tmdbClient.get(row.path, { params: { api_key: TMDB_API_KEY, page: 1 } });
      return { ...row, items: (res.data.results || []).slice(0, 14) };
    } catch (e) {
      console.error('Browse row error:', e);
      return { ...row, items: [] };
    }
  }));
  browseRows.value = settled;
  const rowIds = settled.flatMap(r => (r.items || []).map(m => m.id));
  loadLikes(rowIds);
};

// Toast notifications
const showToast = (message, type = 'success') => {
  const id = ++toastId;
  toasts.value.push({ id, message, type });
  setTimeout(() => dismissToast(id), 3600);
};

const dismissToast = (id) => {
  toasts.value = toasts.value.filter(t => t.id !== id);
};

const toastIcon = (type) => {
  if (type === 'danger') return 'alert';
  if (type === 'info') return 'info';
  return 'check';
};

// Back to top
const handleScroll = () => {
  showBackToTop.value = window.scrollY > 600;
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  scrollProgress.value = max > 0 ? Math.min(100, Math.round((doc.scrollTop / max) * 100)) : 0;
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

watch(currentPageName, async (newPage) => {
  if (newPage === 'home') {
    await initInfiniteScroll();
    resumeHero();
  } else {
    pauseHero();
    if (observer) observer.disconnect();
  }
});

// Enhanced star styles with CSS custom properties
const starStyles = computed(() => Array.from({ length: 200 }, (_, n) => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  opacity: Math.random() * 0.8 + 0.2,
  '--twinkle-duration': `${Math.random() * 3 + 1.5}s`,  // 1.5-4.5s
  '--twinkle-delay': `${Math.random() * 4}s`,
  animation: `twinkle var(--twinkle-duration) ease-in-out var(--twinkle-delay) infinite`
})));

const cometStyles = computed(() => Array.from({ length: 8 }, () => ({
  top: `${Math.random() * 30}%`,
  left: '-20%',
  animationDelay: `${Math.random() * 20}s`,
  animationDuration: `${Math.random() * 5 + 7}s`
})));

const nebulaHue = computed(() => genreNebulaHue[hoveredGenre.value] || `${Math.random() * 360}deg`);
const nebulaStyles = computed(() => Array.from({ length: 25 }, () => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  width: `${Math.random() * 80 + 30}px`,
  height: `${Math.random() * 80 + 30}px`,
  animationDuration: `${Math.random() * 30 + 20}s`,
  animationDelay: `${Math.random() * 15}s`,
  '--hue': hoveredGenre.value ? nebulaHue.value : `${Math.random() * 360}deg`
})));

const planetStyles = computed(() => Array.from({ length: 4 }, () => ({
  '--orbit-radius': `${Math.random() * 200 + 150}px`,
  '--orbit-speed': `${Math.random() * 40 + 20}s`,
  '--orbit-delay': `${Math.random() * 10}s`,
  '--size': `${Math.random() * 40 + 20}px`
})));

const satelliteStyles = computed(() => Array.from({ length: 6 }, () => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 20 + 5}%`,
  animationDuration: `${Math.random() * 60 + 40}s`,
  animationDelay: `${Math.random() * 30}s`
})));

// Splash stars for login overlay
const splashStars = computed(() => Array.from({ length: 150 }, (_, n) => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  opacity: Math.random() * 0.8 + 0.2,
  '--twinkle-duration': `${Math.random() * 3 + 1.5}s`,
  '--twinkle-delay': `${Math.random() * 4}s`,
  animation: `twinkle var(--twinkle-duration) ease-in-out var(--twinkle-delay) infinite`
})));

const tmdbClient = axios.create({ baseURL: TMDB_BASE_URL });
const apiClient = axios.create({ 
  baseURL: API_BASE, 
  withCredentials: true 
});

// Add request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const moveLogo = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = (e.clientX - rect.left - rect.width / 2) / 16;
  const y = (e.clientY - rect.top - rect.height / 2) / 16;
  logoX.value = x;
  logoY.value = y;
  logoScale.value = 1.04;
};

const resetLogo = () => {
  logoX.value = 0;
  logoY.value = 0;
  logoScale.value = 1;
};

const loadData = async (reset = false) => {
  if (loading.value) return;
  loading.value = true;
  if (reset) {
    movies.value = [];
    page.value = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const endpoint = searchQuery.value ? `/search/${mode.value}` : `/trending/${mode.value}/week`;
  try {
    const res = await tmdbClient.get(endpoint, {
      params: { api_key: TMDB_API_KEY, query: searchQuery.value, page: page.value, include_adult: false }
    });
    const newItems = res.data.results.filter(newItem => !movies.value.some(existingItem => existingItem.id === newItem.id));
    movies.value = [...movies.value, ...newItems];
    loadLikes(newItems.map(m => m.id));
    page.value++;
  } catch (err) {
    console.error('API Error:', err);
  } finally {
    loading.value = false;
  }
};

const loadHeroMovies = async () => {
  try {
    const res = await tmdbClient.get('/trending/movie/week', { params: { api_key: TMDB_API_KEY, page: 1 } });
    heroMovies.value = res.data.results || [];
  } catch (e) {
    console.error(e);
  }
};

const toggleMode = (newMode) => {
  mode.value = newMode;
  loadData(true);
};

const handleSearch = async (reset = false) => {
  if (!searchQuery.value.trim()) {
    return resetHome();
  }
  if (reset) {
    await loadData(true);
  } else {
    await loadData(true);
  }
};

const debouncedSearch = () => {
  clearTimeout(searchTimeout.value);
  searchTimeout.value = window.setTimeout(() => {
    if (searchQuery.value.trim()) {
      handleSearch(true);
    } else {
      resetHome();
    }
  }, 300);
};

const setHoverGenre = (genreIds = []) => {
  if (!Array.isArray(genreIds) || genreIds.length === 0) {
    hoveredGenre.value = '';
    return;
  }
  const foundGenre = genreIds.map(id => movieGenres[id]).find(Boolean);
  hoveredGenre.value = foundGenre || '';
};

// Advanced search with filters
const handleAdvancedSearch = async () => {
  loading.value = true;
  movies.value = [];
  page.value = 1;
  try {
    const endpoint = `/search/${mode.value}`;
    const res = await apiClient.get(endpoint, {
      params: {
        query: searchQuery.value,
        genre: advancedFilters.value.genre,
        year: advancedFilters.value.year,
        rating: advancedFilters.value.rating,
        sort_by: advancedFilters.value.sortBy,
        page: page.value
      }
    });
    movies.value = res.data.results.filter(newItem => !movies.value.some(existingItem => existingItem.id === newItem.id));
    page.value++;
  } catch (err) {
    console.error('Advanced search error:', err);
  } finally {
    loading.value = false;
  }
};

const resetHome = () => {
  searchQuery.value = '';
  trailerUrl.value = null;
  fullMovieUrl.value = null;
  currentMovieId.value = null;
  currentMovieDownloadUrl.value = null;
  mode.value = 'movie';
  currentPageName.value = 'home';
  trackVisit('/home');
  loadData(true);
};

const setPage = (p) => {
  currentPageName.value = p;
  trailerUrl.value = null;
  fullMovieUrl.value = null;
  currentMovieId.value = null;
  currentMovieDownloadUrl.value = null;
  if (p === 'youtmus') trackVisit('/youtmus');
  else trackVisit('/' + p);
  // Distinct admin command-center mode
  document.documentElement.setAttribute('data-admin', p === 'admin' && isAdmin.value ? 'on' : 'off');
  if (p === 'admin' && isAdmin.value) {
    loadAdminDashboard();
  }
};

const goPremium = () => {
  if (!isAuthenticated.value) {
    showToast('Login to choose a subscription plan.', 'warning');
    setPage('login');
    return;
  }
  setPage('premium');
  loadSubscriptionStatus();
};

const pickPlan = (plan) => {
  selectedPlan.value = plan;
  premiumSteps.value = 0;
  subMessage.value = '';
  window.scrollTo({ top: window.innerHeight * 0.4, behavior: 'smooth' });
};

const openDetails = (item) => {
  currentMovieTitle.value = item.title || item.name || 'Untitled';
};

const playFullMovie = async (item) => {
  const type = mode.value === 'movie' ? 'movie' : 'tv';
  currentMovieTitle.value = item.title || item.name || 'Now Playing';
  currentMovieId.value = item.id;
  currentMovieDownloadUrl.value = `https://vidsrc.to/${type}/${item.id}`;

  // Play the full movie right inside the app
  activeProviderIndex.value = 0;
  fullMovieUrl.value = currentEmbedUrl.value;
  trailerUrl.value = null;
  await nextTick();
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (isAuthenticated.value) {
    try {
      await apiClient.post('/watch-history', { movieId: item.id, movieTitle: item.title || item.name });
    } catch (error) {
      console.error('Watch history error:', error);
    }
  }
  await loadComments(item.id);
};

const switchProvider = (index) => {
  if (!currentMovieId.value) return;
  activeProviderIndex.value = index;
  fullMovieUrl.value = currentEmbedUrl.value;
  showToast(`Switched to ${playerProviders[index].name} server.`, 'info');
};

const openCurrentMovieInTab = () => {
  if (!currentMovieDownloadUrl.value) {
    const type = mode.value === 'movie' ? 'movie' : 'tv';
    currentMovieDownloadUrl.value = `https://vidsrc.to/${type}/${currentMovieId.value}`;
  }
  window.open(currentMovieDownloadUrl.value, '_blank', 'noopener,noreferrer');
};

const downloadMovie = async () => {
  if (!currentMovieId.value) return;
  const type = mode.value === 'movie' ? 'movie' : 'tv';
  try {
    const res = await apiClient.get(`/download/${type}/${currentMovieId.value}`);
    const downloadUrl = res.data.url;
    if (downloadUrl) {
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } else {
      showToast('Download link not available.', 'warning');
    }
  } catch (error) {
    console.error('Download error:', error);
    showToast('Could not retrieve the download link.', 'danger');
  }
};

const downloadMovieFile = async (item) => {
  try {
    showToast(`Preparing download options for "${item.title || item.name}"...`, 'info');
    
    // Try to download trailer if available
    const trailerDownloaded = await downloadTrailer(item);
    
    // Download poster
    if (item.poster_path) {
      const posterUrl = `https://image.tmdb.org/t/p/original${item.poster_path}`;
      const link = document.createElement('a');
      link.href = posterUrl;
      link.download = `${item.title || item.name}_poster.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    // Open streaming options
    const type = mode.value === 'movie' ? 'movie' : 'tv';
    const streamUrl = `https://vidsrc.to/${type}/${item.id}`;
    window.open(streamUrl, '_blank', 'noopener,noreferrer');
    
    const trailerMsg = trailerDownloaded ? 'Trailer downloaded! ' : '';
    showToast(`${trailerMsg}Poster downloaded! Movie opened in a new tab for streaming.`, 'success');
  } catch (error) {
    console.error('Download error:', error);
    const type = mode.value === 'movie' ? 'movie' : 'tv';
    const fallbackUrl = `https://vidsrc.to/${type}/${item.id}`;
    window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    showToast('Opening movie in a new tab. Use browser download tools for video.', 'info');
  }
};

const downloadTrailer = async (item) => {
  try {
    const res = await tmdbClient.get(`/${mode.value}/${item.id}/videos`, { params: { api_key: TMDB_API_KEY } });
    const trailer = res.data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    
    if (trailer) {
      const trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
      window.open(trailerUrl, '_blank', 'noopener,noreferrer');
      showToast('Trailer opened in a new tab to save with browser tools.', 'info');
      return true;
    } else {
      showToast('No trailer available for download.', 'warning');
      return false;
    }
  } catch (error) {
    console.error('Trailer download error:', error);
    showToast('Could not load trailer.', 'danger');
    return false;
  }
};

const downloadPoster = async (item) => {
  if (item.poster_path) {
    const posterUrl = `https://image.tmdb.org/t/p/original${item.poster_path}`;
    const link = document.createElement('a');
    link.href = posterUrl;
    link.download = `${item.title || item.name}_poster.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Poster downloaded successfully!');
  } else {
    showToast('No poster available for download.', 'warning');
  }
};

const cacheForOffline = async (item) => {
  try {
    if ('caches' in window) {
      const cache = await caches.open('movie-cache-v1');
      const posterUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null;
      
      if (posterUrl) {
        await cache.add(posterUrl);
        showToast('Poster cached for offline viewing!');
      } else {
        showToast('No poster available to cache.', 'warning');
      }
    } else {
      showToast('Offline caching not supported in this browser.', 'warning');
    }
  } catch (error) {
    console.error('Cache error:', error);
    showToast('Could not cache for offline viewing.', 'danger');
  }
};

const playTrailer = async (item) => {
  try {
    const res = await tmdbClient.get(`/${mode.value}/${item.id}/videos`, { params: { api_key: TMDB_API_KEY } });
    const supported = ['YouTube', 'Vimeo', 'Dailymotion'];
    let trailer = res.data.results.find(v => v.type === 'Trailer' && supported.includes(v.site));
    if (!trailer) {
      trailer = res.data.results.find(v => supported.includes(v.site));
    }
    let url = getTrailerEmbedUrl(trailer);
    if (!url) {
      const type = mode.value === 'movie' ? 'movie' : 'tv';
      url = `https://vidsrc.to/embed/${type}/${item.id}`;
    }
    currentMovieTitle.value = item.title || item.name || 'Trailer';
    currentMovieId.value = item.id;
    currentMovieDownloadUrl.value = null;
    fullMovieUrl.value = null;
    trailerUrl.value = url;
    await loadComments(item.id);
  } catch (err) {
    console.error('Trailer error', err);
    showToast('Could not load trailer.', 'danger');
  }
};

const closePlayer = () => {
  trailerUrl.value = null;
  fullMovieUrl.value = null;
  currentMovieId.value = null;
  currentMovieDownloadUrl.value = null;
  comments.value = [];
};

const loadComments = async (movieId = null) => {
  const id = movieId || currentMovieId.value;
  if (!id) return;
  try {
    const res = await apiClient.get(`/comments/${id}`);
    comments.value = res.data || [];
  } catch (error) {
    comments.value = [];
  }
};

const submitComment = async () => {
  commentLoading.value = true;
  commentError.value = '';
  commentSuccess.value = false;
  try {
    const payload = {
      movieId: currentMovieId.value || currentMovieTitle.value,
      userName: commentName.value,
      text: commentText.value
    };
    const res = await apiClient.post('/comments', payload);
    comments.value = [...comments.value, res.data];
    commentName.value = '';
    commentText.value = '';
    commentSuccess.value = true;
    await loadComments(currentMovieId.value);
  } catch (error) {
    commentError.value = error.response?.data?.message || 'Failed to send comment';
  } finally {
    commentLoading.value = false;
  }
};

const handleLogin = async () => {
  loginLoading.value = true;
  loginError.value = '';
  try {
    const response = await apiClient.post('/auth/login', { email: loginEmail.value, password: loginPassword.value });
    user.value = response.data.user;
    isAuthenticated.value = true;
    
    // Store the token
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }

    await loadProfile();
    await loadRecommendations();
    await loadSubscriptionStatus();
    await loadNotifications();
    loadMySupport();
    
    resetHome();
    showToast('Welcome back to the galaxy!');
  } catch (error) {
    loginError.value = error.response?.data?.error || error.response?.data?.message || 'Login failed. Try demo@filmz.com / demo123 or kasamuel71@gmail.com / tetaornella@250';
  } finally {
    loginLoading.value = false;
  }
};

const handleRegister = async () => {
  registerLoading.value = true;
  registerError.value = '';
  if (registerPassword.value !== registerConfirmPassword.value) {
    registerError.value = 'Passwords do not match';
    registerLoading.value = false;
    return;
  }
  try {
    const response = await apiClient.post('/auth/register', {
      email: registerEmail.value,
      password: registerPassword.value,
      username: registerUsername.value,
      phone: registerPhone.value,
      location: registerLocation.value,
      name: registerName.value
    });
    user.value = response.data.user;
    isAuthenticated.value = true;
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    profile.value = { ...profile.value, ...(response.data.user || {}) };
    showToast('Account created! Welcome to the galaxy!');
    await loadProfile();
    await loadSubscriptionStatus();
    loadMySupport();
    resetHome();
  } catch (error) {
    registerError.value = error.response?.data?.error || error.response?.data?.message || 'Registration failed';
  } finally {
    registerLoading.value = false;
  }
};

const handleForgotPassword = async () => {
  forgotLoading.value = true;
  resetSent.value = false;
  resetLink.value = '';
  resetError.value = '';
  try {
    const res = await apiClient.post('/auth/forgot-password', { email: forgotEmail.value });
    resetSent.value = true;
    if (res.data.devResetLink) {
      resetLink.value = res.data.devResetLink;
      const params = new URLSearchParams(res.data.devResetLink.split('?')[1] || '');
      resetToken.value = params.get('token') || '';
      resetEmail.value = params.get('email') || forgotEmail.value;
    }
  } catch (error) {
    resetError.value = error.response?.data?.error || 'Failed to send reset email';
  } finally {
    forgotLoading.value = false;
  }
};

const handleResetPassword = async () => {
  resetError.value = '';
  resetComplete.value = false;
  if (resetNewPassword.value.length < 4) {
    resetError.value = 'Password must be at least 4 characters';
    return;
  }
  if (resetNewPassword.value !== resetConfirmPassword.value) {
    resetError.value = 'Passwords do not match';
    return;
  }
  resetLoading.value = true;
  try {
    await apiClient.post('/auth/reset-password', {
      token: resetToken.value,
      email: resetEmail.value,
      newPassword: resetNewPassword.value
    });
    resetComplete.value = true;
    resetNewPassword.value = '';
    resetConfirmPassword.value = '';
  } catch (error) {
    resetError.value = error.response?.data?.error || 'Password reset failed. The link may have expired.';
  } finally {
    resetLoading.value = false;
  }
};

const handleLogout = async () => {
  try {
    await apiClient.post('/auth/logout');
    user.value = null;
    isAuthenticated.value = false;
    
    // Clear the token
    localStorage.removeItem('auth_token');
    
    resetHome();
    showToast('See you in the stars!');
  } catch (error) {
    console.error('Logout error:', error);
    resetHome();
  }
};

const copyEmail = () => { navigator.clipboard.writeText('kasamuel71@gmail.com'); showToast('Email copied!', 'info'); };
const copyPhone = () => { navigator.clipboard.writeText('0723112258'); showToast('Phone copied!', 'info'); };
const openWhatsApp = () => { window.open('https://wa.me/250787949343', '_blank', 'noopener,noreferrer'); };
const openInstagram = () => { window.open('https://instagram.com/ka__samuel250', '_blank', 'noopener,noreferrer'); };

const checkAuth = async () => {
  const token = localStorage.getItem('auth_token');
  if (!token) return;
  try {
    const response = await apiClient.get('/auth/me');
    user.value = response.data.user;
    isAuthenticated.value = true;
    await loadProfile();
    await loadRecommendations();
    await loadSubscriptionStatus();
    await loadNotifications();
    loadMySupport();
  } catch (error) {
    console.warn('Auth restore failed:', error);
    localStorage.removeItem('auth_token');
    isAuthenticated.value = false;
    user.value = null;
  }
};

const checkResetTokenInUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const email = params.get('email');
  if (token && email) {
    resetToken.value = token;
    resetEmail.value = email;
    currentPageName.value = 'reset-password';
  }
};

const closeMenuOnOutside = (e) => {
  if (menuOpen.value && e.target && !e.target.closest('.dots-menu-wrap')) {
    menuOpen.value = false;
  }
};

onMounted(async () => {
  await checkAuth();
  changeTheme();
  document.documentElement.setAttribute('data-motion', reduceMotion.value ? 'off' : 'on');
  document.documentElement.lang = lang.value;
  checkResetTokenInUrl();
  loadSiteSettings();
  trackVisit('/app');
  window.addEventListener('scroll', handleScroll, { passive: true });
  document.addEventListener('click', closeGenreDropdown);
  document.addEventListener('click', closeMenuOnOutside);
  if (currentPageName.value === 'home') {
    await loadHeroMovies();
    startHeroRotation();
    await loadData();
    await loadComments();
    await loadBrowseRows();
    await initInfiniteScroll();
  }
});

onUnmounted(() => {
  pauseHero();
  if (observer) observer.disconnect();
  window.removeEventListener('scroll', handleScroll);
  document.removeEventListener('click', closeGenreDropdown);
  document.removeEventListener('click', closeMenuOnOutside);
});

// New methods for additional features
const loadProfile = async () => {
  try {
    const res = await apiClient.get('/profile');
    profile.value = res.data.profile;
    watchHistory.value = res.data.watchHistory;
    watchlists.value = res.data.watchlists;
    favorites.value = res.data.favorites;
    if (profile.value.paymentMethod?.number) momoNumber.value = profile.value.paymentMethod.number;
    if (profile.value.paymentMethod?.name) momoName.value = profile.value.paymentMethod.name;
  } catch (error) {
    console.error('Profile load error:', error);
  }
};

const updateProfile = async () => {
  try {
    const res = await apiClient.put('/profile', profile.value);
    profile.value = { ...profile.value, ...res.data.profile };
    user.value = { ...user.value, ...res.data.profile };
    showToast('Profile updated!');
  } catch (error) {
    showToast('Failed to update profile', 'danger');
  }
};

const loadRecommendations = async () => {
  try {
    const res = await apiClient.get('/recommendations');
    recommendations.value = res.data.recommendations;
  } catch (error) {
    console.error('Recommendations error:', error);
  }
};

// === LIKES ===
const loadLikes = async (ids) => {
  const clean = [...new Set((ids || []).filter(Boolean).map(String))];
  if (!clean.length) return;
  try {
    const res = await apiClient.post('/movies/likes', { ids: clean });
    likesMap.value = { ...likesMap.value, ...(res.data.counts || {}) };
    likedMap.value = { ...likedMap.value, ...(res.data.liked || {}) };
  } catch (e) { /* silent */ }
};

const toggleLike = async (movie) => {
  const id = movie?.id ?? movie?.movieId;
  if (!id) return;
  if (!isAuthenticated.value) {
    showToast('Login to like movies.', 'warning');
    setPage('login');
    return;
  }
  const currentlyLiked = !!likedMap.value[id];
  try {
    if (currentlyLiked) {
      await apiClient.delete(`/favorites/${id}`);
      likedMap.value[id] = false;
      likesMap.value[id] = Math.max(0, (likesMap.value[id] || 1) - 1);
      favorites.value = favorites.value.filter(f => String(f.movieId) !== String(id));
      showToast('Removed like.');
    } else {
      await apiClient.post('/favorites', {
        movieId: id,
        movieTitle: movie.title || movie.name,
        posterPath: movie.poster_path
      });
      likedMap.value[id] = true;
      likesMap.value[id] = (likesMap.value[id] || 0) + 1;
      if (currentPageName.value === 'profile') await loadProfile();
      showToast('Liked!');
    }
  } catch (error) {
    showToast('Could not update like', 'danger');
  }
};

const onAvatarChange = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { showToast('Please choose an image file', 'danger'); return; }
  if (file.size > 2.5 * 1024 * 1024) { showToast('Image too large (max 2.5MB)', 'danger'); return; }
  const reader = new FileReader();
  reader.onload = () => { profile.value.avatar = reader.result; };
  reader.readAsDataURL(file);
};

const detectLocation = () => {
  if (!navigator.geolocation) { showToast('Geolocation not supported', 'danger'); return; }
  locDetecting.value = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      profile.value.location = `Lat ${latitude.toFixed(3)}, Lng ${longitude.toFixed(3)}`;
      locDetecting.value = false;
      showToast('Location detected!');
    },
    () => {
      locDetecting.value = false;
      showToast('Could not detect location. Type it manually.', 'warning');
    },
    { timeout: 10000 }
  );
};

// === NOTIFICATIONS ===
const toggleNotifs = async () => {
  notifsOpen.value = !notifsOpen.value;
  if (notifsOpen.value && isAuthenticated.value) {
    try { await apiClient.post('/notifications/check'); } catch (e) { /* ignore */ }
    await loadNotifications();
  }
};

const loadNotifications = async () => {
  try {
    const res = await apiClient.get('/notifications');
    notifications.value = res.data.notifications || [];
  } catch (e) { /* ignore */ }
};

const markNotifRead = async (n) => {
  if (!n.read) {
    n.read = true;
    try { await apiClient.post(`/notifications/${n.id}/read`); } catch (e) { /* ignore */ }
  }
};

const markAllNotifsRead = async () => {
  notifications.value.forEach(n => { n.read = true; });
  try { await apiClient.post('/notifications/read-all'); } catch (e) { /* ignore */ }
};

const handleNotifClick = async (n) => {
  await markNotifRead(n);
  if (n.movieId) {
    openMovieDetails({ id: n.movieId });
    notifsOpen.value = false;
  }
};

const formatNotifTime = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return ''; }
};

const formatDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) { return ''; }
};

// === SUBSCRIPTION / MOBILE MONEY ===
const loadSubscriptionStatus = async () => {
  try {
    const res = await apiClient.get('/subscription/status');
    subscriptionStatus.value = { ...subscriptionStatus.value, ...res.data };
    if (res.data.paymentMethod?.number) momoNumber.value = res.data.paymentMethod.number;
    if (res.data.paymentMethod?.name) momoName.value = res.data.paymentMethod.name;
  } catch (e) { /* ignore */ }
};

const savePaymentMethod = async () => {
  if (!momoNumber.value.trim()) { showToast('Enter your Mobile Money number', 'warning'); return; }
  try {
    await apiClient.put('/profile/payment-method', {
      provider: 'MTN', number: momoNumber.value.trim(), name: momoName.value.trim()
    });
    subMessage.value = 'Payment method saved. You are ready to subscribe.';
    subOk.value = true;
    showToast('Payment method saved!');
    await loadSubscriptionStatus();
  } catch (e) {
    subMessage.value = 'Failed to save payment method.';
    subOk.value = false;
    showToast('Failed to save payment method', 'danger');
  }
};

const pollActivation = async (referenceId, tries = 0, months = 1) => {
  if (tries > 15) return;
  await new Promise(r => setTimeout(r, 6000));
  try {
    const res = await apiClient.get(`/subscription/verify/${referenceId}`, { params: { months } });
    if (res.data.activated) {
      subMessage.value = res.data.message || 'Premium activated! Enjoy unlimited movies.';
      subOk.value = true;
      premiumSteps.value = 3;
      await loadSubscriptionStatus();
      showToast('Premium activated!', 'success');
      return;
    }
    pollActivation(referenceId, tries + 1, months);
  } catch (e) {
    pollActivation(referenceId, tries + 1, months);
  }
};

const checkout = async (plan = selectedPlan.value) => {
  if (!momoNumber.value.trim()) { showToast('Enter your Mobile Money number first', 'warning'); return; }
  subLoading.value = true;
  subMessage.value = '';
  premiumSteps.value = 1;
  try {
    const res = await apiClient.post('/subscription/checkout', {
      number: momoNumber.value.trim(), provider: momoProvider.value, plan
    });
    subMessage.value = res.data.message || 'Payment request sent.';
    subOk.value = res.data.status === 'pending' || res.data.status === 'config_pending';
    if (res.data.referenceId) {
      premiumSteps.value = 2;
      pollActivation(res.data.referenceId, 0, res.data.months || 1);
    } else {
      premiumSteps.value = res.data.status === 'config_pending' ? 3 : 1;
      showToast(subMessage.value, res.data.status === 'config_pending' ? 'info' : 'success');
    }
    await loadSubscriptionStatus();
  } catch (e) {
    subMessage.value = e.response?.data?.error || 'Payment failed. Try again.';
    subOk.value = false;
    premiumSteps.value = 0;
    showToast(subMessage.value, 'danger');
  } finally {
    subLoading.value = false;
  }
};

const openMovieDetails = async (movie) => {
  const movieId = movie?.id ?? movie?.movieId;
  selectedMovie.value = movie;
  currentPageName.value = 'movie-details';
  try {
    const res = await apiClient.get(`/movie/${movieId}`);
    movieDetails.value = res.data;
    loadLikes([movieId]);
    const similarRes = await apiClient.get(`/movie/${movieId}/similar`);
    similarMovies.value = similarRes.data.results;
    const reviewsRes = await apiClient.get(`/movie/${movieId}/reviews`);
    movieReviews.value = reviewsRes.data.results;
    loadLikes(similarMovies.value.map(m => m.id));
  } catch (error) {
    console.error('Movie details error:', error);
  }
};

const addToFavorites = async (movie) => {
  if (!isAuthenticated.value) {
    showToast('Login to save favorites.', 'warning');
    setPage('login');
    return;
  }
  try {
    await apiClient.post('/favorites', {
      movieId: movie.id,
      movieTitle: movie.title || movie.name,
      posterPath: movie.poster_path
    });
    showToast('Added to favorites!');
    await loadProfile();
  } catch (error) {
    console.error('Favorite save error:', error);
    showToast('Failed to add to favorites', 'danger');
  }
};

const addToWatchlist = async (movie) => {
  if (!isAuthenticated.value) {
    showToast('Login to save a movie to your watchlist.', 'warning');
    setPage('login');
    return;
  }
  selectedMovieForList.value = movie;
  showWatchlistModal.value = true;
};

const closeWatchlistModal = () => {
  showWatchlistModal.value = false;
  selectedMovieForList.value = null;
  showNewListInput.value = false;
  newListName.value = '';
};

const addToSpecificList = async (list) => {
  try {
    await apiClient.post(`/watchlists/${list.id}/items`, {
      movieId: selectedMovieForList.value.id,
      movieTitle: selectedMovieForList.value.title || selectedMovieForList.value.name,
      posterPath: selectedMovieForList.value.poster_path
    });
    showToast(`Added to ${list.name}`);
    closeWatchlistModal();
    await loadProfile();
  } catch (error) {
    console.error('Add to list error:', error);
    showToast('Could not add to list.', 'danger');
  }
};

const createAndAddToList = async () => {
  if (!newListName.value.trim()) return;
  try {
    const res = await apiClient.post('/watchlists', { name: newListName.value });
    const newList = res.data;
    await addToSpecificList(newList);
  } catch (error) {
    console.error('Create list error:', error);
    showToast('Could not create list.', 'danger');
  }
};

const deleteAdminUser = async (userId) => {
  try {
    if (!confirm('Are you sure you want to permanently remove this user and all their data?')) return;
    await apiClient.delete(`/admin/users/${userId}`);
    adminUsers.value = adminUsers.value.filter(u => u.id !== userId);
    showToast('User removed successfully.');
  } catch (error) {
    console.error('Delete user error:', error);
    showToast('Could not remove user.', 'danger');
  }
};

const isAdminUserRow = (u) => u?.role === 'admin' || u?.username === 'ka__samuel250' || u?.email === 'kasamuel71@gmail.com';

const updateAdminUser = async (u, patch) => {
  try {
    const res = await apiClient.put(`/admin/users/${u.id}`, patch);
    if (res.data.user) {
      const i = adminUsers.value.findIndex(x => x.id === u.id);
      if (i > -1) adminUsers.value[i] = res.data.user;
    }
    if (patch.active !== undefined) showToast(patch.active ? 'User unblocked.' : 'User blocked.');
    if (patch.resetTrial) showToast('Free trial reset to 365 days.');
    if (patch.subscriptionTier === 'premium') showToast('Premium granted for 1 month.');
    if (patch.subscriptionTier === 'free') showToast('Premium revoked.');
    if (patch.lifetimeFree === true) showToast('User now has LIFETIME FREE access.');
    if (patch.lifetimeFree === false) showToast('Lifetime free access removed.');
  } catch (error) {
    console.error('Admin update user error:', error);
    showToast('Could not update user.', 'danger');
  }
};

const toggleUserActive = (u) => updateAdminUser(u, { active: u.active !== false });
const toggleUserPremium = (u) => updateAdminUser(u, {
  subscriptionTier: u.subscriptionTier === 'premium' ? 'free' : 'premium',
  subscriptionExpiry: u.subscriptionTier === 'premium' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
});
const resetUserTrial = (u) => updateAdminUser(u, { resetTrial: true });
const toggleUserAdmin = (u) => updateAdminUser(u, { role: u.role === 'admin' ? 'user' : 'admin' });

const loadSiteSettings = async () => {
  try {
    const res = await apiClient.get('/settings/public');
    siteSettings.value = { ...siteSettings.value, ...res.data, features: res.data.features || siteSettings.value.features };
    if (res.data.siteTheme) siteTheme.value = res.data.siteTheme;
    changeTheme();
  } catch (e) { console.error('Site settings load error:', e); }
};

const loadAdminSettings = async () => {
  try {
    const res = await apiClient.get('/admin/settings');
    const s = res.data.settings || {};
    adminSettings.value = {
      siteName: s.siteName || 'Ka_samuel@250',
      siteTagline: s.siteTagline || '',
      siteDescription: s.siteDescription || '',
      footerAbout: s.footerAbout || '',
      footerText: s.footerText || '',
      email: s.email || '',
      phone: s.phone || '',
      instagram: s.instagram || 'ka__samuel250',
      whatsapp: s.whatsapp || '',
      freeTrialDays: s.freeTrialDays ?? 365,
      subscriptionPrice: s.subscriptionPrice ?? 4000,
      subscriptionCurrency: s.subscriptionCurrency || 'RWF',
      siteTheme: s.siteTheme || 'default',
      availableThemes: s.availableThemes || SITE_THEMES
    };
    adminFeaturesText.value = (s.features || []).join(', ');
  } catch (e) { console.error('Load admin settings error:', e); }
};

const saveAdminSettings = async () => {
  adminSaving.value = true;
  adminSettingsSaved.value = false;
  try {
    const res = await apiClient.put('/admin/settings', {
      ...adminSettings.value,
      features: adminFeaturesText.value.split(',').map(f => f.trim()).filter(Boolean)
    });
    const s = res.data.settings || {};
    adminSettings.value = {
      siteName: s.siteName || adminSettings.value.siteName,
      siteTagline: s.siteTagline || '',
      siteDescription: s.siteDescription || '',
      footerAbout: s.footerAbout || '',
      footerText: s.footerText || '',
      email: s.email || '',
      phone: s.phone || '',
      instagram: s.instagram || '',
      whatsapp: s.whatsapp || '',
      freeTrialDays: s.freeTrialDays,
      subscriptionPrice: s.subscriptionPrice,
      subscriptionCurrency: s.subscriptionCurrency,
      siteTheme: s.siteTheme || adminSettings.value.siteTheme,
      availableThemes: s.availableThemes || adminSettings.value.availableThemes
    };
    adminFeaturesText.value = (s.features || []).join(', ');
    if (s.siteTheme) {
      siteTheme.value = s.siteTheme;
      localStorage.removeItem('user_theme');
      userThemeChoice.value = '';
      currentTheme.value = s.siteTheme;
      changeTheme();
    }
    await loadSiteSettings();
    showToast('Site settings saved! The footer is now updated.');
    adminSettingsSaved.value = true;
    setTimeout(() => { adminSettingsSaved.value = false; }, 2500);
  } catch (error) {
    console.error('Save admin settings error:', error);
    showToast('Could not save settings.', 'danger');
  } finally {
    adminSaving.value = false;
  }
};

const broadcastNotification = async () => {
  if (!broadcastTitle.value.trim() || !broadcastBody.value.trim()) {
    showToast('Enter both a title and a message.', 'warning');
    return;
  }
  broadcasting.value = true;
  try {
    const res = await apiClient.post('/admin/notifications/broadcast', {
      title: broadcastTitle.value.trim(),
      body: broadcastBody.value.trim(),
      type: 'admin'
    });
    showToast(`Alert sent to ${res.data.sent || 0} users!`);
    broadcastTitle.value = '';
    broadcastBody.value = '';
  } catch (error) {
    console.error('Broadcast error:', error);
    showToast('Could not send alert.', 'danger');
  } finally {
    broadcasting.value = false;
  }
};

const deleteAdminComment = async (c) => {
  try {
    await apiClient.delete(`/admin/comments/${c.id}`);
    adminComments.value = adminComments.value.filter(x => x.id !== c.id);
    showToast('Comment removed.');
  } catch (error) {
    console.error('Delete comment error:', error);
    showToast('Could not remove comment.', 'danger');
  }
};

const loadMySupport = async () => {
  if (!isAuthenticated.value) return;
  try {
    const res = await apiClient.get('/support/mine');
    mySupportRequests.value = res.data.requests || [];
  } catch (e) { console.error('My support load error:', e); }
};

const submitSupport = async () => {
  if (!supportSubject.value.trim() || !supportMessage.value.trim()) return;
  supportSending.value = true;
  try {
    await apiClient.post('/support', { subject: supportSubject.value.trim(), message: supportMessage.value.trim() });
    showToast('Request sent to the admin! You will get a reply in your notifications.');
    supportSubject.value = '';
    supportMessage.value = '';
    await loadMySupport();
  } catch (error) {
    console.error('Support submit error:', error);
    showToast(error.response?.data?.error || 'Could not send your request.', 'danger');
  } finally {
    supportSending.value = false;
  }
};

const loadAdminSupport = async () => {
  try {
    const res = await apiClient.get('/admin/support');
    adminSupport.value = res.data.requests || [];
  } catch (e) { console.error('Admin support load error:', e); }
};

const sendSupportReply = async (req) => {
  const text = (supportReplyDrafts.value[req.id] || '').trim();
  if (!text) return;
  try {
    await apiClient.post(`/admin/support/${req.id}/reply`, { reply: text });
    supportReplyDrafts.value[req.id] = '';
    await loadAdminSupport();
    showToast('Reply sent to the user.');
  } catch (error) {
    console.error('Support reply error:', error);
    showToast('Could not send reply.', 'danger');
  }
};

const toggleSupportStatus = async (req) => {
  const next = req.status === 'resolved' ? 'open' : 'resolved';
  try {
    await apiClient.post(`/admin/support/${req.id}/status`, { status: next });
    await loadAdminSupport();
    showToast(`Request marked as ${next}.`);
  } catch (error) {
    console.error('Support status error:', error);
    showToast('Could not update status.', 'danger');
  }
};

const deleteAdminSupport = async (req) => {
  try {
    await apiClient.delete(`/admin/support/${req.id}`);
    adminSupport.value = adminSupport.value.filter(x => x.id !== req.id);
    showToast('Request removed.');
  } catch (error) {
    console.error('Delete support error:', error);
    showToast('Could not remove request.', 'danger');
  }
};

const filteredAdminSupport = computed(() => {
  if (!adminRequestsFilter.value) return adminSupport.value;
  return adminSupport.value.filter(r => r.status === adminRequestsFilter.value);
});

const toggleLifetimeFree = (u) => {
  const nowFree = !!u.lifetimeFree;
  return updateAdminUser(u, { lifetimeFree: !nowFree });
};

const filteredAdminUsers = computed(() => {
  const q = adminUserFilter.value.trim().toLowerCase();
  if (!q) return adminUsers.value;
  return adminUsers.value.filter(u =>
    (u.email || '').toLowerCase().includes(q) ||
    (u.name || '').toLowerCase().includes(q) ||
    (u.username || '').toLowerCase().includes(q) ||
    (u.location || '').toLowerCase().includes(q)
  );
});

const loadAdminDashboard = async () => {
  try {
    const [usersRes, statsRes, commentsRes, analyticsRes] = await Promise.all([
      apiClient.get('/admin/users'),
      apiClient.get('/admin/stats'),
      apiClient.get('/admin/comments'),
      apiClient.get('/admin/analytics')
    ]);
    adminUsers.value = usersRes.data.users || [];
    adminStats.value = statsRes.data || { totalUsers: 0, totalWatchRecords: 0 };
    movieViews.value = statsRes.data.topMovieViews || [];
    adminComments.value = commentsRes.data.comments || [];
    analytics.value = analyticsRes.data || null;
    await loadAdminSettings();
    await loadAdminSupport();
  } catch (error) {
    console.error('Admin dashboard load error:', error);
    showToast('Could not load admin dashboard.', 'danger');
  }
};

const getTrailerEmbedUrl = (video) => {
  if (!video) return null;
  if (video.site === 'YouTube') return `https://www.youtube.com/embed/${video.key}?autoplay=1&modestbranding=1&rel=0`;
  if (video.site === 'Vimeo') return `https://player.vimeo.com/video/${video.key}?autoplay=1`;
  if (video.site === 'Dailymotion') return `https://www.dailymotion.com/embed/video/${video.key}?autoplay=1`;
  return null;
};

const createWatchlist = async () => {
  try {
    await apiClient.post('/watchlists', { name: newListName.value });
    newListName.value = '';
    loadProfile();
    showToast('Watchlist created!');
  } catch (error) {
    showToast('Failed to create watchlist', 'danger');
  }
};

const shareMovie = async (movie) => {
  const url = `${window.location.origin}${window.location.pathname}?movieId=${movie.id}`;
  const message = `${movie.title || movie.name} — ${url}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: movie.title || movie.name, text: movie.overview || 'Check out this movie', url });
      return;
    } catch (_) {
      // fall through to clipboard fallback
    }
  }
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(message);
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  showToast('Link copied and WhatsApp share opened.', 'info');
};

const updateContactOrbit = (event) => {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  contactOrbitPosition.value = { x: x.toFixed(2), y: y.toFixed(2) };
};

const applyVisualTheme = () => {
  document.documentElement.setAttribute('data-theme', darkMode.value ? 'dark' : currentTheme.value);
};

// Determine the effective site-wide theme.
const resolveEffectiveTheme = () => adminThemesPreview.value || currentTheme.value || siteTheme.value || 'default';

const changeTheme = () => {
  document.documentElement.setAttribute('data-theme', darkMode.value ? 'dark' : resolveEffectiveTheme());
  currentTheme.value = resolveEffectiveTheme();
  if (adminThemesPreview.value) localStorage.setItem('admin_theme_preview', adminThemesPreview.value);
};

const chooseTheme = () => {
  darkMode.value = false;
  localStorage.setItem('user_theme', currentTheme.value);
  changeTheme();
};

const setUserTheme = (themeId) => {
  currentTheme.value = themeId;
  localStorage.setItem('user_theme', themeId);
  darkMode.value = false;
  localStorage.setItem('dark_mode', 'false');
  changeTheme();
};

const userThemeName = computed(() => {
  const found = SITE_THEMES.find(t => t.id === currentTheme.value);
  return found ? found.name : currentTheme.value;
});

const previewSiteTheme = (themeId) => {
  adminThemesPreview.value = themeId;
  changeTheme();
};

const clearPreview = () => {
  adminThemesPreview.value = '';
  localStorage.removeItem('admin_theme_preview');
  changeTheme();
};

const applySiteWideTheme = (themeId) => {
  adminSettings.value.siteTheme = themeId;
  currentTheme.value = themeId;
  localStorage.removeItem('user_theme');
  changeTheme();
};

const themePreviewStyle = (t) => ({
  background: `linear-gradient(135deg, ${t.primary}22 0%, ${t.accent}33 60%, ${t.accent2}22 100%)`
});

const currentThemeName = computed(() => {
  const id = adminThemesPreview.value || adminSettings.value.siteTheme || 'default';
  const found = (adminSettings.value.availableThemes || SITE_THEMES).find(t => t.id === id);
  return found ? found.name : id;
});

const applyThemeToSite = async (t) => {
  applySiteWideTheme(t.id);
  adminSaving.value = true;
  try {
    await saveAdminSettings();
    clearPreview();
    showToast(`Theme "${t.name}" is now live for all users.`);
  } catch (e) {
    showToast('Theme previewed but could not be saved.', 'danger');
  } finally {
    adminSaving.value = false;
  }
};

const toggleDarkMode = () => {
  darkMode.value = !darkMode.value;
  localStorage.setItem('dark_mode', darkMode.value ? 'true' : 'false');
  changeTheme();
};

const toggleReduceMotion = () => {
  reduceMotion.value = !reduceMotion.value;
  localStorage.setItem('reduce_motion', reduceMotion.value ? 'true' : 'false');
  document.documentElement.setAttribute('data-motion', reduceMotion.value ? 'off' : 'on');
};

const toggleChat = () => {
  isChatOpen.value = !isChatOpen.value;
  if (isChatOpen.value && chatMessages.value.length === 0) {
    chatMessages.value.push({
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help with movie recommendations, answer questions about the app, or chat about anything. How can I assist you today?'
    });
  }
};

const sendMessage = async () => {
  if (!chatInput.value.trim() || isChatLoading.value) return;

  const userMessage = chatInput.value.trim();
  chatMessages.value.push({ role: 'user', content: userMessage });
  chatInput.value = '';
  isChatLoading.value = true;

  try {
    const response = await callGeminiAPI(userMessage);
    chatMessages.value.push({ role: 'assistant', content: response });
  } catch (error) {
    console.error('AI Chat error:', error);
    chatMessages.value.push({
      role: 'assistant',
      content: 'Sorry, I encountered an error. Please try again later.'
    });
  } finally {
    isChatLoading.value = false;
    nextTick(() => {
      if (chatMessagesRef.value) {
        chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
      }
    });
  }
};

const callGeminiAPI = async (message) => {
  const history = chatMessages.value.slice(0, -1).map(m => ({ role: m.role === 'user' ? 'user' : 'model', content: m.content }));
  try {
    const res = await apiClient.post('/ai/chat', { message, history });
    return res.data.response;
  } catch (error) {
    console.error('AI API error:', error);
    throw new Error('AI service unavailable');
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;500;800&display=swap');

:root {
  --primary: #00ccff;
  --accent: #ff0044;
  --accent2: #00ff88;
  --dark: #0a0b1e;
  --glass: rgba(255,255,255,0.08);
  --gradient-bg: linear-gradient(135deg, #0a0b1e 0%, #1a1b2e 50%, #010204 100%);
}

[data-theme="default"] {
  --primary: #00ccff;
  --accent: #ff0044;
  --accent2: #00ff88;
  --dark: #0a0b1e;
  --glass: rgba(255,255,255,0.08);
  --gradient-bg: linear-gradient(135deg, #0a0b1e 0%, #1a1b2e 50%, #010204 100%);
}

[data-theme="dark"] {
  --primary: #4a90e2;
  --accent: #e74c3c;
  --accent2: #2ecc71;
  --dark: #0d0d0d;
  --glass: rgba(255,255,255,0.08);
  --gradient-bg: linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 50%, #000000 100%);
}

[data-theme="neon"] {
  --primary: #00ff88;
  --accent: #ff0080;
  --accent2: #00ccff;
  --dark: #000011;
  --glass: rgba(255,255,255,0.08);
  --gradient-bg: linear-gradient(135deg, #000011 0%, #001a14 50%, #000000 100%);
}

[data-theme="retro"] {
  --primary: #ff6b35;
  --accent: #f7931e;
  --accent2: #ffd166;
  --dark: #2d1b69;
  --glass: rgba(255,255,255,0.08);
  --gradient-bg: linear-gradient(135deg, #2d1b69 0%, #4a148c 50%, #1a0033 100%);
}

[data-theme="sunset"] {
  --primary: #ff9a3c;
  --accent: #ff5770;
  --accent2: #ffd76f;
  --dark: #1f1a17;
  --glass: rgba(255,255,255,0.08);
  --gradient-bg: linear-gradient(135deg, #1f1a17 0%, #3a1f2e 50%, #120a08 100%);
}

[data-theme="emerald"] {
  --primary: #34d399;
  --accent: #16a34a;
  --accent2: #a7f3d0;
  --dark: #071710;
  --glass: rgba(255,255,255,0.08);
  --gradient-bg: linear-gradient(135deg, #071710 0%, #0c2a1c 50%, #020a06 100%);
}

[data-theme="royal"] {
  --primary: #a78bfa;
  --accent: #7c3aed;
  --accent2: #f0abfc;
  --dark: #140b2e;
  --glass: rgba(255,255,255,0.08);
  --gradient-bg: linear-gradient(135deg, #140b2e 0%, #2b1a5e 50%, #080512 100%);
}

[data-theme="crimson"] {
  --primary: #ff4757;
  --accent: #cc0000;
  --accent2: #ffb8b8;
  --dark: #18060a;
  --glass: rgba(255,255,255,0.08);
  --gradient-bg: linear-gradient(135deg, #18060a 0%, #3a0d16 50%, #080203 100%);
}

[data-theme="aurora"] {
  --primary: #22d3ee;
  --accent: #a78bfa;
  --accent2: #67e8f9;
  --dark: #05121c;
  --glass: rgba(255,255,255,0.08);
  --gradient-bg: linear-gradient(135deg, #05121c 0%, #0b2e3a 50%, #02070c 100%);
}

[data-theme="gold"] {
  --primary: #fbbf24;
  --accent: #f59e0b;
  --accent2: #fde68a;
  --dark: #1c1406;
  --glass: rgba(255,255,255,0.08);
  --gradient-bg: linear-gradient(135deg, #1c1406 0%, #3a2a10 50%, #0a0703 100%);
}

[data-theme="cyber"] {
  --primary: #facc15;
  --accent: #f97316;
  --accent2: #22d3ee;
  --dark: #0d0d10;
  --glass: rgba(255,255,255,0.08);
  --gradient-bg: linear-gradient(135deg, #0d0d10 0%, #262613 50%, #060608 100%);
}

[data-theme="sakura"] {
  --primary: #ff9ecb;
  --accent: #ff5d8f;
  --accent2: #ffd1e8;
  --dark: #1a1016;
  --glass: rgba(255,255,255,0.08);
  --gradient-bg: linear-gradient(135deg, #1a1016 0%, #3a1a2c 50%, #0a0508 100%);
}


* { box-sizing: border-box; }
body { margin: 0; padding: 0; overflow-x: hidden; }
.app-container {
  min-height: 100vh;
  background: var(--gradient-bg);
  color: #e0e0e0;
  font-family: 'Plus Jakarta Sans', sans-serif;
  position: relative;
  overflow: hidden;
}
.space-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.star, .shooting-star, .nebula-particle, .planet-orbit, .satellite, .plasma {
  position: absolute;
  border-radius: 50%;
}
.star {
  width: 2px;
  height: 2px;
  background: white;
  /* Enhanced star animation using CSS custom properties */
}
.shooting-star {
  width: 140px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--primary), transparent);
}
.nebula-particle {
  background: radial-gradient(circle, rgba(0,204,255,0.18), transparent 70%);
  filter: blur(10px);
}
.planet-orbit {
  width: var(--size, 24px);
  height: var(--size, 24px);
  background: radial-gradient(circle at 30% 30%, #fff, var(--primary) 40%, #0044ff 100%);
  box-shadow: 0 0 20px rgba(0,204,255,0.5);
}
.satellite {
  width: 10px;
  height: 10px;
  background: var(--accent);
  box-shadow: 0 0 10px var(--accent);
}
.plasma {
  width: 400px;
  height: 400px;
  filter: blur(80px);
  opacity: 0.22;
}
.p-1 { top: -80px; left: -120px; background: var(--primary); }
.p-2 { top: 20%; right: -100px; background: var(--accent); }
.p-3 { bottom: -120px; left: 25%; background: #8a2be2; }

/* Enhanced Animations */
@keyframes twinkle {
  0%, 100% { 
    opacity: 0.3; 
    transform: scale(0.8) rotate(0deg);
  }
  25% { 
    opacity: 1; 
    transform: scale(1.2) rotate(90deg);
  }
  50% { 
    opacity: 0.4; 
    transform: scale(0.6) rotate(180deg);
  }
  75% { 
    opacity: 0.9; 
    transform: scale(1.1) rotate(270deg);
  }
}

@keyframes flyby {
  0% {
    transform: translateX(-30vw) translateY(0) rotate(-45deg) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
    transform: translateX(-25vw) translateY(-5vh) rotate(-45deg) scale(1);
  }
  50% {
    opacity: 0.8;
    transform: translateX(50vw) translateY(20vh) rotate(-45deg) scale(1.1);
  }
  100% {
    transform: translateX(150vw) translateY(40vh) rotate(-45deg) scale(0.8);
    opacity: 0;
  }
}

@keyframes drift {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
    filter: hue-rotate(0deg) brightness(1);
  }
  33% {
    transform: translate3d(15px, -10px, 0) scale(1.05);
    filter: hue-rotate(60deg) brightness(1.1);
  }
  66% {
    transform: translate3d(-10px, 15px, 0) scale(0.95);
    filter: hue-rotate(120deg) brightness(0.9);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
    filter: hue-rotate(0deg) brightness(1);
  }
}

@keyframes floatPlanet {
  0% {
    transform: translateY(0) translateX(0) rotate(0deg) scale(1);
    box-shadow: 0 0 20px rgba(0,204,255,0.5);
  }
  25% {
    transform: translateY(-20px) translateX(10px) rotate(90deg) scale(1.1);
    box-shadow: 0 0 30px rgba(0,204,255,0.7);
  }
  50% {
    transform: translateY(-10px) translateX(-10px) rotate(180deg) scale(1);
    box-shadow: 0 0 25px rgba(0,204,255,0.6);
  }
  75% {
    transform: translateY(-25px) translateX(15px) rotate(270deg) scale(1.05);
    box-shadow: 0 0 35px rgba(0,204,255,0.8);
  }
  100% {
    transform: translateY(0) translateX(0) rotate(360deg) scale(1);
    box-shadow: 0 0 20px rgba(0,204,255,0.5);
  }
}

@keyframes satelliteDrift {
  0% {
    transform: translateX(0) rotate(0deg);
    opacity: 0.7;
  }
  25% {
    transform: translateX(20px) rotate(90deg);
    opacity: 1;
  }
  50% {
    transform: translateX(-15px) rotate(180deg);
    opacity: 0.8;
  }
  75% {
    transform: translateX(25px) rotate(270deg);
    opacity: 0.9;
  }
  100% {
    transform: translateX(0) rotate(360deg);
    opacity: 0.7;
  }
}

@keyframes pulseGlow {
  0%, 100% { 
    transform: scale(1) rotate(0deg);
    opacity: 0.22;
    filter: brightness(1) blur(80px);
  }
  25% { 
    transform: scale(1.08) rotate(90deg);
    opacity: 0.35;
    filter: brightness(1.3) blur(90px);
  }
  50% { 
    transform: scale(1.15) rotate(180deg);
    opacity: 0.28;
    filter: brightness(1.1) blur(85px);
  }
  75% { 
    transform: scale(1.12) rotate(270deg);
    opacity: 0.4;
    filter: brightness(1.4) blur(95px);
  }
}

@keyframes pulseBadge {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 18px rgba(255,80,130,0.22);
  }
  50% {
    transform: scale(1.04);
    box-shadow: 0 0 32px rgba(255,80,130,0.32);
  }
}

@keyframes skeletonPulse {
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
}

@keyframes searchPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes nameGlow {
  0%, 100% { text-shadow: 0 0 10px rgba(0,204,255,.55), 0 0 24px rgba(0,204,255,.3), 0 0 44px rgba(0,204,255,.08); }
  50% { text-shadow: 0 0 14px rgba(0,204,255,.95), 0 0 36px rgba(0,204,255,.55), 0 0 64px rgba(255,0,68,.4); }
}
@keyframes nameGlowGold {
  0%, 100% { text-shadow: 0 0 10px rgba(255,209,102,.5), 0 0 22px rgba(255,154,60,.22); }
  50% { text-shadow: 0 0 16px rgba(255,209,102,.95), 0 0 34px rgba(255,154,60,.5), 0 0 50px rgba(255,209,102,.25); }
}

@keyframes contactFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-10px) rotate(1deg); }
  50% { transform: translateY(-5px) rotate(-1deg); }
  75% { transform: translateY(-15px) rotate(0.5deg); }
}

@keyframes orbitSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes iconBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: rgba(10,11,30,0.95);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  backdrop-filter: blur(20px);
}

.modal-content h3 {
  color: var(--accent2);
  margin-bottom: 1rem;
}

.modal-content p {
  color: rgba(255,255,255,0.8);
  margin-bottom: 1.5rem;
}

.watchlist-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.watchlist-option {
  padding: 0.75rem 1rem;
  background: rgba(255,255,255,0.1);
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.watchlist-option:hover {
  background: rgba(255,255,255,0.2);
}

.watchlist-option.new-list {
  border: 1px dashed rgba(255,255,255,0.3);
}

.new-list-input {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.new-list-input input {
  flex: 1;
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.1);
  color: #fff;
}

.modal-close {
  padding: 0.5rem 1rem;
  background: rgba(255,255,255,0.1);
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
}

.settings-modal { max-width: 520px; padding: 0; overflow: hidden; }
.settings-modal-head {
  display: flex; align-items: center; gap: .8rem; padding: 1.15rem 1.3rem;
  background: linear-gradient(135deg, rgba(0,204,255,.14), rgba(255,0,68,.1)), rgba(255,255,255,.03);
  border-bottom: 1px solid rgba(255,255,255,.1);
}
.settings-head-icon {
  width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; flex-shrink: 0;
  background: linear-gradient(135deg, var(--primary), var(--accent)); color: #00131c;
  box-shadow: 0 8px 22px rgba(0,204,255,.35);
}
.settings-modal-head h3 { margin: 0; font-size: 1.15rem; display: flex; align-items: center; gap: .5rem; }
.settings-modal-head p { margin: .15rem 0 0; font-size: .8rem; color: rgba(255,255,255,.62); }
.settings-x {
  margin-left: auto; width: 34px; height: 34px; border-radius: 10px; border: none; cursor: pointer;
  display: grid; place-items: center; background: rgba(255,255,255,.08); color: #fff;
  transition: background .2s ease, transform .2s ease;
}
.settings-x:hover { background: rgba(255,0,68,.25); transform: rotate(90deg); }
.settings-group { padding: .9rem 1.3rem 1rem; border-bottom: 1px solid rgba(255,255,255,.08); }
.settings-group:last-of-type { border-bottom: none; }
.settings-group-label {
  display: flex; align-items: center; gap: .4rem; font-size: .72rem; font-weight: 800;
  letter-spacing: .12em; text-transform: uppercase; color: var(--accent2); margin-bottom: .3rem;
}
.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: .9rem 0;
  border-bottom: 1px solid rgba(255,255,255,.08);
}
.settings-group .settings-row:last-of-type { border-bottom: none; }
.settings-info { min-width: 0; }
.settings-label { display: inline-flex; align-items: center; gap: .45rem; color: #fff; font-weight: 700; }
.settings-label .app-icon { color: var(--primary); }
.settings-info p { margin: .3rem 0 0; font-size: .82rem; color: rgba(255,255,255,.62); }
.settings-select { max-width: 190px; }
.settings-footer { display: flex; justify-content: flex-end; margin-top: 1rem; gap: .6rem; }
.settings-theme-darknote {
  display: flex; align-items: center; gap: .4rem; margin: .2rem 0 0; padding: .55rem .7rem;
  border-radius: 10px; background: rgba(255,255,255,.05); border: 1px dashed rgba(255,255,255,.14);
  font-size: .8rem; color: rgba(255,255,255,.6);
}
.settings-theme-head { display: flex; align-items: center; justify-content: space-between; margin-top: .35rem; }
.theme-current-name {
  font-size: .75rem; font-weight: 800; letter-spacing: .04em; padding: .22rem .55rem;
  border-radius: 999px; background: linear-gradient(135deg, var(--primary), var(--accent2)); color: #00131c;
}
.settings-theme-hint { margin: .25rem 0 .6rem; font-size: .78rem; color: rgba(255,255,255,.55); }
.theme-swatch-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: .55rem; }
.theme-swatch-btn {
  position: relative; display: flex; align-items: center; gap: .3rem; padding: .5rem .55rem;
  border-radius: 12px; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.04);
  cursor: pointer; transition: border-color .2s ease, background .2s ease, transform .2s ease;
}
.theme-swatch-btn:hover { transform: translateY(-2px); border-color: rgba(255,255,255,.28); background: rgba(255,255,255,.07); }
.theme-swatch-btn.active { border-color: var(--accent2); background: rgba(0,255,136,.08); box-shadow: 0 0 0 1px var(--accent2); }
.tsw-dot { width: 13px; height: 13px; border-radius: 50%; border: 1px solid rgba(255,255,255,.2); flex-shrink: 0; }
.theme-swatch-btn em { font-style: normal; font-size: .76rem; font-weight: 700; color: rgba(255,255,255,.85); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tsw-check {
  margin-left: auto; width: 18px; height: 18px; border-radius: 50%; display: grid; place-items: center;
  background: var(--accent2); color: #00130a; flex-shrink: 0;
}
.lang-picker { display: flex; gap: .7rem; padding-bottom: .3rem; }
.lang-pick {
  flex: 1; display: flex; align-items: center; gap: .6rem; padding: .7rem .8rem;
  border-radius: 14px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.04);
  cursor: pointer; transition: border-color .2s ease, background .2s ease, transform .2s ease;
}
.lang-pick:hover { border-color: rgba(255,255,255,.3); transform: translateY(-2px); }
.lang-pick.active { border-color: var(--primary); background: rgba(0,204,255,.1); box-shadow: 0 0 0 1px var(--primary); }
.lang-flag { font-size: 1.4rem; line-height: 1; }
.lang-pick > span:nth-child(2) { display: grid; gap: .1rem; text-align: left; }
.lang-pick strong { font-size: .86rem; color: #fff; }
.lang-pick small { font-size: .72rem; color: rgba(255,255,255,.55); }
.lang-check { margin-left: auto; width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center; background: var(--primary); color: #00131c; }
.switch {
  position: relative;
  flex: 0 0 auto;
  width: 54px;
  height: 30px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  background: rgba(255,255,255,.18);
  transition: background .25s ease;
  padding: 0;
}
.switch.on {
  background: linear-gradient(135deg, var(--primary), var(--accent2));
  box-shadow: 0 6px 18px rgba(0,204,255,.4);
}
.switch-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,.3);
  transition: transform .25s ease;
}
.switch.on .switch-knob { transform: translateX(24px); }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity .25s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

[data-motion="off"] *,
[data-motion="off"] *::before,
[data-motion="off"] *::after {
  animation: none !important;
  transition: none !important;
}

/* === Notifications bell + panel === */
.notif-wrap { position: relative; }
.notif-bell { position: relative; }
.notif-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  font-size: .68rem;
  font-weight: 800;
  background: linear-gradient(135deg, #ff004c, #ff8a00);
  color: #fff;
  box-shadow: 0 4px 12px rgba(255,0,76,.5);
}
.notif-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 340px;
  max-width: 86vw;
  background: rgba(10,11,30,.97);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 18px;
  padding: .9rem;
  backdrop-filter: blur(20px);
  box-shadow: 0 24px 70px rgba(0,0,0,.6);
  z-index: 60;
}
.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .5rem;
  margin-bottom: .6rem;
  padding-bottom: .6rem;
  border-bottom: 1px solid rgba(255,255,255,.08);
}
.notif-header h3 { margin: 0; font-size: .95rem; color: #fff; display: flex; align-items: center; gap: .4rem; }
.notif-header h3 .app-icon { color: var(--primary); }
.notif-mark-all {
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  font-size: .72rem;
  font-weight: 700;
}
.notif-empty { color: rgba(255,255,255,.6); font-size: .85rem; padding: 1rem .5rem; }
.notif-list { display: grid; gap: .4rem; max-height: 320px; overflow-y: auto; }
.notif-item {
  display: flex;
  gap: .6rem;
  align-items: flex-start;
  padding: .6rem .7rem;
  border-radius: 12px;
  border: 1px solid transparent;
  background: rgba(255,255,255,.04);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background .2s ease;
}
.notif-item:hover { background: rgba(255,255,255,.1); }
.notif-item.unread { border-color: rgba(0,204,255,.35); background: rgba(0,204,255,.08); }
.notif-dot {
  width: 8px;
  height: 8px;
  margin-top: .3rem;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--accent2);
}
.notif-item:not(.unread) .notif-dot { background: rgba(255,255,255,.25); }
.notif-title { margin: 0 0 .2rem; color: #fff; font-size: .82rem; font-weight: 700; }
.notif-body { margin: 0 0 .25rem; color: rgba(255,255,255,.7); font-size: .78rem; line-height: 1.4; }
.notif-time { color: rgba(255,255,255,.4); font-size: .68rem; }
.notif-fade-enter-active, .notif-fade-leave-active { transition: opacity .2s ease, transform .2s ease; }
.notif-fade-enter-from, .notif-fade-leave-to { opacity: 0; transform: translateY(-6px); }

/* === Like button states === */
.card-action-btn.favorite.liked { background: linear-gradient(135deg, #ff004c, #ff8a00); border-color: transparent; }
.like-count {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  display: grid;
  place-items: center;
  font-size: .6rem;
  font-weight: 800;
  border-radius: 999px;
  background: var(--primary);
  color: #001018;
}
.like-active { background: linear-gradient(135deg, #ff004c, #ff8a00) !important; border-color: transparent !important; color: #fff !important; }
.like-badge {
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  margin-left: 2px;
  border-radius: 999px;
  font-size: .68rem;
  background: rgba(255,255,255,.2);
}

/* === Profile page === */
.profile-card { padding: 1.5rem; display: grid; gap: 1.25rem; }
.profile-top {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}
.profile-avatar-wrap { text-align: center; }
.profile-avatar {
  position: relative;
  width: 108px;
  height: 108px;
  margin: 0 auto .6rem;
  display: grid;
  place-items: center;
  overflow: visible;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,.18), transparent 60%),
              linear-gradient(135deg, rgba(0,204,255,.3), rgba(255,0,68,.3));
  border: 2px solid rgba(255,255,255,.25);
  box-shadow: 0 16px 40px rgba(0,204,255,.25);
  color: #fff;
}
.profile-avatar.premium { border-color: #ffd700; box-shadow: 0 16px 40px rgba(255,215,0,.3); }
.profile-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}
.avatar-crown {
  position: absolute;
  top: -8px;
  right: -6px;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffd700, #ff9900);
  color: #001018;
  box-shadow: 0 4px 12px rgba(255,215,0,.6);
}
.avatar-upload {
  display: inline-flex;
  align-items: center;
  gap: .3rem;
  padding: .35rem .8rem;
  border-radius: 999px;
  font-size: .72rem;
  font-weight: 700;
  cursor: pointer;
  color: #fff;
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.2);
  transition: background .25s ease;
}
.avatar-upload:hover { background: rgba(0,204,255,.25); }
.profile-identity { min-width: 0; }
.profile-email { margin: 0 0 .5rem; color: rgba(255,255,255,.85); display: flex; align-items: center; gap: .4rem; font-size: .92rem; }
.profile-stats { margin: 0; display: flex; flex-wrap: wrap; gap: .9rem; color: rgba(255,255,255,.7); font-size: .82rem; }
.profile-stats span { display: inline-flex; align-items: center; gap: .3rem; }
.profile-stats .app-icon { color: var(--primary); }
.loc-group { position: relative; }
.loc-detect {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  padding: .35rem .7rem;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-size: .7rem;
  font-weight: 700;
  color: #001018;
  background: linear-gradient(135deg, var(--primary), var(--accent2));
  display: inline-flex;
  align-items: center;
  gap: .25rem;
  z-index: 2;
}
.trial-note { margin: 0 0 .5rem; color: rgba(255,255,255,.75); font-size: .8rem; display: flex; align-items: center; gap: .4rem; }
.trial-note .app-icon { color: var(--accent2); flex-shrink: 0; }
.notif-toggle {
  display: flex;
  align-items: center;
  gap: .7rem;
  padding: .4rem 0;
  font-size: .85rem;
  color: rgba(255,255,255,.85);
  cursor: pointer;
  user-select: none;
}
.switch.small { width: 42px; height: 24px; }
.switch.small .switch-knob { width: 18px; height: 18px; }
.switch.small.on .switch-knob { transform: translateX(18px); }

/* Subscription card */
.sub-card {
  border-radius: 20px;
  padding: 1.25rem;
  background: linear-gradient(160deg, rgba(0,204,255,.1), rgba(255,0,68,.06));
  border: 1px solid rgba(255,255,255,.12);
}
.sub-card.premium { border-color: rgba(255,215,0,.55); box-shadow: 0 16px 44px rgba(255,215,0,.15); }
.sub-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
.sub-head h3 { margin: 0 0 .3rem; color: #fff; font-size: 1.05rem; display: flex; align-items: center; gap: .4rem; }
.sub-head h3 .app-icon { color: var(--accent2); }
.sub-head p { margin: 0; color: rgba(255,255,255,.75); font-size: .82rem; line-height: 1.5; }
.sub-badge {
  flex: 0 0 auto;
  padding: .35rem .8rem;
  border-radius: 999px;
  font-size: .7rem;
  font-weight: 800;
  letter-spacing: .1em;
  color: #ffd700;
  background: rgba(255,215,0,.15);
  border: 1px solid rgba(255,215,0,.45);
}
.momo-box h4 { margin: 0 0 .7rem; color: #fff; font-size: .9rem; display: flex; align-items: center; gap: .4rem; }
.momo-box h4 .app-icon { color: var(--accent2); }
.momo-fields { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; }
.momo-actions { display: flex; gap: .6rem; flex-wrap: wrap; margin-top: .7rem; }
.sub-message { margin: .7rem 0 0; font-size: .8rem; color: rgba(255,255,255,.75); }
.sub-message.ok { color: var(--accent2); }
.momo-note { margin: .7rem 0 0; font-size: .72rem; color: rgba(255,255,255,.55); display: flex; align-items: flex-start; gap: .3rem; }
.momo-note .app-icon { flex-shrink: 0; margin-top: 2px; }
.fav-card { position: relative; }
.fav-unlike {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  color: #fff;
  background: linear-gradient(135deg, #ff004c, #ff8a00);
  box-shadow: 0 4px 12px rgba(255,0,76,.4);
}
.history-item { display: flex; justify-content: space-between; gap: 1rem; align-items: baseline; }
.history-date { color: rgba(255,255,255,.5); font-size: .78rem; flex-shrink: 0; }

@media (max-width: 640px) {
  .notif-panel { right: -20px; }
  .momo-fields { grid-template-columns: 1fr; }
}

.chat-bg-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.chat-particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(0,204,255,0.5);
  border-radius: 50%;
  animation: chatParticleFloat 8s ease-in-out infinite;
}

.chat-particle:nth-child(odd) {
  background: rgba(255,0,68,0.5);
  animation-duration: 6s;
}

/* Apply animations to elements */
.star { animation: twinkle var(--twinkle-duration, 3s) ease-in-out var(--twinkle-delay, 0s) infinite; }
.shooting-star { animation: flyby linear infinite; }
.nebula-particle { animation: drift linear infinite; }
.planet-orbit { animation: floatPlanet linear infinite; }
.satellite { animation: satelliteDrift linear infinite; }
.plasma { animation: pulseGlow 14s ease-in-out infinite; }

.main-header {
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(18px);
  background: rgba(10,11,30,0.72);
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
}
@media (max-width: 1024px) {
  .header-inner {
    padding: .8rem 1rem;
  }
  .nav-pills {
    flex-wrap: nowrap;
    justify-content: flex-start;
    overflow-x: auto;
    scrollbar-width: none;
    padding-bottom: .35rem;
    -webkit-overflow-scrolling: touch;
  }
  .nav-pills::-webkit-scrollbar { display: none; }
  .pill { flex: 0 0 auto; padding: .65rem .85rem; }
}
@media (max-width: 640px) {
  .header-inner { flex-direction: column; align-items: stretch; }
  .logo-group { align-self: flex-start; }
  .chameleon-name { font-size: 1.2rem; }
  .content-wrapper { padding: .9rem; }
  .search-glow-box { flex-direction: column; align-items: stretch; }
  .search-action-btn { width: 100%; }
  .banner-stage, .banner-content { min-height: 300px; }
  .strip-item { flex-basis: 160px; }
}
.scroll-progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  z-index: 3000;
  border-radius: 0 3px 3px 0;
  background: linear-gradient(90deg, var(--primary), var(--accent2), var(--accent));
  box-shadow: 0 0 12px rgba(0,204,255,.6);
  transition: width .08s linear;
}
.logo-group { cursor: pointer; transition: transform .25s ease; display: inline-flex; align-items: center; gap: .55rem; }
.logo-home-chip {
  width: 36px; height: 36px; border-radius: 12px; flex-shrink: 0;
  display: grid; place-items: center;
  background: linear-gradient(135deg, var(--primary), var(--accent)); color: #00131c;
  box-shadow: 0 6px 20px rgba(0,204,255,.45);
  transition: transform .25s ease, box-shadow .25s ease;
}
.logo-group:hover .logo-home-chip { transform: rotate(-8deg) scale(1.12); box-shadow: 0 10px 26px rgba(0,204,255,.65); }
.logo-group:hover .chameleon-name { transform: scale(1.045); }
.chameleon-name {
  margin: 0;
  font-size: 1.55rem;
  font-weight: 900;
  letter-spacing: .8px;
  white-space: nowrap;
  color: #ffffff;
  animation: nameGlow 2.6s ease-in-out infinite;
}
.chameleon-name span {
  color: #ffd166;
  animation: nameGlowGold 2.6s ease-in-out infinite;
}
.nav-pills { display: flex; flex-wrap: wrap; justify-content: center; gap: .65rem; }
.pill, .mode-btn, .search-action-btn, .auth-btn, .btn-watch-gradient, .btn-trailer-red, .download-btn, .exit-hall-btn, .back-btn, .tab-btn, .forgot-link {
  border: none;
  cursor: pointer;
  transition: transform .25s ease, box-shadow .25s ease, background .25s ease, opacity .25s ease;
}
.pill {
  padding: .8rem 1rem;
  border-radius: 999px;
  color: #fff;
  background: rgba(255,255,255,.08);
  backdrop-filter: blur(10px);
}
.pill:hover, .mode-btn:hover, .search-action-btn:hover, .auth-btn:hover, .btn-watch-gradient:hover, .btn-trailer-red:hover, .btn-download-blue:hover, .exit-hall-btn:hover, .back-btn:hover, .tab-btn:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 28px rgba(0,204,255,.18);
}
.pill.active, .mode-btn.active, .tab-btn.active {
  background: linear-gradient(135deg, rgba(0,204,255,.35), rgba(255,0,68,.3));
  box-shadow: 0 0 20px rgba(0,204,255,.24);
}
.cinema-actions {
  display: flex;
  gap: .75rem;
  align-items: center;
}
.download-btn {
  padding: .9rem 1rem;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(0,204,255,.25), rgba(255,255,255,.18));
  color: #fff;
}
.download-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 32px rgba(0,204,255,.18);
}
.content-wrapper { position: relative; z-index: 2; padding: 1.2rem; }
.content-wrapper::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: radial-gradient(ellipse at 50% -10%, rgba(138,43,226,.12), transparent 55%),
              radial-gradient(ellipse at 100% 100%, rgba(0,204,255,.08), transparent 55%);
}
.hero-section { max-width: 1400px; margin: 0 auto 1rem; display: grid; gap: 1rem; }
.hero-banner { display: grid; gap: 1rem; }
.banner-stage {
  position: relative;
  border-radius: 28px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.1);
  box-shadow: 0 30px 90px rgba(0,0,0,.45);
  min-height: 380px;
}
.banner-slide { position: relative; height: 100%; }
.banner-bg { position: absolute; inset: 0; }
.banner-bg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transform: scale(1.03);
}
.banner-no-poster {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
  font-weight: 800;
  background: linear-gradient(135deg, rgba(0,204,255,.25), rgba(255,0,68,.3));
}
.banner-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(5,6,18,.93) 0%, rgba(5,6,18,.55) 38%, rgba(5,6,18,.05) 72%),
              linear-gradient(to top, rgba(5,6,18,.9) 0%, transparent 55%);
}
.banner-content {
  position: relative;
  z-index: 2;
  max-width: 640px;
  padding: clamp(1.2rem, 4vw, 3rem);
  min-height: 380px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: .7rem;
}
.banner-rank {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: .4rem;
  padding: .5rem .9rem;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(255,0,68,.9), rgba(255,122,0,.9));
  color: #fff;
  font-size: .75rem;
  font-weight: 800;
  letter-spacing: 1px;
  box-shadow: 0 12px 26px rgba(255,0,68,.3);
}
.banner-title {
  margin: 0;
  color: #fff;
  font-size: clamp(1.6rem, 4.2vw, 3.2rem);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.02em;
  text-shadow: 0 4px 24px rgba(0,0,0,.5);
}
.banner-meta { display: flex; gap: .6rem; flex-wrap: wrap; }
.banner-meta-chip {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  padding: .35rem .7rem;
  border-radius: 999px;
  background: rgba(0,0,0,.45);
  border: 1px solid rgba(255,255,255,.14);
  color: #fff;
  font-size: .8rem;
  font-weight: 600;
  backdrop-filter: blur(6px);
}
.banner-score .app-icon { color: #ffe061; }
.banner-overview {
  margin: 0;
  color: rgba(255,255,255,.82);
  font-size: .95rem;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 2px 12px rgba(0,0,0,.6);
}
.banner-actions { display: flex; gap: .75rem; flex-wrap: wrap; margin-top: .4rem; }
.banner-btn {
  padding: .9rem 1.4rem;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  font-weight: 800;
  font-size: .92rem;
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  transition: transform .25s ease, box-shadow .25s ease;
}
.banner-btn.primary { background: linear-gradient(135deg, var(--primary), var(--accent2)); color: #001018; box-shadow: 0 14px 34px rgba(0,204,255,.35); }
.banner-btn.ghost { background: rgba(255,255,255,.14); color: #fff; border: 1px solid rgba(255,255,255,.22); backdrop-filter: blur(8px); }
.banner-btn:hover { transform: translateY(-3px) scale(1.03); }
.banner-btn.primary:hover { box-shadow: 0 18px 44px rgba(0,204,255,.5); }
.banner-dots {
  position: absolute;
  right: 1.2rem;
  bottom: 1.2rem;
  z-index: 3;
  display: flex;
  gap: .45rem;
}
.banner-dots button {
  width: 9px;
  height: 9px;
  padding: 0;
  border-radius: 999px;
  border: none;
  background: rgba(255,255,255,.4);
  cursor: pointer;
  transition: all .25s ease;
}
.banner-dots button.active { width: 28px; background: linear-gradient(90deg, var(--primary), var(--accent2)); }
.trending-strip {
  display: flex;
  gap: .7rem;
  overflow-x: auto;
  padding: .3rem .1rem .5rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,204,255,.4) transparent;
}
.strip-item {
  position: relative;
  flex: 0 0 210px;
  aspect-ratio: 16 / 9;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease;
}
.strip-item:hover { transform: translateY(-4px); box-shadow: 0 14px 34px rgba(0,204,255,.25); }
.strip-item.active { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(0,204,255,.4), 0 14px 34px rgba(0,204,255,.3); }
.strip-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
.strip-veil { position: absolute; inset: 0; background: linear-gradient(to top, rgba(5,6,18,.85), rgba(5,6,18,.1) 60%); }
.strip-num {
  position: absolute;
  left: .6rem;
  bottom: .35rem;
  z-index: 2;
  font-size: 1.4rem;
  font-weight: 800;
  line-height: 1;
  color: var(--primary);
  text-shadow: 0 2px 8px rgba(0,0,0,.8);
}
.strip-no-poster {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  text-align: center;
  padding: .5rem;
  font-size: .72rem;
  color: #fff;
  background: linear-gradient(135deg, rgba(0,204,255,.25), rgba(255,0,68,.3));
}
.banner-fade-enter-active, .banner-fade-leave-active { transition: opacity .5s ease, transform .5s ease; }
.banner-fade-enter-from { opacity: 0; transform: scale(1.03); }
.banner-fade-leave-to { opacity: 0; transform: scale(.99); }
.hero-title { margin: 0; font-size: clamp(1.5rem, 4vw, 3rem); color: #fff; line-height: 1.15; letter-spacing: -0.02em; }
.hero-subtitle { margin: .5rem 0 0; color: rgba(255,255,255,.72); max-width: 60ch; }
.poster-box img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* Always-visible card footer: red TRAILER + green WATCH FULL MOVIE */
.movie-card-info {
  position: relative;
  z-index: 2;
  padding: .7rem .75rem .8rem;
  background: linear-gradient(180deg, rgba(10,12,28,.92), rgba(15,17,38,1));
  border-top: 1px solid rgba(255,255,255,.09);
}
.movie-card-info .mc-title {
  margin: 0 0 .15rem;
  font-size: .9rem;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.movie-card-info .mc-year { font-size: .72rem; color: rgba(255,255,255,.55); letter-spacing: .05em; }
.mc-btns { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; margin-top: .55rem; }
.mc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .35rem;
  padding: .55rem .4rem;
  border: none;
  border-radius: 10px;
  font-size: .72rem;
  font-weight: 800;
  letter-spacing: .03em;
  cursor: pointer;
  white-space: nowrap;
  transition: transform .2s ease, box-shadow .2s ease, filter .2s ease;
}
.mc-trailer { background: linear-gradient(135deg, #e11d48, #ff7a00); color: #fff; box-shadow: 0 6px 16px rgba(225,29,72,.35); }
.mc-watch { background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; box-shadow: 0 6px 16px rgba(34,197,94,.35); }
.mc-btn:hover { transform: translateY(-2px); filter: brightness(1.12); }
.mc-trailer:hover { box-shadow: 0 10px 22px rgba(225,29,72,.5); }
.mc-watch:hover { box-shadow: 0 10px 22px rgba(34,197,94,.5); }
.movie-card:hover .poster-box img { filter: brightness(.85); }
@media (max-width: 420px) {
  .mc-btn { font-size: .62rem; padding: .5rem .2rem; }
}
.search-section { max-width: 1400px; margin: 0 auto 1rem; }
.search-container { display: grid; gap: 1rem; }
.mode-switcher { display: flex; gap: .75rem; flex-wrap: wrap; }
.mode-btn {
  padding: .85rem 1.15rem;
  border-radius: 999px;
  background: rgba(255,255,255,.08);
  color: #fff;
}
.search-glow-box {
  display: flex;
  gap: .75rem;
  padding: .8rem;
  border-radius: 24px;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.08);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.03);
  transition: border-color .3s ease, box-shadow .3s ease, background .3s ease;
}
.search-glow-box:focus-within {
  border-color: rgba(0,204,255,.5);
  box-shadow: 0 0 0 4px rgba(0,204,255,.1), 0 0 34px rgba(0,204,255,.18);
  background: rgba(255,255,255,.09);
}
.search-glow-box input, .comment-textarea {
  flex: 1;
  min-width: 0;
  padding: 1rem 1.1rem;
  border: none;
  outline: none;
  color: #fff;
  background: transparent;
  font-size: 1rem;
}
.search-action-btn {
  padding: 1rem 1.25rem;
  border-radius: 18px;
  color: #001018;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary), var(--accent2));
  animation: searchPulse 2s ease-in-out infinite;
}
.movies-section { max-width: 1500px; margin: 0 auto; }
.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}
.movie-card {
  position: relative;
  border-radius: 22px;
  overflow: hidden;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.14);
  backdrop-filter: blur(12px);
  box-shadow: 0 22px 60px rgba(0,0,0,.25);
  cursor: pointer;
  transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease;
}
.movie-card:hover { transform: translateY(-10px) scale(1.02); box-shadow: 0 28px 72px rgba(0,204,255,.18); border-color: rgba(255,255,255,.22); }
.movie-card-actions {
  position: absolute;
  top: 0.8rem;
  right: 0.8rem;
  display: flex;
  gap: 0.5rem;
  z-index: 4;
}
.card-action-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  display: grid;
  place-items: center;
  background: rgba(0,0,0,.55);
  color: #fff;
  box-shadow: 0 10px 22px rgba(0,0,0,.24);
  transition: transform .2s ease, background .2s ease;
}
.card-action-btn:hover { transform: scale(1.08); background: rgba(0,0,0,.75); }
.card-action-btn.watchlist { background: rgba(255,255,255,.12); }
.poster-box { position: relative; aspect-ratio: 2 / 3; overflow: hidden; }
.quick-play {
  position: absolute;
  bottom: .75rem;
  right: .75rem;
  z-index: 3;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border: 2px solid rgba(255,255,255,.9);
  border-radius: 999px;
  background: linear-gradient(135deg, var(--primary), var(--accent2));
  color: #001018;
  cursor: pointer;
  box-shadow: 0 8px 22px rgba(0,204,255,.5);
  opacity: 0;
  transform: translateY(8px) scale(.85);
  transition: opacity .25s ease, transform .25s ease, box-shadow .25s ease;
}
.movie-card:hover .quick-play { opacity: 1; transform: translateY(0) scale(1); }
.quick-play:hover { box-shadow: 0 12px 30px rgba(0,204,255,.8); transform: translateY(-2px) scale(1.1); }
.no-poster { width: 100%; height: 100%; display: grid; place-items: center; padding: 1rem; text-align: center; background: linear-gradient(135deg, rgba(0,204,255,.22), rgba(255,0,68,.25)); color: #fff; font-weight: 600; }
.card-badge {
  position: absolute;
  top: .75rem;
  left: .75rem;
  z-index: 3;
  padding: .45rem .7rem;
  border-radius: 999px;
  font-size: .82rem;
  background: rgba(0,0,0,.6);
  backdrop-filter: blur(10px);
}
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  padding: 1rem;
  background: linear-gradient(to top, rgba(5,6,18,.96), rgba(5,6,18,.15) 55%, transparent);
  opacity: 0;
  transition: opacity .25s ease;
}
.movie-card:hover .overlay { opacity: 1; }
.overlay-content { width: 100%; }
.m-title { margin: 0 0 .35rem; color: #fff; font-size: 1rem; }
.m-info { margin: 0 0 .75rem; color: rgba(255,255,255,.72); }
.btns { display: flex; gap: .65rem; flex-wrap: wrap; }
.btn-watch-gradient, .btn-trailer-red, .btn-download-blue, .btn-like {
  flex: 1 1 120px;
  padding: .85rem .9rem;
  border-radius: 14px;
  font-weight: 800;
  color: #fff;
}
.btn-watch-gradient { background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; box-shadow: 0 10px 24px rgba(34,197,94,.35); }
.btn-trailer-red { background: linear-gradient(135deg, #e11d48, #ff7a00); box-shadow: 0 10px 24px rgba(225,29,72,.35); }
.btn-download-blue { background: linear-gradient(135deg, #0066cc, #00aaff); }
.btn-like { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.16); }
.btn-like:hover { background: rgba(255,77,109,.18); border-color: rgba(255,77,109,.45); }
.btn-like.like-active { background: linear-gradient(135deg, #ff4d6d, #ff7a9c); color: #fff; border-color: transparent; }
.skeleton-card {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.08);
  min-height: 320px;
  padding: 1rem;
}
.skeleton-poster {
  width: 100%;
  height: 220px;
  border-radius: 18px;
  background: linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.16), rgba(255,255,255,.08));
  animation: skeletonPulse 1.5s ease-in-out infinite;
}
.skeleton-line {
  height: 16px;
  border-radius: 999px;
  margin-top: 1rem;
  background: linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.18), rgba(255,255,255,.08));
  animation: skeletonPulse 1.5s ease-in-out infinite;
}
.skeleton-line.short { width: 60%; }
.loader-zone { min-height: 140px; display: grid; place-items: center; padding: 1.5rem 0; }
.infinity-loader { display: grid; justify-items: center; gap: .75rem; }
.orbit-spinner {
  position: relative;
  width: 60px;
  height: 60px;
  filter: drop-shadow(0 0 12px rgba(0,204,255,.35));
}
.orbit {
  position: absolute;
  inset: 0;
  border: 2px solid rgba(0,204,255,.15);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
.orbit:nth-child(2) { inset: 10px; animation-duration: 1.4s; border-top-color: var(--accent); }
.orbit:nth-child(3) { inset: 20px; animation-duration: 1.9s; border-top-color: var(--accent2); }
.load-label {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  color: rgba(255,255,255,.7);
  font-size: .85rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  animation: labelGlow 2.2s ease-in-out infinite;
}
.load-label .app-icon { color: var(--primary); }
@keyframes labelGlow {
  0%, 100% { opacity: .55; }
  50% { opacity: 1; }
}
.no-results { color: rgba(255,255,255,.75); }
.cinema-hall-container, .auth-container, .new-contact-container {
  max-width: 1400px;
  margin: 0 auto;
}
.cinema-header, .auth-card, .contact-hero, .search-glow-box, .comment-section {
  border-radius: 24px;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.08);
  backdrop-filter: blur(14px);
}
.cinema-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  margin-bottom: 1rem;
}
.playing-info h3 { margin: .35rem 0 0; color: #fff; }
.live-tag { color: #ff4d6d; font-weight: 800; letter-spacing: 1px; animation: pulseBadge 4s ease-in-out infinite; }
.exit-hall-btn, .back-btn, .auth-btn, .search-action-btn { font-weight: 800; }
.exit-hall-btn, .back-btn { padding: .9rem 1.1rem; border-radius: 14px; color: #fff; background: rgba(255,255,255,.08); }
.provider-bar {
  display: flex;
  align-items: center;
  gap: .75rem;
  flex-wrap: wrap;
  padding: .7rem 1rem;
  margin: -0.4rem 0 1rem;
  border-radius: 16px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.07);
}
.provider-label {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  font-size: .72rem;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: rgba(255,255,255,.5);
}
.provider-label .app-icon { color: var(--primary); }
.provider-pills { display: flex; gap: .5rem; flex-wrap: wrap; }
.provider-pill {
  padding: .45rem .85rem;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.06);
  color: rgba(255,255,255,.8);
  font-size: .78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all .2s ease;
}
.provider-pill:hover { border-color: rgba(0,204,255,.5); color: #fff; }
.provider-pill.active {
  background: linear-gradient(135deg, var(--primary), var(--accent2));
  border-color: transparent;
  color: #001018;
  box-shadow: 0 8px 20px rgba(0,204,255,.25);
}
.video-wrapper { position: relative; aspect-ratio: 16 / 9; width: 100%; overflow: hidden; border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,.5); }
.trailer-iframe { width: 100%; height: 100%; }
.comment-section {
  margin-top: 1rem;
  padding: 1.2rem;
}
.comment-title {
  margin: 0 0 1rem;
  color: #fff;
}
.comment-form {
  display: grid;
  gap: .9rem;
  margin-bottom: 1rem;
}
.comment-list {
  display: grid;
  gap: .75rem;
}
.comment-item {
  padding: .9rem 1rem;
  border-radius: 16px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.08);
}
.comment-item h4 {
  margin: 0 0 .35rem;
  color: var(--accent2);
}
.comment-item p {
  margin: 0;
  color: rgba(255,255,255,.8);
  white-space: pre-wrap;
}
.auth-container { padding: 1rem 0; }
.auth-card { padding: 1.25rem; max-width: 520px; margin: 0 auto; }
.auth-tabs { display: flex; gap: .75rem; margin-bottom: 1rem; }
.tab-btn { flex: 1; padding: .9rem 1rem; border-radius: 14px; color: #fff; background: rgba(255,255,255,.08); }
.auth-forms { display: flex; flex-direction: column; gap: 1rem; }

/* === YOUTMUS music lounge === */
.youtmus-page { padding: 1.25rem 0 2.5rem; }
.youtmus-head { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.25rem; }
.youtmus-title { display: flex; align-items: center; gap: .8rem; color: #b388ff; }
.youtmus-title h2 { font-size: 1.6rem; margin: 0; letter-spacing: .12em; color: #fff; }
.youtmus-title p { margin: .1rem 0 0; color: rgba(255,255,255,.65); font-size: .9rem; }
.youtmus-search { display: flex; gap: .5rem; width: 100%; max-width: 100%; }
.youtmus-search input {
  flex: 1; padding: .8rem 1rem; border-radius: 12px; border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.08); color: #fff; font-size: 1rem; outline: none;
}
.youtmus-search input:focus { border-color: rgba(179,136,255,.6); }
.youtmus-search button {
  display: inline-flex; align-items: center; gap: .4rem; padding: .8rem 1.2rem; border-radius: 12px;
  border: none; cursor: pointer; background: linear-gradient(135deg, #b388ff, #7c4dff); color: #fff;
  font-weight: 700; font-size: .95rem; white-space: nowrap;
}
.youtmus-search button:disabled { opacity: .6; cursor: default; }
.youtmus-chips { display: flex; flex-wrap: wrap; gap: .5rem; }
.youtmus-chips .chip {
  padding: .45rem .9rem; border-radius: 999px; border: 1px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.06); color: rgba(255,255,255,.85); cursor: pointer; font-size: .85rem;
  transition: all .2s ease;
}
.youtmus-chips .chip:hover { border-color: rgba(179,136,255,.5); color: #b388ff; }
.youtmus-chips .chip.active { background: linear-gradient(135deg, #b388ff, #7c4dff); color: #fff; border-color: transparent; }
.youtmus-error {
  display: flex; align-items: center; gap: .5rem; padding: .8rem 1rem; margin-bottom: 1rem;
  border-radius: 12px; background: rgba(255,99,132,.15); border: 1px solid rgba(255,99,132,.4);
  color: #ff6b81; cursor: pointer; font-size: .9rem;
}
.youtmus-loading { display: flex; align-items: center; justify-content: center; gap: .6rem; padding: 3rem 0; color: rgba(255,255,255,.6); font-size: 1.05rem; }
.youtmus-results-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
.youtmus-results-head h3 { display: flex; align-items: center; gap: .5rem; margin: 0; color: #fff; cursor: pointer; }
.youtmus-results-head h3:hover { color: #b388ff; }
.yt-count { color: rgba(255,255,255,.5); font-size: .85rem; }
.youtmus-empty { display: flex; flex-direction: column; align-items: center; gap: .8rem; padding: 3rem 1rem; color: rgba(255,255,255,.55); text-align: center; }
.youtmus-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.1rem; }
.yt-card {
  display: flex; flex-direction: column; text-align: left; border-radius: 14px; overflow: hidden;
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); cursor: pointer;
  transition: transform .2s ease, border-color .2s ease, background .2s ease;
}
.yt-card:hover { transform: translateY(-3px); border-color: rgba(179,136,255,.55); background: rgba(255,255,255,.09); }
.yt-thumb { position: relative; padding-top: 56.25%; background: #000; }
.yt-thumb img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.yt-dur {
  position: absolute; right: .45rem; bottom: .45rem; padding: .15rem .45rem; border-radius: 6px;
  background: rgba(0,0,0,.8); color: #fff; font-size: .8rem; font-weight: 600; letter-spacing: .02em;
}
.yt-play {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,.25); color: #fff; opacity: 0; transition: opacity .2s ease;
}
.yt-card:hover .yt-play { opacity: 1; }
.yt-play .app-icon { filter: drop-shadow(0 0 8px rgba(179,136,255,.9)); }
.yt-info { padding: .7rem .8rem .8rem; }
.yt-title { margin: 0 0 .3rem; font-size: .93rem; font-weight: 600; color: #fff; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.yt-sub { margin: .15rem 0 0; font-size: .8rem; color: rgba(255,255,255,.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.youtmus-player { display: flex; flex-direction: column; gap: 1rem; }
.yt-player-top { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.yt-back {
  display: inline-flex; align-items: center; gap: .4rem; padding: .55rem 1rem; border-radius: 10px;
  border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.07); color: #fff; cursor: pointer; font-size: .9rem;
}
.yt-back:hover { border-color: rgba(179,136,255,.5); color: #b388ff; }
.yt-kind { color: rgba(255,255,255,.55); font-size: .85rem; font-style: italic; }
.yt-frame-wrap { position: relative; padding-top: 56.25%; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(179,136,255,.2); }
.yt-frame-wrap iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
.yt-meta { display: flex; flex-direction: column; gap: .8rem; }
.yt-meta h3 { margin: 0; color: #fff; font-size: 1.25rem; }
.yt-channel { display: flex; align-items: center; gap: .55rem; color: rgba(255,255,255,.8); font-size: .95rem; }
.yt-avatar { display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #b388ff, #7c4dff); color: #fff; }
.yt-stats { display: flex; flex-wrap: wrap; gap: .5rem 1.1rem; color: rgba(255,255,255,.75); font-size: .88rem; }
.yt-stats span { display: inline-flex; align-items: center; gap: .35rem; }
.yt-actions .yt-open {
  display: inline-flex; align-items: center; gap: .4rem; padding: .6rem 1.1rem; border-radius: 10px;
  background: linear-gradient(135deg, #ff4d4d, #c62828); color: #fff; font-size: .9rem; font-weight: 600;
}
.yt-open .app-icon { color: #fff; }
.yt-desc {
  margin: 0; color: rgba(255,255,255,.75); font-size: .92rem; line-height: 1.6;
  max-height: 190px; overflow-y: auto; white-space: pre-wrap; background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.1); border-radius: 12px; padding: .8rem 1rem;
}
.yt-desc.muted { color: rgba(255,255,255,.5); }

/* YOUTMUS hero + equalizer + playlists + picker + analytics */
.youtmus-hero {
  position: relative; overflow: hidden; border-radius: 20px; padding: 1.4rem 1.5rem;
  background: radial-gradient(ellipse at top left, rgba(179,136,255,.35), transparent 55%),
    radial-gradient(ellipse at bottom right, rgba(124,77,255,.28), transparent 55%),
    linear-gradient(135deg, rgba(124,77,255,.16), rgba(255,64,129,.12), rgba(0,204,255,.10));
  border: 1px solid rgba(179,136,255,.4);
  box-shadow: 0 8px 34px rgba(124,77,255,.18);
  margin-bottom: 1.1rem;
}
.youtmus-hero-inner { position: relative; z-index: 2; display: flex; flex-direction: column; gap: 1rem; }
.yt-notes-float { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 1; }
.yt-notes-float .note {
  position: absolute; font-size: 2.1rem; color: rgba(179,136,255,.35);
  animation: noteFloat 9s ease-in-out infinite;
}
.yt-notes-float .note.n1 { top: 12%; left: 6%; animation-delay: 0s; }
.yt-notes-float .note.n2 { top: 55%; left: 16%; font-size: 1.4rem; animation-delay: 1.4s; }
.yt-notes-float .note.n3 { top: 20%; right: 10%; animation-delay: 2.6s; }
.yt-notes-float .note.n4 { bottom: 12%; right: 22%; font-size: 1.6rem; animation-delay: 3.8s; }
.yt-notes-float .note.n5 { top: 62%; right: 4%; animation-delay: 5s; }
@keyframes noteFloat {
  0%, 100% { transform: translateY(0) rotate(-8deg); opacity: .7; }
  50% { transform: translateY(-18px) rotate(10deg); opacity: 1; }
}
.yt-eq { position: absolute; right: 26px; bottom: 18px; display: flex; align-items: flex-end; gap: 4px; height: 34px; z-index: 1; }
.yt-eq span {
  width: 5px; border-radius: 3px; background: linear-gradient(to top, #7c4dff, #ff4d6d);
  animation: eqBounce 1.1s ease-in-out infinite; opacity: .85;
}
.yt-eq span:nth-child(1) { height: 45%; animation-delay: 0s; }
.yt-eq span:nth-child(2) { height: 80%; animation-delay: .15s; }
.yt-eq span:nth-child(3) { height: 55%; animation-delay: .3s; }
.yt-eq span:nth-child(4) { height: 100%; animation-delay: .45s; }
.yt-eq span:nth-child(5) { height: 62%; animation-delay: .6s; }
.yt-eq span:nth-child(6) { height: 85%; animation-delay: .75s; }
@keyframes eqBounce {
  0%, 100% { transform: scaleY(.55); } 50% { transform: scaleY(1); }
}
.yt-logo-disc {
  display: flex; align-items: center; justify-content: center; width: 52px; height: 52px; flex-shrink: 0;
  border-radius: 50%; color: #fff;
  background: conic-gradient(from 0deg, #b388ff, #7c4dff, #ff4d6d, var(--primary), #b388ff);
  box-shadow: 0 0 22px rgba(179,136,255,.6); animation: discSpin 8s linear infinite;
}
@keyframes discSpin { to { transform: rotate(360deg); } }
.yt-player-top-right { display: flex; align-items: center; gap: .8rem; }
.yt-add-btn {
  display: inline-flex; align-items: center; gap: .4rem; padding: .5rem .95rem; border-radius: 10px;
  border: 1px solid rgba(179,136,255,.5); background: rgba(179,136,255,.14); color: #b388ff;
  cursor: pointer; font-size: .9rem; font-weight: 600; transition: all .2s ease;
}
.yt-add-btn:hover { background: rgba(179,136,255,.28); }
.yt-add-btn.big { padding: .6rem 1.1rem; }
.yt-card-actions { display: flex; justify-content: flex-end; margin-top: .5rem; }
.yt-list-btn {
  display: inline-flex; align-items: center; gap: .3rem; padding: .3rem .6rem; border-radius: 8px;
  border: 1px solid rgba(179,136,255,.4); background: rgba(179,136,255,.1); color: #b388ff;
  font-size: .78rem; font-weight: 700; transition: all .2s ease;
}
.yt-list-btn:hover { background: rgba(179,136,255,.3); }

.yt-pl-section { margin-bottom: 1.4rem; }
.yt-pl-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: .7rem; }
.yt-pl-head h3 { margin: 0; color: #fff; display: flex; align-items: center; gap: .5rem; }
.yt-pl-new {
  display: inline-flex; align-items: center; gap: .4rem; padding: .5rem .9rem; border-radius: 10px; cursor: pointer;
  background: linear-gradient(135deg, #b388ff, #7c4dff); color: #fff; font-size: .85rem; font-weight: 700; border: none;
}
.yt-pl-new:hover { filter: brightness(1.12); }
.yt-pl-strip { display: flex; gap: .9rem; overflow-x: auto; padding-bottom: .4rem; }
.yt-pl-card {
  position: relative; min-width: 260px; max-width: 300px; border-radius: 14px; border: 1px solid rgba(179,136,255,.35);
  background: rgba(255,255,255,.06); overflow: hidden; transition: border-color .2s ease;
}
.yt-pl-card:hover, .yt-pl-card.open { border-color: rgba(179,136,255,.7); }
.yt-pl-main { display: flex; align-items: center; gap: .7rem; padding: .8rem .9rem; cursor: pointer; }
.yt-pl-bounce {
  display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; flex-shrink: 0;
  border-radius: 12px; color: #fff; background: linear-gradient(135deg, #b388ff, #7c4dff);
}
.yt-pl-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.yt-pl-info strong { color: #fff; font-size: .95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.yt-pl-info small { color: rgba(255,255,255,.55); font-size: .78rem; }
.yt-pl-chevron { color: rgba(255,255,255,.6); font-size: .8rem; }
.yt-pl-del {
  position: absolute; top: .55rem; right: .55rem; display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 8px; border: none; cursor: pointer;
  background: rgba(255,99,132,.18); color: #ff6b81;
}
.yt-pl-del:hover { background: rgba(255,99,132,.34); }
.yt-pl-songs { border-top: 1px solid rgba(255,255,255,.1); padding: .4rem; max-height: 320px; overflow-y: auto; }
.yt-pl-song {
  position: relative; display: flex; align-items: center; gap: .6rem; width: 100%; text-align: left;
  padding: .45rem .5rem; border-radius: 10px; border: none; background: transparent; cursor: pointer;
}
.yt-pl-song:hover { background: rgba(255,255,255,.08); }
.yt-pl-song img { width: 44px; height: 30px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
.yt-pl-song-t { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.yt-pl-song-t strong { color: #fff; font-size: .82rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.yt-pl-song-t small { color: rgba(255,255,255,.5); font-size: .7rem; }
.yt-pl-playi { color: #b388ff; flex-shrink: 0; }
.yt-pl-remove {
  display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 6px;
  color: rgba(255,255,255,.5); cursor: pointer; flex-shrink: 0;
}
.yt-pl-remove:hover { color: #ff6b81; background: rgba(255,99,132,.2); }
.yt-pl-empty { padding: .8rem; color: rgba(255,255,255,.55); font-size: .82rem; }
.yt-pl-empty-big { padding: .9rem 1.1rem; border-radius: 12px; border: 1px dashed rgba(179,136,255,.45); color: rgba(255,255,255,.65); font-size: .9rem; background: rgba(179,136,255,.06); }
.yt-pl-empty-big strong { color: #b388ff; }

.yt-picker-overlay {
  position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center;
  background: rgba(5,5,15,.72); backdrop-filter: blur(4px); padding: 1rem;
}
.yt-picker {
  width: min(420px, 100%); max-height: 80vh; overflow-y: auto; border-radius: 18px; padding: 1.1rem;
  background: #14142b; border: 1px solid rgba(179,136,255,.4); box-shadow: 0 14px 50px rgba(0,0,0,.5);
}
.yt-picker-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: .6rem; }
.yt-picker-head h3 { margin: 0; color: #fff; display: flex; align-items: center; gap: .5rem; }
.yt-picker-x {
  display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 9px;
  border: none; cursor: pointer; background: rgba(255,255,255,.08); color: #fff;
}
.yt-picker-x:hover { background: rgba(255,255,255,.16); }
.yt-picker-song { margin: 0 0 .8rem; color: #b388ff; font-size: .85rem; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.yt-picker-form { display: flex; gap: .5rem; margin-bottom: .8rem; }
.yt-picker-form input {
  flex: 1; padding: .6rem .8rem; border-radius: 10px; border: 1px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.08); color: #fff; font-size: .9rem; outline: none;
}
.yt-picker-form input:focus { border-color: rgba(179,136,255,.6); }
.yt-picker-create {
  display: inline-flex; align-items: center; gap: .35rem; padding: .6rem .85rem; border-radius: 10px; border: none;
  cursor: pointer; color: #fff; font-weight: 700; font-size: .85rem;
  background: linear-gradient(135deg, #b388ff, #7c4dff); white-space: nowrap;
}
.yt-picker-create:disabled { opacity: .6; cursor: default; }
.yt-picker-list { display: flex; flex-direction: column; gap: .4rem; }
.yt-picker-item {
  display: flex; align-items: center; gap: .6rem; padding: .6rem .8rem; border-radius: 10px; cursor: pointer;
  border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.06); color: #fff; font-size: .9rem; text-align: left;
}
.yt-picker-item:hover { border-color: rgba(179,136,255,.5); background: rgba(179,136,255,.12); }
.yt-picker-item .app-icon { color: #b388ff; }
.yt-picker-item span { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.yt-picker-item small { color: rgba(255,255,255,.5); font-size: .75rem; }
.yt-picker-item:disabled { opacity: .6; cursor: default; }
.yt-picker-empty { padding: .6rem .3rem; color: rgba(255,255,255,.5); font-size: .85rem; }

.analytics-bars { display: flex; align-items: flex-end; justify-content: space-between; gap: .6rem; height: 170px; padding: .4rem 0 .2rem; }
.analytics-bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: .3rem; height: 100%; }
.analytics-bar-track { flex: 1; width: 100%; display: flex; align-items: flex-end; justify-content: center; background: rgba(255,255,255,.04); border-radius: 8px; }
.analytics-bar {
  width: 70%; max-width: 44px; border-radius: 8px 8px 4px 4px; min-height: 6px;
  background: linear-gradient(to top, #7c4dff, #b388ff); position: relative; transition: height .5s ease;
}
.analytics-bar span { position: absolute; top: -20px; left: 50%; transform: translateX(-50%); color: #b388ff; font-size: .7rem; font-weight: 700; }
.analytics-bar-col small { color: rgba(255,255,255,.55); font-size: .72rem; text-transform: uppercase; }
.analytics-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.admin-simple-list { display: flex; flex-direction: column; gap: .4rem; }
.admin-simple-row {
  display: flex; align-items: center; gap: .7rem; padding: .5rem .7rem; border-radius: 10px;
  background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08);
}
.admin-simple-row .rank {
  display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; flex-shrink: 0;
  border-radius: 8px; background: rgba(179,136,255,.16); color: #b388ff; font-size: .75rem; font-weight: 800;
}
.admin-simple-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.admin-simple-main strong { color: #fff; font-size: .88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.admin-simple-main small { color: rgba(255,255,255,.5); font-size: .75rem; }
.admin-simple-count { color: #b388ff; font-size: .85rem; font-weight: 700; white-space: nowrap; }

/* Persistent YOUTMUS player + mini bar */
.yt-player-pane {
  position: relative; z-index: 5; margin-bottom: 1.4rem; padding: 1rem 1.1rem;
  border-radius: 20px; border: 1px solid rgba(179,136,255,.45);
  background: radial-gradient(ellipse at top left, rgba(179,136,255,.22), transparent 55%), rgba(10,10,26,.92);
  box-shadow: 0 14px 44px rgba(124,77,255,.28);
}
.yt-pane-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: .8rem; }
.yt-pane-now {
  display: inline-flex; align-items: center; gap: .45rem; color: #7cffb2; font-size: .78rem; font-weight: 800;
  letter-spacing: .18em;
}
.yt-pane-now .app-icon { animation: pulseDot 1.6s ease-in-out infinite; }
@keyframes pulseDot { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
.yt-pane-close {
  display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 9px;
  border: none; cursor: pointer; background: rgba(255,255,255,.08); color: #fff;
}
.yt-pane-close:hover { background: rgba(255,99,132,.25); color: #ff6b81; }
.yt-pane-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(300px, .85fr); gap: 1.1rem; }
.yt-player-box { position: absolute; inset: 0; width: 100%; height: 100%; }
.yt-pane-title { font-size: 1.2rem; }
.yt-pane-ctl {
  display: inline-flex; align-items: center; gap: .4rem; padding: .6rem 1.1rem; border-radius: 10px;
  border: 1px solid rgba(124,255,178,.5); background: rgba(124,255,178,.12); color: #7cffb2;
  cursor: pointer; font-size: .9rem; font-weight: 700; transition: all .2s ease;
}
.yt-pane-ctl:hover { background: rgba(124,255,178,.24); }

.yt-minibar {
  position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%); z-index: 260;
  display: flex; align-items: center; gap: .7rem; width: min(560px, calc(100% - 24px));
  padding: .5rem .7rem; border-radius: 16px;
  background: rgba(14,14,34,.96); border: 1px solid rgba(179,136,255,.5);
  box-shadow: 0 12px 40px rgba(0,0,0,.55), 0 0 24px rgba(179,136,255,.25);
}
.yt-minibar > img { width: 46px; height: 46px; border-radius: 10px; object-fit: cover; flex-shrink: 0; }
.yt-mini-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.yt-mini-info strong { color: #fff; font-size: .85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.yt-mini-info small { color: rgba(255,255,255,.55); font-size: .75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.yt-mini-eq { display: flex; align-items: flex-end; gap: 2px; height: 16px; }
.yt-mini-eq span { width: 3px; border-radius: 2px; background: linear-gradient(to top, #7cffb2, var(--accent2)); animation: eqBounce 1s ease-in-out infinite; }
.yt-mini-eq span:nth-child(1) { height: 55%; animation-delay: 0s; }
.yt-mini-eq span:nth-child(2) { height: 100%; animation-delay: .18s; }
.yt-mini-eq span:nth-child(3) { height: 70%; animation-delay: .36s; }
.yt-mini-ctl, .yt-mini-open, .yt-mini-close {
  display: flex; align-items: center; justify-content: center; border-radius: 10px; border: none; cursor: pointer; flex-shrink: 0;
}
.yt-mini-ctl {
  width: 38px; height: 38px; background: linear-gradient(135deg, #b388ff, #7c4dff); color: #fff;
}
.yt-mini-ctl:hover { filter: brightness(1.12); }
.yt-mini-open { width: 32px; height: 32px; background: rgba(255,77,77,.16); color: #ff5b5b; }
.yt-mini-open:hover { background: rgba(255,77,77,.3); }
.yt-mini-close { width: 32px; height: 32px; background: rgba(255,255,255,.08); color: rgba(255,255,255,.8); }
.yt-mini-close:hover { background: rgba(255,99,132,.25); color: #ff6b81; }
.yt-minibar-enter-active, .yt-minibar-leave-active { transition: all .35s cubic-bezier(.21,1.02,.73,1); }
.yt-minibar-enter-from, .yt-minibar-leave-to { opacity: 0; transform: translate(-50%, 40px); }

@media (max-width: 720px) {
  .youtmus-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: .8rem; }
  .youtmus-title h2 { font-size: 1.3rem; }
  .analytics-row { grid-template-columns: 1fr; }
  .yt-player-top { flex-direction: column; align-items: flex-start; }
  .yt-player-top-right { width: 100%; justify-content: space-between; }
  .yt-pl-card { min-width: 220px; }
  .yt-pane-grid { grid-template-columns: 1fr; }
  .yt-mini-info strong { max-width: 160px; }
}
.auth-form { display: grid; gap: .9rem; }
.input-group { position: relative; }
.password-group { position: relative; }
.password-toggle {
  position: absolute;
  top: 50%;
  right: 1rem;
  transform: translateY(-50%);
  border: none;
  background: rgba(255,255,255,0.12);
  color: #fff;
  padding: .45rem .9rem;
  border-radius: 999px;
  cursor: pointer;
  transition: background .2s ease, transform .2s ease;
  font-size: .85rem;
}
.password-toggle:hover {
  background: rgba(255,255,255,0.2);
  transform: translateY(-50%) scale(1.02);
}
.glow-input {
  width: 100%;
  padding: 1rem 1rem;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.1);
  outline: none;
  background: rgba(255,255,255,.05);
  color: #fff;
  transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
}
.glow-input::placeholder { color: rgba(255,255,255,.45); }
.glow-input:focus, .glow-input:focus-visible {
  border-color: rgba(0,204,255,.55);
  box-shadow: 0 0 0 3px rgba(0,204,255,.14), 0 0 24px rgba(0,204,255,.15);
  background: rgba(255,255,255,.07);
}
.input-glow { position: absolute; inset: auto 0 0 0; height: 2px; background: linear-gradient(90deg, transparent, var(--primary), var(--accent), transparent); opacity: .8; }
.auth-btn.primary { padding: 1rem; border-radius: 14px; background: linear-gradient(135deg, var(--primary), var(--accent2)); color: #001018; }
.forgot-password { text-align: center; margin: .25rem 0 0; }
.forgot-link { background: none; color: var(--primary); text-decoration: underline; padding: 0; }

.reset-link-box {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid rgba(0,204,255,0.3);
  background: rgba(0,204,255,0.08);
  border-radius: 16px;
  display: grid;
  gap: 0.6rem;
  text-align: center;
  justify-items: center;
}

.reset-link-box .success-message { margin: 0; }

.reset-raw-link {
  color: #8fe8ff;
  font-size: 0.72rem;
  word-break: break-all;
  max-width: 100%;
  text-align: center;
  opacity: 0.9;
}

.reset-dev-note { color: rgba(255,255,255,0.55); font-size: 0.78rem; margin: 0; display: flex; align-items: center; gap: 0.3rem; text-align: left; }
.demo-info, .success-message, .error-message { text-align: center; }
.demo-link { color: var(--accent2); cursor: pointer; }
.success-message { color: var(--accent2); font-weight: 700; }
.error-message { color: #ff6b8b; font-weight: 700; }
.contact-hero { padding: 2rem 1.5rem; margin-bottom: 1.5rem; text-align: center; background: linear-gradient(135deg, rgba(0,204,255,.15), rgba(255,0,68,.12)); border-radius: 28px; box-shadow: 0 20px 80px rgba(0,204,255,.12); }
.contact-hero .hero-title {
  font-size: clamp(2rem, 4vw, 3rem);
  letter-spacing: 0.02em;
  background: linear-gradient(120deg, #7ee7ff 0%, #c3a6ff 35%, var(--accent2) 70%, #7ee7ff 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  animation: heroShine 6s ease-in-out infinite;
}
.contact-hero .hero-subtitle { color: rgba(255,255,255,.8); }
@keyframes heroShine {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
.contact-card-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1.5rem;
  justify-items: center;
  margin-bottom: 1.5rem;
}
.contact-card-grid::before {
  content: '';
  position: absolute;
  inset: -20px;
  background: radial-gradient(600px circle at var(--contact-x) var(--contact-y), rgba(0,204,255,.14), transparent 40%);
  pointer-events: none;
  transition: background .15s ease;
}
.contact-card {
  position: relative;
  width: 100%;
  max-width: 260px;
  border-radius: 26px;
  padding: 2rem 1.5rem 1.4rem;
  text-align: center;
  cursor: pointer;
  background: linear-gradient(160deg, rgba(255,255,255,.09), rgba(255,255,255,.03));
  backdrop-filter: blur(18px);
  box-shadow: 0 24px 60px rgba(0,0,0,.35);
  overflow: hidden;
  animation: contactFloat 6s ease-in-out infinite;
  transition: transform .3s ease, box-shadow .3s ease;
}
.contact-card:nth-child(2) { animation-delay: 1.5s; }
.contact-card:nth-child(3) { animation-delay: 3s; }
.contact-card:nth-child(4) { animation-delay: 4.5s; }
.contact-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 26px;
  padding: 1.5px;
  background: conic-gradient(from 0deg, var(--border), transparent 90deg, transparent 270deg, var(--border) 360deg);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  animation: orbitSpin 7s linear infinite;
}
.contact-card:hover { transform: translateY(-10px) scale(1.03); box-shadow: 0 36px 90px var(--glow); }
.card-glow {
  position: absolute;
  top: 32%;
  left: 50%;
  width: 210px;
  height: 210px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, var(--glow) 0%, transparent 65%);
  filter: blur(46px);
  opacity: .5;
  transition: opacity .3s ease, transform .3s ease;
}
.contact-card:hover .card-glow { opacity: .95; transform: translate(-50%, -50%) scale(1.25); }
.contact-icon {
  position: relative;
  z-index: 2;
  width: 78px;
  height: 78px;
  margin: 0 auto .9rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  background: var(--brand);
  box-shadow: 0 14px 34px var(--glow);
  animation: iconPulse 3s ease-in-out infinite;
}
.contact-card h3 { position: relative; z-index: 2; margin: 0 0 .25rem; color: #fff; font-size: 1.15rem; letter-spacing: .03em; }
.contact-card p { position: relative; z-index: 2; margin: 0; color: rgba(255,255,255,.85); font-size: .88rem; word-break: break-word; }
.tap-hint {
  position: relative;
  z-index: 2;
  display: inline-block;
  margin-top: .85rem;
  padding: .3rem .8rem;
  border-radius: 999px;
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .09em;
  text-transform: uppercase;
  color: rgba(255,255,255,.9);
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.18);
  transition: background .3s ease, box-shadow .3s ease;
}
.contact-card:hover .tap-hint { background: var(--border); color: #001018; box-shadow: 0 8px 20px var(--glow); }
@keyframes iconPulse {
  0%, 100% { box-shadow: 0 14px 34px var(--glow); transform: scale(1); }
  50% { box-shadow: 0 20px 48px var(--glow); transform: scale(1.07); }
}
.email-card { --brand: linear-gradient(135deg, #34d0ff, #0072ff); --border: #34d0ff; --glow: rgba(52,208,255,.5); }
.phone-card { --brand: linear-gradient(135deg, #00ffa3, #00a868); --border: #00ffa3; --glow: rgba(0,230,160,.5); }
.whatsapp-card { --brand: linear-gradient(135deg, #4ce583, #128c4a); --border: #25d366; --glow: rgba(37,211,102,.5); }
.instagram-card { --brand: linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5); --border: #d62976; --glow: rgba(214,41,118,.5); }
.login-required-card {
  padding: 2rem;
  border-radius: 24px;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.14);
  backdrop-filter: blur(16px);
  text-align: center;
  margin-bottom: 1.5rem;
}
.login-required-card h2 { margin-bottom: 0.75rem; }
.login-required-card p { color: rgba(255,255,255,.78); margin-bottom: 1.25rem; }
.login-link {
  background: none;
  border: none;
  color: var(--accent2);
  text-decoration: underline;
  cursor: pointer;
}
.comment-login-prompt {
  margin-bottom: 1rem;
  padding: 1rem 1.2rem;
  border-radius: 18px;
  background: rgba(0,204,255,.08);
  border: 1px solid rgba(0,204,255,.18);
  color: #e8f9ff;
}
.comment-login-prompt p { margin: 0; }

.login-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: linear-gradient(135deg, #0a0b1e 0%, #1a1b2e 50%, #010204 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.login-splash {
  position: relative;
  text-align: center;
  padding: 2rem;
  max-width: 600px;
  z-index: 10;
}

.splash-stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.splash-star {
  position: absolute;
  width: 2px;
  height: 2px;
  background: white;
  border-radius: 50%;
}

.splash-content {
  position: relative;
  z-index: 20;
}

.splash-title {
  font-size: clamp(2.5rem, 6vw, 4rem);
  color: #fff;
  margin-bottom: 1rem;
  background: linear-gradient(90deg, var(--primary), var(--accent), #8a2be2, var(--accent2));
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: colorShift 8s ease infinite;
}

.splash-subtitle {
  font-size: 1.2rem;
  color: rgba(255,255,255,.8);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.splash-btn {
  padding: 1.2rem 2rem;
  border-radius: 50px;
  background: linear-gradient(135deg, var(--primary), var(--accent2));
  color: #001018;
  font-weight: 800;
  font-size: 1.1rem;
  border: none;
  cursor: pointer;
  transition: transform .3s ease, box-shadow .3s ease;
  margin-right: 1rem;
}

.splash-btn:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 20px 40px rgba(0,204,255,.3);
}

.splash-secondary {
  padding: 1rem 1.5rem;
  border-radius: 50px;
  background: rgba(255,255,255,.1);
  color: #fff;
  border: 1px solid rgba(255,255,255,.2);
  cursor: pointer;
  transition: transform .3s ease;
}

.splash-secondary:hover {
  transform: translateY(-2px);
  background: rgba(255,255,255,.15);
}

.theme-label {
  color: #fff;
  margin-bottom: 0.5rem;
  display: block;
}

@keyframes colorShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }

@keyframes colorShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulseRing { 0%,100% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(1.08); opacity: 0.95; } }
@keyframes floatContact { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

@media (max-width: 768px) {
  .header-inner { flex-direction: column; align-items: flex-start; }
  .search-glow-box { flex-direction: column; }
  .movie-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
}

/* New styles for additional features */
.profile-container, .watchlists-container, .movie-details-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
}

.profile-card, .watchlists-card, .movie-details-card {
  border-radius: 24px;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.08);
  backdrop-filter: blur(14px);
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.profile-form, .watchlist-form {
  display: grid;
  gap: 1rem;
  margin-bottom: 2rem;
}

.profile-sections {
  display: grid;
  gap: 2rem;
}

.profile-section h3, .cast-section h3, .similar-section h3, .reviews-section h3 {
  color: var(--accent2);
  margin-bottom: 1rem;
}

.history-list, .reviews-list {
  display: grid;
  gap: 0.75rem;
}

.history-item, .review-item {
  padding: 0.9rem 1rem;
  border-radius: 16px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.08);
}

.favorites-grid, .rec-grid, .similar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.fav-card, .rec-card, .similar-card {
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: transform .25s ease;
}

.fav-card:hover, .rec-card:hover, .similar-card:hover {
  transform: translateY(-4px);
}

.fav-card img, .rec-card img, .similar-card img {
  width: 100%;
  height: 225px;
  object-fit: cover;
}

.watchlists-list {
  display: grid;
  gap: 1rem;
}

.watchlist-item {
  padding: 1rem;
  border-radius: 16px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.08);
}

.list-movies {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.5rem 0;
}

.list-movie {
  flex: 0 0 100px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
}

.list-movie img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.no-poster-small {
  width: 100%;
  height: 150px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(0,204,255,.2), rgba(255,0,68,.2));
  color: #fff;
  font-size: 0.8rem;
  text-align: center;
  padding: 0.5rem;
}

.movie-header {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.movie-poster {
  width: 100%;
  border-radius: 16px;
}

.movie-info h2 {
  color: #fff;
  margin-bottom: 1rem;
}

.movie-info p {
  color: rgba(255,255,255,.8);
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.details-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.cast-list {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding: 1rem 0;
}

.cast-item {
  flex: 0 0 150px;
  text-align: center;
}

.cast-item img {
  width: 100%;
  height: 225px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 0.5rem;
}

.admin-panel {
  border-radius: 24px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.admin-hero {
  margin-bottom: 1.5rem;
}

.admin-hero h2 {
  margin: 0 0 0.5rem;
}

.admin-hero p {
  color: rgba(255,255,255,0.75);
}

.admin-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.admin-card {
  padding: 1.2rem;
  background: rgba(0,204,255,0.12);
  border: 1px solid rgba(0,204,255,0.14);
  border-radius: 18px;
  text-align: center;
}

.admin-card h3 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
}

.admin-card p {
  font-size: 2rem;
  margin: 0;
}

.admin-section {
  margin-bottom: 1.75rem;
}

.admin-user-list,
.movie-view-list {
  display: grid;
  gap: 1rem;
}

.admin-user-card,
.movie-view-item {
  padding: 1rem;
  border-radius: 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.admin-user-card div {
  display: grid;
  gap: 0.15rem;
}

.admin-label {
  color: rgba(255,255,255,0.65);
  font-size: 0.8rem;
}

.admin-delete-btn {
  border: none;
  background: linear-gradient(135deg, #ff416c, #ff4b2b);
  color: #fff;
  padding: 0.8rem 1rem;
  border-radius: 14px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.admin-delete-btn:hover {
  transform: translateY(-1px);
}

.admin-empty {
  padding: 1rem;
  border-radius: 16px;
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.75);
}

.admin-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.admin-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1rem;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.85);
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all .2s ease;
}

.admin-tab:hover { background: rgba(0,204,255,0.12); }

.admin-tab.active {
  background: linear-gradient(135deg, var(--primary), var(--accent2));
  color: #00131c;
  border-color: transparent;
  font-weight: 600;
}

.admin-tab-panel { animation: fadeSlide .3s ease; }

.admin-toolbar {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}

.admin-toolbar .input-group { flex: 1; min-width: 220px; }

.btn-download-blue {
  border: 1px solid rgba(0,204,255,0.5);
  background: rgba(0,204,255,0.12);
  color: #b3f0ff;
  padding: 0.65rem 1rem;
  border-radius: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: all .2s ease;
}

.btn-download-blue:hover { background: rgba(0,204,255,0.22); }

.admin-user-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border-radius: 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
}

.admin-user-row + .admin-user-row { margin-top: 0.65rem; }

.admin-user-main { display: flex; align-items: center; gap: 0.85rem; flex: 1; min-width: 0; }

.admin-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--accent2));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00131c;
  font-size: 1.2rem;
  flex-shrink: 0;
  object-fit: cover;
}

.admin-user-meta {
  display: grid;
  gap: 0.15rem;
  min-width: 0;
}

.admin-user-meta strong {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-user-meta span { color: rgba(255,255,255,0.6); font-size: 0.82rem; }

.admin-meta { display: inline-flex; align-items: center; gap: 0.3rem; }

.admin-user-badges { display: flex; gap: 0.4rem; flex-wrap: wrap; justify-content: flex-end; }

.admin-chip {
  font-size: 0.72rem;
  padding: 0.28rem 0.6rem;
  border-radius: 999px;
  white-space: nowrap;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.85);
}

.chip-admin { background: rgba(255,215,0,0.18); color: #ffd700; }
.chip-user { background: rgba(255,255,255,0.08); color: #9be8ff; }
.chip-on { background: rgba(0,255,136,0.15); color: #2aff9b; }
.chip-off { background: rgba(255,65,108,0.18); color: #ff7094; }
.chip-premium { background: rgba(0,204,255,0.18); color: #4de3ff; }
.chip-trial { background: rgba(255,180,0,0.15); color: #ffc94d; }

.admin-date { color: rgba(255,255,255,0.45); font-size: 0.78rem; white-space: nowrap; }

.admin-user-card {
  padding: 1.1rem;
  border-radius: 18px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.admin-user-card:first-child { display:flex; }

.admin-user-card:hover { border-color: rgba(0,204,255,0.25); }

.admin-user-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.admin-action {
  border: 1px solid rgba(255,255,255,0.16);
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.9);
  padding: 0.45rem 0.75rem;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition: all .2s ease;
}

.admin-action:hover { background: rgba(0,204,255,0.15); }

.admin-action.danger:hover { background: rgba(255,65,108,0.2); border-color: rgba(255,65,108,0.4); }

.admin-action:disabled { opacity: 0.4; cursor: not-allowed; }

.admin-hint { font-size: 0.8rem; color: rgba(255,255,255,0.5); font-weight: 400; }

.admin-settings-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.admin-field { display: grid; gap: 0.4rem; }

.admin-field.full { grid-column: 1 / -1; }

.admin-field span {
  color: rgba(255,255,255,0.7);
  font-size: 0.85rem;
}

.admin-field .glow-input,
.admin-field textarea {
  width: 100%;
  box-sizing: border-box;
  resize: vertical;
}

.admin-savebar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
}

.admin-saved-tick { color: #2aff9b; font-weight: 600; }

.admin-comments { display: grid; gap: 0.75rem; }

.admin-comment-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border-radius: 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
}

.admin-comment-main { display: grid; gap: 0.2rem; flex: 1; }

.admin-comment-main p { margin: 0.3rem 0 0; color: rgba(255,255,255,0.85); }

.admin-card-sub { color: rgba(255,255,255,0.55); font-size: 0.78rem; }

.admin-badge {
  background: #ff416c;
  color: #fff;
  border-radius: 999px;
  font-size: 0.7rem;
  padding: 0.1rem 0.45rem;
  margin-left: 0.15rem;
  vertical-align: middle;
}

.chip-lifetime { background: rgba(255,215,0,0.25); color: #ffd700; border: 1px solid rgba(255,215,0,0.4); }

.admin-action.lifetime { border-color: rgba(255,215,0,0.4); color: #ffd700; background: rgba(255,215,0,0.1); }
.admin-action.lifetime:hover { background: rgba(255,215,0,0.2); }

.admin-toolbar-title { color: rgba(255,255,255,0.85); font-weight: 600; flex: 1; }

.admin-support-list { display: grid; gap: 1rem; }

.admin-support-card {
  padding: 1.1rem;
  border-radius: 18px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  display: grid;
  gap: 0.75rem;
}

.admin-support-card.resolved { opacity: 0.75; border-color: rgba(255,255,255,0.12); }

.admin-support-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  border-top: 1px solid rgba(255,255,255,0.08);
  padding-top: 0.75rem;
}

.support-reply-input { flex: 1; min-width: 200px; }

.support-item-head { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }

.support-msg { color: rgba(255,255,255,0.8); white-space: pre-wrap; margin: 0.25rem 0; }

.support-reply {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 0.6rem 0.8rem;
  display: grid;
  gap: 0.2rem;
  font-size: 0.88rem;
}

.support-reply.admin { background: rgba(0,204,255,0.1); border-color: rgba(0,204,255,0.2); }

.support-reply p { margin: 0.1rem 0 0; color: rgba(255,255,255,0.9); }

.support-reply strong { color: rgba(255,255,255,0.75); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; }

.support-date { color: rgba(255,255,255,0.4); font-size: 0.72rem; }

.support-card {
  margin-top: 1.75rem;
  padding: 1.25rem;
  border-radius: 20px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
}

.support-card h3 { margin: 0 0 0.25rem; }

.support-sub { color: rgba(255,255,255,0.6); margin: 0 0 1rem; font-size: 0.9rem; }

.support-form { display: grid; gap: 0.75rem; margin-bottom: 1.25rem; }

.my-support-list { display: grid; gap: 0.9rem; margin-top: 1rem; }

.support-item {
  padding: 1rem;
  border-radius: 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  display: grid;
  gap: 0.6rem;
}

.support-item-head strong { font-size: 0.95rem; }

.sub-lifetime { color: #ffd700; position: relative; padding: 0.35rem 0.6rem; border: 1px solid rgba(255,215,0,0.35); border-radius: 10px; background: rgba(255,215,0,0.1); display: inline-block; }

.advanced-filters {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.advanced-filters .glow-input {
  flex: 1;
  min-width: 120px;
}

.ai-chat-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 2000;
}

.chat-toggle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--accent2));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0,204,255,.3);
  transition: transform .3s ease, box-shadow .3s ease;
}

.chat-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 32px rgba(0,204,255,.4);
}

.chat-icon {
  font-size: 24px;
}

.chat-window {
  width: 350px;
  height: 500px;
  background: rgba(10,11,30,0.95);
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,.1);
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 60px rgba(0,0,0,.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  padding: 1rem;
  border-bottom: 1px solid rgba(255,255,255,.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header h3 {
  margin: 0;
  color: #fff;
  font-size: 1.1rem;
}

.chat-close {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background .2s ease;
}

.chat-close:hover {
  background: rgba(255,255,255,.1);
}

.chat-messages {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.chat-message {
  max-width: 80%;
}

.chat-message.user {
  align-self: flex-end;
}

.chat-message.assistant {
  align-self: flex-start;
}

.message-content {
  padding: 0.75rem 1rem;
  border-radius: 18px;
  font-size: 0.9rem;
  line-height: 1.4;
}

.chat-message.user .message-content {
  background: linear-gradient(135deg, var(--primary), var(--accent2));
  color: #001018;
}

.chat-message.assistant .message-content {
  background: rgba(255,255,255,.1);
  color: #fff;
  border: 1px solid rgba(255,255,255,.1);
}

.chat-input-area {
  padding: 1rem;
  border-top: 1px solid rgba(255,255,255,.1);
  display: flex;
  gap: 0.5rem;
}

.chat-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 25px;
  border: 1px solid rgba(255,255,255,.2);
  background: rgba(255,255,255,.05);
  color: #fff;
  outline: none;
  font-size: 0.9rem;
}

.chat-input::placeholder {
  color: rgba(255,255,255,.6);
}

.chat-send {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--accent2));
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform .2s ease;
}

.chat-send:hover:not(:disabled) {
  transform: scale(1.1);
}

.chat-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .ai-chat-widget {
    bottom: 10px;
    right: 10px;
  }
  .chat-window {
    width: calc(100vw - 20px);
    height: calc(100vh - 100px);
    max-width: none;
  }
}

.app-footer {
  background: linear-gradient(180deg, rgba(5,7,25,0.95) 0%, rgba(10,11,30,0.95) 75%);
  border-top: 1px solid rgba(255,255,255,0.12);
  padding: 2rem 1rem 1rem;
  margin-top: 2rem;
  box-shadow: inset 0 1px 30px rgba(0,0,0,0.25);
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.75rem;
  margin-bottom: 1.5rem;
}

.footer-section {
  padding: 1.25rem 1rem;
  border-radius: 18px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(12px);
  min-height: 180px;
}

.footer-section h4 {
  color: #70f9d9;
  margin-bottom: 1rem;
  font-size: 1.15rem;
  letter-spacing: 0.5px;
}

.footer-section p,
.footer-section li {
  color: rgba(255,255,255,0.82);
  margin-bottom: 0.65rem;
  line-height: 1.7;
}

.footer-section li {
  position: relative;
  padding-left: 1.4rem;
}

.footer-section li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #70f9d9;
  font-size: 0.9rem;
  top: 0.1rem;
}

.footer-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-link {
  color: #bfe8ff;
  text-decoration: none;
  transition: color 0.2s ease, transform 0.2s ease;
}

.footer-link:hover {
  color: #ffe061;
  transform: translateX(2px);
}

.footer-theme-select {
  width: 100%;
  padding: 0.75rem 0.85rem;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.08);
  color: #fff;
  outline: none;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.02);
}

.footer-theme-select option {
  background: #0a0b1e;
  color: #fff;
}

.footer-cta-row {
  max-width: 1400px;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1rem 1rem 0;
}

.footer-cta-text p {
  color: rgba(255,255,255,0.8);
  font-size: 0.98rem;
  margin: 0;
}

.footer-cta-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.footer-cta-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.85rem 1.35rem;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.18);
  background: rgba(114, 255, 214, 0.12);
  color: #e8fbff;
  text-decoration: none;
  font-weight: 600;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.footer-cta-btn.secondary {
  background: rgba(255, 255, 255, 0.08);
}

.footer-cta-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(255,255,255,0.3);
  background: rgba(114, 255, 214, 0.18);
}

.footer-bottom {
  text-align: center;
  border-top: 1px solid rgba(255,255,255,0.08);
  padding-top: 1rem;
}

.footer-bottom p {
  color: rgba(255,255,255,0.6);
  font-size: 0.9rem;
  margin: 0;
}

.download-options {
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 16px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.08);
}

.download-options h4 {
  margin: 0 0 1rem 0;
  color: #fff;
  font-size: 1.1rem;
}

.download-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.download-option {
  flex: 1;
  min-width: 120px;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(0,204,255,.2), rgba(255,255,255,.1));
  color: #fff;
  border: 1px solid rgba(255,255,255,.15);
  cursor: pointer;
  transition: transform .25s ease, box-shadow .25s ease, background .25s ease;
  font-weight: 600;
  text-align: center;
}

.download-option:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 24px rgba(0,204,255,.25);
  background: linear-gradient(135deg, rgba(0,204,255,.3), rgba(255,255,255,.15));
}

.download-note {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 12px;
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.05);
  font-size: 0.9rem;
  color: rgba(255,255,255,.7);
  line-height: 1.5;
}

@media (max-width: 768px) {
  .footer-cta-row {
    flex-direction: column;
    align-items: stretch;
  }

  .footer-cta-buttons {
    justify-content: flex-start;
  }
}

/* ---------- Modern UI additions ---------- */

.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(172px, 1fr));
  gap: 1.05rem;
}

.movie-grid-inner {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(172px, 1fr));
  gap: 1.05rem;
  grid-column: 1 / -1;
  width: 100%;
}

@media (max-width: 1024px) {
  .movie-grid, .movie-grid-inner { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: .9rem; }
}

@media (max-width: 768px) {
  .movie-grid, .movie-grid-inner { grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap: .75rem; }
}

/* Staggered card entrance on infinite scroll */
.card-enter-active {
  transition: opacity .55s cubic-bezier(.22, .8, .36, 1),
              transform .55s cubic-bezier(.22, .8, .36, 1),
              filter .55s ease;
  transition-delay: calc(var(--card-index, 0) * 30ms);
}
.card-enter-from {
  opacity: 0;
  transform: translateY(26px) scale(.92);
  filter: blur(6px);
}
.card-leave-active {
  transition: opacity .25s ease;
}
.card-leave-to {
  opacity: 0;
}
.card-move {
  transition: transform .4s ease;
}

/* Page-level entrance */
.hero-section, .search-section, .movies-section, .collection-section,
.cinema-hall-container, .auth-container, .new-contact-container,
.profile-container, .watchlists-container, .movie-details-container,
.admin-panel {
  animation: pageIn .55s cubic-bezier(.22, .8, .36, 1) both;
}
@keyframes pageIn {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Browse collections */
.collection-section {
  max-width: 1500px;
  margin: 0 auto 1.5rem;
}
.browse-row {
  margin-bottom: 1.6rem;
}
.row-enter-active, .row-appear-active {
  transition: opacity .55s ease, transform .55s ease;
}
.row-enter-from, .row-appear-from {
  opacity: 0;
  transform: translateY(16px);
}
.browse-row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: .75rem;
}
.browse-row-title {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  margin: 0;
  color: #fff;
  font-size: 1.15rem;
  letter-spacing: .01em;
}
.browse-row-title .app-icon {
  color: var(--primary);
}
.browse-row-meta {
  color: rgba(255,255,255,.5);
  font-size: .78rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.browse-row-track {
  display: flex;
  gap: .85rem;
  overflow-x: auto;
  padding: .35rem .15rem .9rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,204,255,.4) transparent;
}
.browse-poster {
  flex: 0 0 145px;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  aspect-ratio: 2 / 3;
  background: rgba(255,255,255,.06);
  cursor: pointer;
  transition: transform .3s ease, box-shadow .3s ease;
}
.browse-poster:hover {
  transform: translateY(-6px) scale(1.03);
  box-shadow: 0 18px 42px rgba(0,204,255,.22);
}
.browse-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.browse-no-poster {
  font-size: .8rem;
}
.browse-poster-overlay {
  position: absolute;
  inset: auto 0 0 0;
  padding: .5rem .6rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: .4rem;
  background: linear-gradient(to top, rgba(5,6,18,.9), transparent);
  opacity: 0;
  transition: opacity .25s ease;
}
.browse-poster:hover .browse-poster-overlay { opacity: 1; }
.browse-score {
  display: inline-flex;
  align-items: center;
  gap: .3rem;
  color: #ffe061;
  font-size: .78rem;
  font-weight: 700;
  background: rgba(0,0,0,.55);
  padding: .3rem .55rem;
  border-radius: 999px;
}
.browse-play {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--primary), var(--accent2));
  color: #001018;
  cursor: pointer;
  transition: transform .2s ease;
}
.browse-play:hover { transform: scale(1.12); }

/* Genre dropdown */
.genre-dropdown {
  position: relative;
  min-width: 160px;
}
.genre-dropdown-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: .55rem;
  padding: .9rem 1rem;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.1);
  background: rgba(255,255,255,.05);
  color: #fff;
  cursor: pointer;
  outline: none;
  transition: border-color .2s ease, background .2s ease;
}
.genre-dropdown-btn:hover {
  border-color: rgba(0,204,255,.4);
  background: rgba(255,255,255,.08);
}
.genre-dropdown-label { flex: 1; text-align: left; font-size: .9rem; }
.genre-caret { color: rgba(255,255,255,.5); transform: rotate(90deg); transition: transform .25s ease; }
.genre-dropdown.open .genre-caret { transform: rotate(-90deg); }
.genre-dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 100%;
  z-index: 30;
  background: rgba(10,11,30,.97);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 14px;
  padding: .4rem;
  display: grid;
  gap: .15rem;
  box-shadow: 0 18px 40px rgba(0,0,0,.5);
  max-height: 280px;
  overflow-y: auto;
}
.genre-option {
  display: flex;
  align-items: center;
  gap: .6rem;
  padding: .55rem .7rem;
  border: none;
  background: transparent;
  color: rgba(255,255,255,.85);
  border-radius: 9px;
  cursor: pointer;
  text-align: left;
  transition: background .15s ease, color .15s ease;
}
.genre-option:hover { background: rgba(0,204,255,.14); color: #fff; }
.genre-option.active { background: linear-gradient(135deg, rgba(0,204,255,.25), rgba(255,0,68,.18)); color: #fff; }
.genre-check { margin-left: auto; color: var(--accent2); }
.dropdown-enter-active, .dropdown-leave-active { transition: opacity .2s ease, transform .2s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px); }

/* Filter fields with icons */
.filter-field {
  position: relative;
  flex: 1;
  min-width: 120px;
}
.filter-field > .app-icon {
  position: absolute;
  left: .9rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255,255,255,.45);
  pointer-events: none;
  z-index: 2;
}
.filter-field .glow-input { padding-left: 2.4rem; }
.advanced-filters .glow-input { min-width: 120px; }

/* Button icon alignment */
.btn-icon { color: inherit; margin-right: .35rem; }
.pill .app-icon, .tab-btn .app-icon, .mode-btn .app-icon,
.download-btn .app-icon, .exit-hall-btn .app-icon, .back-btn .app-icon,
.footer-cta-btn .app-icon, .download-option .app-icon, .details-actions .app-icon,
.splash-secondary .app-icon, .banner-btn .app-icon { vertical-align: -2px; }
.btn-watch-gradient .app-icon, .btn-trailer-red .app-icon,
.btn-download-blue .app-icon, .search-action-btn .app-icon, .splash-btn .app-icon {
  vertical-align: -1px;
  margin-right: .3rem;
}
.pill .app-icon, .tab-btn .app-icon, .mode-btn .app-icon { margin-right: .35rem; }

/* Live recording dot */
.live-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: .3rem;
  border-radius: 50%;
  background: #ff4d6d;
  animation: livePulse 1.4s ease-in-out infinite;
}
@keyframes livePulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,77,109,.6); }
  50% { box-shadow: 0 0 0 6px rgba(255,77,109,0); }
}

/* Toast notifications */
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 4000;
  max-width: 360px;
}
.toast-stack { display: grid; gap: .6rem; }
.toast {
  display: flex;
  align-items: flex-start;
  gap: .6rem;
  padding: .8rem 1rem;
  border-radius: 14px;
  background: rgba(10,11,30,.95);
  border: 1px solid rgba(255,255,255,.12);
  backdrop-filter: blur(14px);
  box-shadow: 0 12px 34px rgba(0,0,0,.45);
  color: #fff;
  font-size: .88rem;
}
.toast.success { border-color: rgba(0,255,136,.4); }
.toast.warning { border-color: rgba(255,224,97,.4); }
.toast.danger { border-color: rgba(255,77,109,.4); }
.toast.info { border-color: rgba(0,204,255,.4); }
.toast.success .toast-icon { color: var(--accent2); }
.toast.warning .toast-icon { color: #ffe061; }
.toast.danger .toast-icon { color: #ff4d6d; }
.toast.info .toast-icon { color: var(--primary); }
.toast-icon { flex-shrink: 0; margin-top: .1rem; }
.toast-message { flex: 1; line-height: 1.5; }
.toast-close {
  background: none;
  border: none;
  color: rgba(255,255,255,.5);
  cursor: pointer;
  padding: .15rem;
  transition: color .2s ease, transform .2s ease;
}
.toast-close:hover { color: #fff; transform: scale(1.15); }
.toast-enter-active, .toast-leave-active { transition: all .4s cubic-bezier(.22, .8, .36, 1); }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(30px); }

/* Back to top */
.back-to-top {
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,.15);
  background: linear-gradient(135deg, rgba(0,204,255,.25), rgba(255,0,68,.2));
  backdrop-filter: blur(12px);
  color: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
  box-shadow: 0 12px 30px rgba(0,0,0,.4);
  transition: transform .25s ease, box-shadow .25s ease;
  z-index: 1500;
}
.back-to-top:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 40px rgba(0,204,255,.3);
}

/* Floating Home button — visible on every page */
.home-fab {
  position: fixed; right: 2rem; bottom: 6rem; z-index: 1500;
  width: 54px; height: 54px; border-radius: 50%;
  border: 1px solid rgba(255,255,255,.2);
  background: linear-gradient(135deg, var(--primary), var(--accent)); color: #00131c;
  display: grid; place-items: center; cursor: pointer;
  box-shadow: 0 12px 32px rgba(0,204,255,.45);
  transition: transform .25s ease, box-shadow .25s ease;
}
.home-fab::before {
  content: ''; position: absolute; inset: -5px; border-radius: 50%;
  border: 1px solid var(--primary); opacity: .5;
  animation: homePulse 2.2s ease-out infinite;
}
.home-fab:hover { transform: translateY(-3px) scale(1.07); box-shadow: 0 18px 44px rgba(0,204,255,.6); }
@keyframes homePulse {
  0% { transform: scale(.85); opacity: .6; }
  100% { transform: scale(1.35); opacity: 0; }
}
.home-fab-tip {
  position: absolute; right: calc(100% + .6rem); top: 50%;
  transform: translateY(-50%);
  padding: .3rem .65rem; border-radius: 8px; white-space: nowrap;
  background: rgba(10,11,30,.95); border: 1px solid rgba(255,255,255,.16);
  color: #fff; font-size: .72rem; font-weight: 700;
  opacity: 0; pointer-events: none;
  transition: opacity .2s ease, transform .2s ease;
}
.home-fab:hover .home-fab-tip { opacity: 1; transform: translateY(-50%) translateX(-5px); }
.fade-enter-active, .fade-leave-active { transition: opacity .3s ease, transform .3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(10px); }

/* Icon containers that previously held emojis */
.contact-icon {
  color: #fff;
}
.chat-icon .app-icon { color: #001018; }
.card-badge {
  display: inline-flex;
  align-items: center;
  gap: .3rem;
}
.card-badge .app-icon { color: #ffe061; }
.footer-link .app-icon { vertical-align: -2px; margin-right: .15rem; }

@media (max-width: 768px) {
  .toast-container { top: .6rem; right: .6rem; left: .6rem; max-width: none; }
  .back-to-top { bottom: 1rem; left: 1rem; }
  .home-fab { right: 1rem; bottom: 5rem; }
}

/* ---------- Premium pill (header) ---------- */
.premium-pill {
  display: inline-flex; align-items: center; gap: .45rem;
  background: linear-gradient(135deg, #ffd166, #f4a261, #ff7b54) !important;
  color: #231a06 !important; font-weight: 700;
  box-shadow: 0 0 18px rgba(255,209,102,.45);
}
.premium-pill:hover { box-shadow: 0 0 28px rgba(255,209,102,.7); }
.premium-pill.active { box-shadow: 0 0 30px rgba(255,209,102,.8); }

/* ---------- YOUTMUS playing state ---------- */
.yt-thumb-veil {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, transparent 55%, rgba(0,0,0,.55));
  pointer-events: none;
}
.yt-dur { display: inline-flex; align-items: center; gap: .25rem; }
.yt-card.playing {
  border-color: var(--accent2);
  box-shadow: 0 0 0 1px var(--accent2), 0 10px 30px rgba(0,255,136,.12);
}
.yt-card.playing .yt-thumb img { filter: saturate(1.25) brightness(.9); }
.yt-now-eq {
  position: absolute; left: .6rem; top: .6rem;
  display: flex; align-items: flex-end; gap: 3px; height: 16px;
  padding: 3px 5px; border-radius: 6px;
  background: rgba(0,0,0,.55); backdrop-filter: blur(4px);
}
.yt-now-eq span {
  width: 3px; background: var(--accent2); border-radius: 2px;
  animation: eqBounce 1s ease-in-out infinite;
}
.yt-now-eq span:nth-child(1) { animation-delay: 0s; }
.yt-now-eq span:nth-child(2) { animation-delay: .15s; }
.yt-now-eq span:nth-child(3) { animation-delay: .3s; }
.yt-now-eq span:nth-child(4) { animation-delay: .45s; }
@keyframes eqBounce {
  0%, 100% { transform: scaleY(.45); }
  50% { transform: scaleY(1); }
}

/* ---------- Premium page ---------- */
.premium-page { max-width: 1180px; margin: 0 auto 2.5rem; animation: pageIn .55s both; }
.premium-hero { text-align: center; padding: 2.5rem 1.2rem 1.6rem; }
.premium-badges { display: flex; justify-content: center; gap: .6rem; flex-wrap: wrap; margin-bottom: 1rem; }
.premium-badge {
  display: inline-flex; align-items: center; gap: .35rem; padding: .35rem .8rem; border-radius: 999px;
  font-size: .75rem; font-weight: 800; letter-spacing: .12em;
  background: linear-gradient(135deg, rgba(255,209,102,.2), rgba(255,123,84,.2));
  border: 1px solid rgba(255,209,102,.45); color: #ffd166;
}
.premium-badge:nth-child(2) { border-color: rgba(0,255,136,.45); color: var(--accent2); background: linear-gradient(135deg, rgba(0,255,136,.15), rgba(0,255,136,.05)); }
.premium-title { font-size: clamp(2.2rem, 6vw, 3.4rem); margin: 0 0 .7rem; }
.premium-title span { background: linear-gradient(135deg, #ffd166, #ff7b54, var(--accent2)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.premium-subtitle { max-width: 640px; margin: 0 auto 1.2rem; color: rgba(255,255,255,.7); font-size: 1.02rem; }
.premium-perks { display: flex; justify-content: center; gap: .8rem 1.4rem; flex-wrap: wrap; }
.premium-perks span { display: inline-flex; align-items: center; gap: .35rem; color: rgba(255,255,255,.85); font-size: .88rem; }
.premium-perks .app-icon { color: var(--accent2); }

.plans-wrap { display: grid; grid-template-columns: repeat(auto-fit, minmax(255px, 1fr)); gap: 1.1rem; margin: 2rem 0; }
.plan-card {
  position: relative; display: flex; flex-direction: column; gap: .9rem; padding: 1.4rem;
  border-radius: 20px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.05);
  cursor: pointer; transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
}
.plan-card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,.28); }
.plan-card.chosen { border-color: var(--accent2); box-shadow: 0 0 0 1px var(--accent2), 0 14px 40px rgba(0,255,136,.14); }
.plan-card.featured { border-color: rgba(255,209,102,.5); background: linear-gradient(160deg, rgba(255,209,102,.1), rgba(255,255,255,.04)); }
.plan-badge {
  position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
  padding: .28rem .8rem; border-radius: 999px; font-size: .7rem; font-weight: 800; letter-spacing: .1em;
  background: linear-gradient(135deg, #ffd166, #f4a261); color: #231a06;
  box-shadow: 0 6px 18px rgba(255,209,102,.4); white-space: nowrap;
}
.plan-top { display: flex; align-items: center; justify-content: space-between; }
.plan-top h3 { margin: 0; display: flex; align-items: center; gap: .4rem; font-size: 1.05rem; }
.plan-tag { font-size: .7rem; font-weight: 800; letter-spacing: .1em; color: var(--accent2); text-transform: uppercase; }
.plan-card.featured .plan-tag { color: #ffd166; }
.plan-price { display: flex; align-items: baseline; gap: .45rem; flex-wrap: wrap; }
.plan-price strong { font-size: 2.1rem; background: linear-gradient(135deg, #fff, rgba(255,255,255,.7)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.plan-price span { color: rgba(255,255,255,.6); font-size: .9rem; }
.plan-eq { margin: .1rem 0 0; font-size: .78rem; color: #ffd166; display: flex; align-items: center; gap: .3rem; }
.plan-feats { list-style: none; margin: 0; padding: 0; display: grid; gap: .45rem; }
.plan-feats li { display: flex; align-items: center; gap: .4rem; font-size: .85rem; color: rgba(255,255,255,.85); }
.plan-feats .app-icon { color: var(--accent2); }
.plan-btn {
  margin-top: auto; padding: .7rem 1rem; border: none; border-radius: 12px; cursor: pointer;
  background: linear-gradient(135deg, var(--primary), var(--accent)); color: #00131c;
  font-weight: 800; display: inline-flex; align-items: center; justify-content: center; gap: .4rem;
  transition: transform .2s ease, box-shadow .2s ease;
}
.plan-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(0,204,255,.3); }
.plan-btn.ghost { background: rgba(255,255,255,.08); color: rgba(255,255,255,.6); cursor: default; }
.plan-btn.ghost:hover { transform: none; box-shadow: none; }

.pay-box {
  border-radius: 22px; padding: 1.6rem;
  border: 1px solid rgba(255,255,255,.12);
  background: linear-gradient(160deg, rgba(255,255,255,.07), rgba(255,255,255,.03));
  box-shadow: 0 20px 60px rgba(0,0,0,.3);
  max-width: 760px; margin: 0 auto 2rem;
}
.pay-head h3 { margin: 0 0 .3rem; display: flex; align-items: center; gap: .45rem; }
.pay-head p { margin: 0 0 1.1rem; color: rgba(255,255,255,.65); font-size: .9rem; }
.pay-methods { display: grid; gap: .6rem; margin-bottom: 1.2rem; }
.pay-method {
  display: flex; align-items: center; gap: .8rem; padding: .85rem 1rem; width: 100%;
  border-radius: 14px; cursor: pointer; text-align: left;
  border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.05); color: #fff;
  transition: border-color .2s ease, background .2s ease, transform .2s ease;
}
.pay-method:hover { border-color: rgba(255,255,255,.3); }
.pay-method.active { border-color: var(--accent2); background: rgba(0,255,136,.08); box-shadow: 0 0 0 1px var(--accent2); }
.pay-method > span:first-of-type { display: grid; gap: .1rem; flex: 1; }
.pay-method small { color: rgba(255,255,255,.55); font-size: .78rem; }
.pay-check { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; background: var(--accent2); color: #00130a; }
.pay-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.1rem; }
.pay-fields label { display: block; margin-bottom: .35rem; font-size: .8rem; color: rgba(255,255,255,.7); }
.pay-summary { display: grid; gap: .4rem; padding: .9rem 1rem; border-radius: 12px; background: rgba(0,0,0,.25); margin-bottom: 1.1rem; font-size: .88rem; color: rgba(255,255,255,.75); }
.pay-summary strong { color: #fff; }
.pay-btn {
  width: 100%; padding: .95rem 1rem; border: none; border-radius: 14px; cursor: pointer;
  background: linear-gradient(135deg, #ffd166, #f4a261, #ff7b54); color: #231a06;
  font-size: 1.02rem; font-weight: 900; display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
  transition: transform .2s ease, box-shadow .2s ease;
}
.pay-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 34px rgba(255,209,102,.35); }
.pay-btn:disabled { opacity: .6; cursor: not-allowed; }
.pay-status { margin-top: 1.1rem; display: grid; gap: .5rem; }
.pay-step { display: flex; align-items: center; gap: .55rem; font-size: .86rem; color: rgba(255,255,255,.55); }
.pay-step-n {
  width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; flex-shrink: 0;
  font-size: .72rem; font-weight: 800; border: 1px solid rgba(255,255,255,.25); color: rgba(255,255,255,.5);
}
.pay-step.done { color: rgba(255,255,255,.9); }
.pay-step.done .pay-step-n { background: var(--accent2); border-color: var(--accent2); color: #00130a; box-shadow: 0 0 12px rgba(0,255,136,.5); }
.momo-note { margin-top: 1rem; display: flex; align-items: flex-start; gap: .4rem; font-size: .78rem; color: rgba(255,255,255,.55); }

/* ---------- Admin Themes tab ---------- */
.admin-toolbar-title { display: inline-flex; align-items: center; gap: .45rem; font-weight: 700; color: var(--accent2); }
.theme-preview-note { display: inline-flex; align-items: center; gap: .4rem; padding: .5rem .9rem; border-radius: 10px; margin: 0 0 1.1rem; font-size: .84rem; border: 1px dashed rgba(255,209,102,.5); background: rgba(255,209,102,.08); color: rgba(255,255,255,.85); }
.theme-preview-note .app-icon { color: #ffd166; }
.admin-theme-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 1rem; }
.admin-theme-card {
  border-radius: 16px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.04);
  overflow: hidden; cursor: pointer; display: grid; gap: .7rem; padding-bottom: .8rem;
  transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
}
.admin-theme-card:hover { transform: translateY(-3px); border-color: rgba(255,255,255,.3); }
.admin-theme-card.active { border-color: var(--accent2); box-shadow: 0 0 0 1px var(--accent2), 0 12px 30px rgba(0,255,136,.12); }
.admin-theme-card.previewing { border-color: #ffd166; box-shadow: 0 0 0 1px #ffd166, 0 12px 30px rgba(255,209,102,.16); }
.theme-card-preview { position: relative; height: 92px; display: flex; align-items: center; gap: .4rem; padding: 0 .9rem; overflow: hidden; }
.theme-card-dot { width: 30px; height: 30px; border-radius: 50%; background: rgba(255,255,255,.9); box-shadow: 0 0 0 4px rgba(255,255,255,.2); flex-shrink: 0; }
.theme-card-line { height: 7px; width: 70px; border-radius: 99px; background: rgba(255,255,255,.5); }
.theme-card-line.short { width: 42px; }
.theme-card-chip { position: absolute; top: .55rem; right: .6rem; display: inline-flex; align-items: center; gap: .3rem; padding: .18rem .45rem; border-radius: 999px; background: rgba(0,0,0,.45); font-size: .6rem; font-family: monospace; color: #fff; }
.theme-card-chip span { width: 8px; height: 8px; border-radius: 50%; }
.theme-card-glow { position: absolute; width: 120px; height: 120px; border-radius: 50%; filter: blur(46px); opacity: .55; bottom: -60px; right: -20px; }
.theme-card-name { display: flex; align-items: center; gap: .4rem; padding: 0 .9rem; }
.theme-card-name strong { font-size: .9rem; }
.theme-card-name em { font-style: normal; font-size: .72rem; color: var(--accent2); }
.theme-swatch { width: 14px; height: 14px; border-radius: 50%; border: 1px solid rgba(255,255,255,.2); flex-shrink: 0; }
.admin-theme-apply {
  margin: 0 .9rem; padding: .55rem .8rem; border: none; border-radius: 10px; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center; gap: .35rem;
  background: linear-gradient(135deg, var(--accent2), var(--primary)); color: #00130a; font-weight: 800; font-size: .8rem;
  transition: transform .2s ease, box-shadow .2s ease;
}
.admin-theme-apply:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(0,255,136,.28); }
.admin-theme-apply:disabled { opacity: .6; cursor: not-allowed; }

/* ---------- Distinct Command-Center look for the Admin panel ---------- */
html[data-admin="on"] .admin-panel {
  border-top: 3px solid #ffd166;
  box-shadow: 0 0 0 1px rgba(255,209,102,.18), 0 30px 80px rgba(0,0,0,.45);
  background: linear-gradient(180deg, rgba(255,209,102,.06), rgba(255,255,255,.045));
}
html[data-admin="on"] .admin-hero h2 { color: #ffd166; }
html[data-admin="on"] .admin-hero p { color: rgba(255,255,255,.65); }
html[data-admin="on"] .admin-card { background: rgba(255,209,102,.1); border-color: rgba(255,209,102,.28); }
html[data-admin="on"] .admin-metrics .admin-card p { color: #ffd166; }
html[data-admin="on"] .admin-tab { border-color: rgba(255,209,102,.22); }
html[data-admin="on"] .admin-tab:hover { background: rgba(255,209,102,.12); border-color: rgba(255,209,102,.45); }
html[data-admin="on"] .admin-tab.active { background: linear-gradient(135deg, #ffd166, #f4a261); color: #231a06; border-color: transparent; box-shadow: 0 8px 24px rgba(255,209,102,.3); }
html[data-admin="on"] .admin-toolbar-title { color: #ffd166; }
html[data-admin="on"] .admin-section h2,
html[data-admin="on"] .admin-section h3 { color: #ffd166; }
html[data-admin="on"] .glow-input:focus { border-color: #ffd166; box-shadow: 0 0 0 3px rgba(255,209,102,.18); }
html[data-admin="on"] .auth-btn.primary { background: linear-gradient(135deg, #ffd166, #f4a261); color: #231a06; }
html[data-admin="on"] .btn-download-blue { border-color: rgba(255,209,102,.5); background: rgba(255,209,102,.12); color: #ffe9b0; }
html[data-admin="on"] .admin-delete-btn { background: linear-gradient(135deg, #ff7b54, #cf4b33); }
html[data-admin="on"] .admin-saved-tick { color: #ffd166; }
html[data-admin="on"] .admin-user-card,
html[data-admin="on"] .movie-view-item { border-color: rgba(255,209,102,.14); }

@media (max-width: 760px) {
  .pay-fields { grid-template-columns: 1fr; }
  .plans-wrap { grid-template-columns: 1fr; }
  .admin-theme-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
}

/* ---------- Animated 3-dots navigation menu ---------- */
.dots-menu-wrap { position: relative; }
.dots-btn {
  position: relative; width: 46px; height: 46px; border-radius: 999px;
  background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.16);
  cursor: pointer; backdrop-filter: blur(10px); flex-shrink: 0;
  transition: background .25s ease, border-color .25s ease, box-shadow .25s ease, transform .25s ease;
}
.dots-btn .dot {
  position: absolute; left: 50%; margin-left: -2.5px;
  width: 5px; height: 5px; border-radius: 999px;
  background: #fff; box-shadow: 0 0 7px rgba(0,204,255,.8);
  transition: transform .3s cubic-bezier(.34,1.56,.64,1), opacity .22s ease, background .25s ease;
}
.dots-btn .dot:nth-child(1) { top: 11px; }
.dots-btn .dot:nth-child(2) { top: 19.5px; }
.dots-btn .dot:nth-child(3) { top: 28px; }
.dots-btn:hover { border-color: var(--primary); box-shadow: 0 0 20px rgba(0,204,255,.35); transform: scale(1.05); }
.dots-btn:hover .dot:nth-child(1) { transform: translateX(-3px); }
.dots-btn:hover .dot:nth-child(3) { transform: translateX(3px); }
.dots-btn.open { background: linear-gradient(135deg, var(--primary), var(--accent)); border-color: transparent; box-shadow: 0 0 26px rgba(0,204,255,.5); }
.dots-btn.open .dot { background: #00131c; box-shadow: none; }
.dots-btn.open .dot:nth-child(1) { transform: translateY(8.5px) rotate(45deg); }
.dots-btn.open .dot:nth-child(2) { opacity: 0; transform: scale(0); }
.dots-btn.open .dot:nth-child(3) { transform: translateY(-8.5px) rotate(45deg); }

.dots-panel {
  position: absolute; top: calc(100% + .7rem); right: 0; z-index: 1200;
  min-width: 258px; padding: .6rem; border-radius: 18px;
  background: rgba(10,11,30,.97); backdrop-filter: blur(24px);
  border: 1px solid rgba(255,255,255,.14);
  box-shadow: 0 30px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(0,204,255,.08);
  transform-origin: top right;
  display: grid; gap: 2px;
}
.dots-panel-head {
  display: flex; align-items: center; gap: .6rem; padding: .3rem .5rem .6rem;
  border-bottom: 1px solid rgba(255,255,255,.1); margin-bottom: .35rem;
}
.dots-brand-dot {
  width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
  background: conic-gradient(from 180deg, var(--primary), var(--accent), var(--accent2), var(--primary));
  box-shadow: 0 0 16px rgba(0,204,255,.5); animation: discSpin 6s linear infinite;
}
.dots-panel-head strong { display: block; color: #fff; font-size: .95rem; line-height: 1.1; }
.dots-panel-head small { color: rgba(255,255,255,.55); font-size: .72rem; }
.dots-item {
  display: flex; align-items: center; gap: .7rem; padding: .55rem .6rem;
  border-radius: 12px; border: none; background: transparent;
  color: rgba(255,255,255,.9); cursor: pointer; font-size: .92rem; font-weight: 600;
  text-align: left; width: 100%;
  transition: background .18s ease, transform .18s ease, color .18s ease;
}
.dots-item:hover { background: rgba(0,204,255,.12); transform: translateX(3px); color: #fff; }
.dots-item.active { background: linear-gradient(135deg, rgba(0,204,255,.18), rgba(255,0,68,.12)); color: #fff; }
.dots-ic {
  width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0;
  display: grid; place-items: center; background: rgba(255,255,255,.08); color: var(--primary);
  transition: background .2s ease, transform .2s ease;
}
.dots-item:hover .dots-ic { transform: scale(1.1); }
.dots-item.active .dots-ic { background: linear-gradient(135deg, var(--primary), var(--accent)); color: #00131c; }
.dots-ic.premium { background: linear-gradient(135deg, rgba(255,209,102,.2), rgba(255,123,84,.2)); color: #ffd166; }
.dots-ic.danger { background: rgba(225,29,72,.16); color: #ff6b6b; }
.dots-check { margin-left: auto; color: var(--accent2); }
.dots-divider { height: 1px; margin: .3rem .4rem; background: rgba(255,255,255,.1); }
.dots-row { display: flex; align-items: center; justify-content: space-between; gap: .6rem; padding: .5rem .6rem; border-radius: 12px; }
.dots-row:hover { background: rgba(255,255,255,.05); }
.dots-row-info { display: flex; align-items: center; gap: .7rem; }
.dots-row-info strong { font-size: .9rem; color: rgba(255,255,255,.9); }
.dots-row-info .dots-ic { width: 30px; height: 30px; }

.lang-toggle { display: flex; gap: .5rem; padding: .1rem .6rem .5rem; }
.lang-toggle button {
  flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: .35rem;
  padding: .45rem .5rem; border-radius: 10px; cursor: pointer;
  border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.05);
  color: rgba(255,255,255,.8); font-size: .82rem; font-weight: 700;
  transition: border-color .2s ease, background .2s ease, color .2s ease, transform .2s ease;
}
.lang-toggle button:hover { transform: translateY(-1px); border-color: rgba(255,255,255,.35); }
.lang-toggle button.active { border-color: var(--primary); background: rgba(0,204,255,.16); color: #fff; box-shadow: 0 0 0 1px var(--primary); }
.lang-toggle.modal { padding: 0; }

.dots-pop-enter-active { animation: dotsPopIn .28s cubic-bezier(.22,1.3,.36,1) both; }
.dots-pop-leave-active { animation: dotsPopOut .18s ease both; }
@keyframes dotsPopIn {
  from { opacity: 0; transform: scale(.82) translateY(-10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes dotsPopOut {
  to { opacity: 0; transform: scale(.92) translateY(-5px); }
}

/* Compact circular bell (no label text anymore) */
.notif-bell { width: 46px; height: 46px; padding: 0 !important; display: grid; place-items: center; border-radius: 999px; }
.notif-bell .app-icon { color: #fff; }
.notif-bell.active { background: linear-gradient(135deg, rgba(0,204,255,.35), rgba(255,0,68,.3)); }

@media (max-width: 1024px) {
  .nav-pills { flex-wrap: wrap; }
  .dots-panel { position: fixed; top: 5rem; right: 1rem; }
}
@media (max-width: 640px) {
  .dots-panel { min-width: calc(100vw - 2rem); right: 1rem; }
  .theme-swatch-grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); }
  .lang-picker { flex-direction: column; }
}

</style>
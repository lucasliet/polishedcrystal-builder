const API_URL = 'https://api.github.com/repos/lucasliet/polishedcrystal-builder/releases';

function getCachedData() {
  const lastFetch = JSON.parse(sessionStorage.getItem('lastFetch') || '{}');

  const CACHE_TIME = 2 * 60 * 1000;
  if (lastFetch && Date.now() - lastFetch.time < CACHE_TIME) {
    return lastFetch.data;
  }
}

async function fetchReleases() {
  const cachedData = getCachedData();

  if (cachedData) {
    return cachedData;
  }

  const response = await fetch(API_URL);
  const releases = await response.json();

  sessionStorage.setItem('lastFetch', JSON.stringify({ time: Date.now(), data: releases }));
  return releases;
}

async function initializeReleaseDisplay() {
  try {
    const releases = await fetchReleases();
    if (releases.length > 0) {
      displayLatestRelease(releases[0]);
      displayPreviousReleases(releases.slice(1));
    }
  } catch (error) {
    console.error('Erro ao buscar releases:', error);
    document.querySelector('#latest-release').innerHTML = '<p class="error">Erro on loading releases</p>';
  }
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function createReleaseCard(release, isLatest = false) {
  const downloadLinks = release.assets
    .sort((a, b) => {
      function isBsp(asset) {
        return asset.name.endsWith('.bsp');
      }
      return isBsp(a) - isBsp(b);
    })
    .map(asset => `
          <li>
              <a href="${asset.browser_download_url}" class="download-link" target="_blank" rel="noopener noreferrer">
                  ${asset.name}
              </a>
          </li>
      `).join('');

  return `
        <article class="release-card ${isLatest ? 'latest' : 'collapsed'}">
            <div class="release-header">
                <h3 class="release-title">${release.name || release.tag_name}</h3>
                <span class="release-date">Released at ${formatDate(release.published_at)}</span>
            </div>
            <div class="release-content">
                <div class="release-body">${release.body}</div>
                <hr/><br/>
                <h4>Downloads:</h4>
                ${release.assets.length > 0 ? `
                    <ul class="download-list">
                        ${downloadLinks}
                    </ul>
                ` : ''}
            </div>
        </article>
    `;
}

function displayLatestRelease(release) {
  const latestReleaseSection = document.querySelector('#latest-release');
  latestReleaseSection.innerHTML = createReleaseCard(release, true);
}

function setupAccordions() {
  const releaseCards = document.querySelectorAll('.release-card');
  releaseCards.forEach(card => {
    const header = card.querySelector('.release-header');
    header.addEventListener('click', () => {
      card.classList.toggle('collapsed');
    });
  });
}

function displayPreviousReleases(releases) {
  const previousReleasesSection = document.querySelector('#previous-releases');
  if (releases.length > 0) {
    previousReleasesSection.innerHTML = releases
      .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
      .map(release => createReleaseCard(release))
      .join('');
    setupAccordions();
  } else {
    previousReleasesSection.innerHTML = '<p>No release was found.</p>';
  }
}

document.addEventListener('DOMContentLoaded', initializeReleaseDisplay);
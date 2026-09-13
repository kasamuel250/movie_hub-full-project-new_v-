const axios = require('axios');

const getEnrichedMovieData = async (tmdbId) => {
    try {
        // 1. Fetch main data and IMDb ID from TMDB
        const tmdbUrl = `https://api.themoviedb.org/3/movie/${tmdbId}`;
        const tmdbRes = await axios.get(tmdbUrl, {
            params: {
                api_key: process.env.TMDB_KEY, // Uses your existing key from .env
                append_to_response: 'videos,external_ids,credits'
            }
        });
        const movie = tmdbRes.data;

        // 2. Use the IMDb ID to get Ratings from OMDb
        const imdbId = movie.external_ids?.imdb_id;
        let omdbData = {};
        
        if (imdbId) {
            // Your OMDb key: 20baf694
            const omdbUrl = `http://www.omdbapi.com/?i=${imdbId}&apikey=${process.env.OMDB_KEY || '20baf694'}`;
            const omdbRes = await axios.get(omdbUrl);
            omdbData = omdbRes.data;
        }

        // 3. Merge everything into one object for your website
        return {
            ...movie,
            cast: movie.credits?.cast?.slice(0, 10) || [], // Top 10 cast members
            omdbRatings: omdbData.Ratings || [],
            boxOffice: omdbData.BoxOffice || 'N/A',
            awards: omdbData.Awards || 'N/A'
        };
    } catch (error) {
        console.error("Multi-API Fetch Error:", error.message);
        throw error;
    }
};

module.exports = { getEnrichedMovieData };
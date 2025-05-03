// TMDB API Configuration
const API_KEY = "5894c4d2554f72277c2afbef553451a2"
const BASE_URL = "https://api.themoviedb.org/3"
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"
const BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/original"

// DOM Elements
const modal = document.getElementById("movieModal")
const closeModal = document.querySelector(".close-modal")
const modalBody = document.querySelector(".modal-body")
const navbar = document.querySelector(".navbar")
const heroSection = document.querySelector(".hero-section")
// Fix the hero section title element selection
const heroTitle = document.querySelector(".hero-title")
const heroDescription = document.querySelector(".hero-description")
const watchBtn = document.querySelector(".watch-btn")

// Fetch movies from TMDB API
// Improve the fetchMovies function with better error handling
async function fetchMovies(endpoint) {
  try {
    console.log(`Fetching movies from: ${BASE_URL}${endpoint}?api_key=${API_KEY}&language=en-US`)
    const response = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}&language=en-US`)

    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${response.statusText}`)
    }

    const data = await response.json()

    if (!data || !data.results || !Array.isArray(data.results)) {
      console.error("Invalid data format received:", data)
      return []
    }

    console.log(`Successfully fetched ${data.results.length} movies from ${endpoint}`)
    return data.results
  } catch (error) {
    console.error(`Error fetching movies from ${endpoint}:`, error)
    return []
  }
}

// Fetch movie details from TMDB API
async function fetchMovieDetails(movieId) {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US&append_to_response=credits,videos`,
    )
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error(`Error fetching movie details for ID ${movieId}:`, error)
    return null
  }
}

// Fetch movie videos (trailers)
async function fetchMovieVideos(movieId) {
  try {
    const response = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&language=en-US`)
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    const data = await response.json()
    return data.results
  } catch (error) {
    console.error(`Error fetching videos for movie ID ${movieId}:`, error)
    return []
  }
}

// Update hero section with now playing movie
async function updateHeroSection() {
  try {
    // Changed from trending to now_playing
    const nowPlayingMovies = await fetchMovies("/movie/now_playing")
    if (nowPlayingMovies && nowPlayingMovies.length > 0) {
      const featuredMovie = nowPlayingMovies[0] // Get the first now playing movie

      // Update hero background
      if (featuredMovie.backdrop_path) {
        heroSection.style.backgroundImage = `url('${BACKDROP_BASE_URL}${featuredMovie.backdrop_path}')`
      }

      // Update hero content
      heroTitle.textContent = featuredMovie.title
      heroDescription.textContent = featuredMovie.overview

      // Change button text to "WATCH TRAILER"
      if (watchBtn) {
        watchBtn.innerHTML = 'WATCH TRAILER <i class="fas fa-play-circle"></i>'

        // Remove any existing event listeners by cloning and replacing
        const newWatchBtn = watchBtn.cloneNode(true)
        watchBtn.parentNode.replaceChild(newWatchBtn, watchBtn)

        // Add click event to open trailer
        newWatchBtn.addEventListener("click", async () => {
          const videos = await fetchMovieVideos(featuredMovie.id)
          const trailer = videos.find(
            (video) => (video.type === "Trailer" || video.type === "Teaser") && video.site === "YouTube",
          )

          if (trailer) {
            // Open YouTube trailer in a new tab
            window.open(`https://www.youtube.com/watch?v=${trailer.key}`, "_blank")
          } else {
            // If no trailer is found, open movie details
            openMovieDetails(featuredMovie.id)
          }
        })
      }
    } else {
      console.error("No now playing movies found or empty response")
      // Fallback content
      heroTitle.textContent = "Welcome to Poseidon.tv"
      heroDescription.textContent = "Discover the best movies and TV shows all in one place."
    }
  } catch (error) {
    console.error("Error updating hero section:", error)
    // Fallback content
    heroTitle.textContent = "Welcome to Poseidon.tv"
    heroDescription.textContent = "Discover the best movies and TV shows all in one place."
  }
}

// Create movie card element
function createMovieCard(movie) {
  const movieCard = document.createElement("div")
  movieCard.className = "movie-card"
  movieCard.dataset.id = movie.id

  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"

  movieCard.innerHTML = `
        <div class="movie-rating">
            <i class="fas fa-star"></i> ${rating}
        </div>
        <img src="${movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : "/placeholder.svg?height=300&width=200"}" 
             alt="${movie.title}" 
             class="movie-poster">
        <h3 class="movie-title">${movie.title}</h3>
    `

  // Add click event to open modal with movie details
  movieCard.addEventListener("click", () => openMovieDetails(movie.id))

  return movieCard
}

// Open movie details modal
async function openMovieDetails(movieId) {
  const movieDetails = await fetchMovieDetails(movieId)
  if (!movieDetails) return

  const releaseYear = movieDetails.release_date ? new Date(movieDetails.release_date).getFullYear() : ""
  const runtime = movieDetails.runtime
    ? `${Math.floor(movieDetails.runtime / 60)}h ${movieDetails.runtime % 60}m`
    : "N/A"
  const genres = movieDetails.genres.map((genre) => genre.name).join(", ")
  const directors = movieDetails.credits.crew
    .filter((person) => person.job === "Director")
    .map((director) => director.name)
    .join(", ")
  const trailer = movieDetails.videos.results.find((video) => video.type === "Trailer" && video.site === "YouTube")

  modalBody.innerHTML = `
        <div class="movie-detail-header" style="background-image: url('${movieDetails.backdrop_path ? BACKDROP_BASE_URL + movieDetails.backdrop_path : ""}')">
            <div class="movie-detail-info">
                <img src="${movieDetails.poster_path ? IMAGE_BASE_URL + movieDetails.poster_path : "/placeholder.svg?height=300&width=200"}" 
                     alt="${movieDetails.title}" 
                     class="movie-detail-poster">
                <div class="movie-detail-text">
                    <h2 class="movie-detail-title">${movieDetails.title} ${releaseYear ? `(${releaseYear})` : ""}</h2>
                    <div class="movie-detail-meta">
                        <span><i class="fas fa-calendar"></i> ${movieDetails.release_date || "N/A"}</span>
                        <span><i class="fas fa-clock"></i> ${runtime}</span>
                        <span><i class="fas fa-film"></i> ${genres}</span>
                    </div>
                    <div class="movie-detail-rating">
                        <div class="stars">
                            <i class="fas fa-star"></i>
                        </div>
                        <span>${movieDetails.vote_average.toFixed(1)}/10</span>
                        <span>(${movieDetails.vote_count} votes)</span>
                    </div>
                    <p class="movie-detail-overview">${movieDetails.overview}</p>
                    <div class="movie-detail-actions">
                        
                        ${trailer ? `<a href="https://www.youtube.com/watch?v=${trailer.key}" target="_blank" class="btn btn-secondary"><i class="fas fa-film"></i> Watch Trailer</a>` : ""}
                        <button class="btn btn-secondary"><i class="fas fa-plus"></i> Add to List</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="movie-detail-content">
            <div class="movie-detail-section">
                <h3>Cast</h3>
                <div class="cast-list">
                    ${movieDetails.credits.cast
                      .slice(0, 10)
                      .map(
                        (actor) => `
                        <div class="cast-item">
                            <img src="${actor.profile_path ? "https://image.tmdb.org/t/p/w185" + actor.profile_path : "/placeholder.svg?height=80&width=80"}" 
                                 alt="${actor.name}" 
                                 class="cast-avatar">
                            <div class="cast-name">${actor.name}</div>
                            <div class="cast-character">${actor.character}</div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
            <div class="movie-detail-section">
                <h3>Details</h3>
                <p><strong>Director:</strong> ${directors || "N/A"}</p>
                <p><strong>Status:</strong> ${movieDetails.status}</p>
                <p><strong>Budget:</strong> ${movieDetails.budget ? "$" + movieDetails.budget.toLocaleString() : "N/A"}</p>
                <p><strong>Revenue:</strong> ${movieDetails.revenue ? "$" + movieDetails.revenue.toLocaleString() : "N/A"}</p>
                <p><strong>Original Language:</strong> ${movieDetails.original_language?.toUpperCase() || "N/A"}</p>
            </div>
        </div>
    `

  modal.style.display = "block"
  document.body.style.overflow = "hidden"
}

// Close modal
function closeMovieModal() {
  modal.style.display = "none"
  document.body.style.overflow = "auto"
}

// Initialize sliders
// Improve the initializeSliders function to handle empty responses
async function initializeSliders() {
  try {
    // Use top rated movies for the trending section
    const topRatedMovies = await fetchMovies("/movie/top_rated")
    const trendingSlider = document.getElementById("trendingMovies")
    if (trendingSlider && topRatedMovies && topRatedMovies.length > 0) {
      // Clear any existing content
      trendingSlider.innerHTML = ""
      topRatedMovies.forEach((movie) => {
        trendingSlider.appendChild(createMovieCard(movie))
      })
    } else {
      console.error("Trending slider not found or no top rated movies returned")
    }

    // Fetch popular movies
    const popularMovies = await fetchMovies("/movie/popular")
    const popularSlider = document.getElementById("popularMovies")
    if (popularSlider && popularMovies && popularMovies.length > 0) {
      // Clear any existing content
      popularSlider.innerHTML = ""
      popularMovies.forEach((movie) => {
        popularSlider.appendChild(createMovieCard(movie))
      })
    } else {
      console.error("Popular slider not found or no popular movies returned")
    }

    // Fetch top rated movies for the top rated section
    const topRatedMoviesForSection = await fetchMovies("/movie/top_rated")
    const topRatedSlider = document.getElementById("topRatedMovies")
    if (topRatedSlider && topRatedMoviesForSection && topRatedMoviesForSection.length > 0) {
      // Clear any existing content
      topRatedSlider.innerHTML = ""
      topRatedMoviesForSection.forEach((movie) => {
        topRatedSlider.appendChild(createMovieCard(movie))
      })
    } else {
      console.error("Top rated slider not found or no top rated movies returned")
    }
  } catch (error) {
    console.error("Error initializing sliders:", error)
  }
}

// Slider navigation
function initializeSliderControls() {
  const sliders = document.querySelectorAll(".movie-slider")

  sliders.forEach((slider) => {
    const prevBtn = slider.parentElement.querySelector(".prev")
    const nextBtn = slider.parentElement.querySelector(".next")

    nextBtn.addEventListener("click", () => {
      slider.scrollLeft += slider.offsetWidth - 100
    })

    prevBtn.addEventListener("click", () => {
      slider.scrollLeft -= slider.offsetWidth - 100
    })
  })
}

// Smooth scrolling for sliders
// Fix the touchmove event listener in initializeSmoothScrolling
function initializeSmoothScrolling() {
  document.querySelectorAll(".movie-slider").forEach((slider) => {
    let isDown = false
    let startX = 0
    let scrollLeft = 0
    let animationFrame

    const setGrabbing = () => slider.classList.add("grabbing")
    const removeGrabbing = () => slider.classList.remove("grabbing")

    const onMouseDown = (e) => {
      isDown = true
      startX = e.pageX - slider.offsetLeft
      scrollLeft = slider.scrollLeft
      setGrabbing()
    }

    const onMouseMove = (e) => {
      if (!isDown) return
      e.preventDefault()
      const x = e.pageX - slider.offsetLeft
      const walk = (x - startX) * 1.5 // Adjust speed multiplier here
      cancelAnimationFrame(animationFrame)
      animationFrame = requestAnimationFrame(() => {
        slider.scrollLeft = scrollLeft - walk
      })
    }

    const onMouseUpOrLeave = () => {
      isDown = false
      removeGrabbing()
    }

    slider.addEventListener("mousedown", onMouseDown)
    slider.addEventListener("mousemove", onMouseMove)
    slider.addEventListener("mouseup", onMouseUpOrLeave)
    slider.addEventListener("mouseleave", onMouseUpOrLeave)

    // Add touch support for mobile - fix the syntax error
    slider.addEventListener("touchstart", (e) => {
      isDown = true
      startX = e.touches[0].pageX - slider.offsetLeft
      scrollLeft = slider.scrollLeft
    })

    slider.addEventListener("touchmove", (e) => {
      if (!isDown) return
      const x = e.touches[0].pageX - slider.offsetLeft
      const walk = (x - startX) * 1.5
      cancelAnimationFrame(animationFrame)
      animationFrame = requestAnimationFrame(() => {
        slider.scrollLeft = scrollLeft - walk
      })
    })

    slider.addEventListener("touchend", () => (isDown = false))
    slider.addEventListener("touchcancel", () => (isDown = false))
  })
}

// Event listeners
closeModal.addEventListener("click", closeMovieModal)
window.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeMovieModal()
  }
})

// Initialize when DOM is loaded
// Initialize when DOM is loaded - add a small delay to ensure all elements are ready
document.addEventListener("DOMContentLoaded", () => {
  // Add a small delay to ensure DOM is fully loaded
  setTimeout(() => {
    console.log("Initializing application...")
    updateHeroSection() // Update hero section with now playing movie
    initializeSliders()
    initializeSliderControls()
    initializeSmoothScrolling()
    console.log("Application initialized")
  }, 100)
})

// Handle escape key to close modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.style.display === "block") {
    closeMovieModal()
  }
})
